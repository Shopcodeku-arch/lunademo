import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, ChatSummary, ChatSession, UserProfile, ModelVariant, SendOptions } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { CodingSwitchModal } from './components/CodingSwitchModal';
import { UserAvatar } from './components/UserAvatar';
import { StorageService, createDefaultUser } from './services/storage';
import { isCodingRequest } from './utils/codeDetector';
import { streamLunaChat } from './services/lunaAI';
import { extractTikTokUrl, fetchTikTokNoWm, formatTikTokReport } from './services/tiktok';
import { removeBackground } from './utils/removeBackground';
import {
  subscribeAuth,
  signOutFirebase,
  getFirebaseUser,
  uploadChatImageToFirebase,
  addFirebaseMessage,
} from './services/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelVariant>('standard');
  // Di HP bilah sisi tertutup saat pertama masuk (langsung beranda); di layar lebar terbuka
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCodingModalOpen, setIsCodingModalOpen] = useState(false);
  const [pendingCodingPrompt, setPendingCodingPrompt] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<{
    text: string;
    optionsOrForceModel?: SendOptions | ModelVariant;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Initial User Authentication with Firebase Auth (Google)
  useEffect(() => {
    const unsubscribe = subscribeAuth(async (fbUser) => {
      if (fbUser) {
        const firestoreUser = await getFirebaseUser(fbUser.uid);
        const resolvedUser: UserProfile = {
          uid: fbUser.uid,
          username: fbUser.email?.split('@')[0] || `user_${fbUser.uid.substring(0, 6)}`,
          displayName: fbUser.displayName || firestoreUser?.displayName || 'Pengguna Google',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || firestoreUser?.photoURL || undefined,
          avatarColor: firestoreUser?.avatarColor || '#ffbf48',
          createdAt: firestoreUser?.createdAt || Date.now(),
          lastLoginAt: Date.now(),
          systemPrompt:
            firestoreUser?.systemPrompt ||
            'Identitas Utama: Nama Anda adalah Luna. Anda adalah asisten kecerdasan buatan cerdas yang dibuat dan dikembangkan oleh Gimoy Studio.',
        };
        setCurrentUser(resolvedUser);
        setIsAuthModalOpen(false); // Hilangkan modal login seketika setelah akun Google terhubung
        localStorage.setItem('luna_username', resolvedUser.username);
        fetchChats(resolvedUser);
      } else {
        // Ketika user pertama kali masuk dan belum login via Google, langsung suruh login
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch User Chats whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    fetchChats(currentUser);
  }, [currentUser]);

  const fetchChats = async (userToFetch: UserProfile | null = currentUser) => {
    if (!userToFetch) return;
    try {
      const chatSummaries = await StorageService.listChats(userToFetch);
      setChats(chatSummaries);
      // Tidak membuka obrolan terakhir otomatis: setiap masuk langsung ke beranda
      if (chatSummaries.length === 0) {
        setActiveChatId(null);
        setActiveChat(null);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  // 3. Load specific chat detail
  const loadChat = async (chatId: string, userToFetch: UserProfile | null = currentUser) => {
    if (!userToFetch) return;
    try {
      const chat = await StorageService.getChat(chatId, userToFetch);
      if (chat) {
        setActiveChatId(chatId);
        setActiveChat(chat);
      }
    } catch (err) {
      console.error('Failed to load chat detail:', err);
    }
  };

  // 4. Create New Chat Session
  const handleNewChat = async () => {
    if (!currentUser?.uid) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const newChat = await StorageService.createChat(
        currentUser,
        'Percakapan Baru',
        selectedModel
      );
      setActiveChatId(newChat.id);
      setActiveChat(newChat);
      fetchChats(currentUser);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // 5. Send Prompt with Real-Time Streaming & Seamless Offline/Vercel Fallback
  // 5. Send Prompt with Real-Time Streaming & Seamless Offline/Vercel Fallback
  const handleSendMessage = async (
    messageText: string,
    optionsOrForceModel?: SendOptions | ModelVariant,
    userOverride?: UserProfile
  ) => {
    let activeUser = userOverride || currentUser;
    let forceModel: ModelVariant | undefined;
    let attachedImage = undefined;
    let attachedFile = undefined;
    if (typeof optionsOrForceModel === 'string') {
      forceModel = optionsOrForceModel;
    } else if (optionsOrForceModel && typeof optionsOrForceModel === 'object') {
      forceModel = optionsOrForceModel.forceModel;
      attachedImage = optionsOrForceModel.image;
      attachedFile = optionsOrForceModel.fileAttachment;
    }

    const trimmedText = messageText.trim();
    if ((!trimmedText && !attachedImage && !attachedFile) || isLoading) return;

    const effectiveText =
      trimmedText ||
      (attachedFile
        ? `Tolong bantu saya memeriksa dan memproses lampiran file: ${attachedFile.name}`
        : attachedImage
        ? 'Tolong jelaskan dan analisis gambar ini dengan detail.'
        : '');

    // Pastikan user telah login dengan Google via Firebase
    if (!activeUser || !activeUser.uid) {
      setPendingMessage({ text: effectiveText, optionsOrForceModel });
      setIsAuthModalOpen(true);
      setErrorBanner('Silakan masuk dengan akun Google terlebih dahulu untuk mulai mengobrol.');
      return;
    }

    // Check if user is typing an affirmative reply to the coding switch question (e.g., "Iya, pindah", "pindah", "iya")
    const isAffirmativeCoderSwitch =
      /^(iya(\s*,?\s*pindah)?|ya(\s*,?\s*pindah)?|pindah(\s+ke\s+coding)?|oke(\s+pindah)?|switch(\s+to\s+coder)?|ganti(\s+mode)?|lanjut(kan)?|tolong\s+buatkan|buatkan\s+saja)$/i.test(
        effectiveText
      );

    if (isAffirmativeCoderSwitch && activeChat) {
      const lastAssistantMsg = activeChat.messages.slice().reverse().find((m) => m.role === 'assistant');
      const isRefusalContext =
        lastAssistantMsg &&
        (/tidak mendukung coding/i.test(lastAssistantMsg.content) ||
          /khusus coding/i.test(lastAssistantMsg.content));

      if (isRefusalContext) {
        const lastUserCodingMsg = activeChat.messages
          .slice()
          .reverse()
          .find((m) => m.role === 'user' && isCodingRequest(m.content));

        const promptToRun = lastUserCodingMsg?.content || pendingCodingPrompt;
        if (promptToRun) {
          setSelectedModel('coder');
          if (activeChatId && activeUser) {
            StorageService.updateChat(activeChatId, activeUser.username, { model: 'coder' });
          }
          setPendingCodingPrompt(null);
          await executeSendMessage(promptToRun, 'coder', activeUser);
          return;
        }
      }
    }

    const activeModel = forceModel || selectedModel;

    // Check if user is asking to create a program while model is NOT Luna Coder
    if (activeModel !== 'coder' && !forceModel && isCodingRequest(effectiveText)) {
      setPendingCodingPrompt(effectiveText);
      setIsCodingModalOpen(true);
      return;
    }

    await executeSendMessage(effectiveText, activeModel, activeUser, attachedImage, attachedFile);
  };

  const executeSendMessage = async (
    messageText: string,
    modelToUse: ModelVariant,
    userOverride?: UserProfile,
    attachedImage?: any,
    attachedFile?: any
  ) => {
    const activeUser = userOverride || currentUser || createDefaultUser('pengguna', 'Pengguna');
    setErrorBanner(null);
    setIsLoading(true);
    setStreamingText('');

    let currentTargetId = activeChatId;
    let currentSession = activeChat;

    // If no active chat, create one first
    if (!currentTargetId || !currentSession) {
      try {
        const titleSeed =
          messageText.trim().substring(0, 36) ||
          (attachedFile ? attachedFile.name : attachedImage ? 'Analisis Gambar' : 'Percakapan Baru');
        const newChat = await StorageService.createChat(
          activeUser,
          titleSeed,
          modelToUse
        );
        currentTargetId = newChat.id;
        currentSession = newChat;
        setActiveChatId(currentTargetId);
        setActiveChat(newChat);
      } catch (err) {
        console.error('Error creating chat before send:', err);
        setIsLoading(false);
        return;
      }
    }

    // 1. Immediately create and render optimistic user message with image/file (instant UI response)
    const userMsgId = `temp_user_${Date.now()}`;
    const optimisticUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: messageText,
      createdAt: Date.now(),
      imageUrl: attachedImage?.dataUrl,
      storagePath: attachedImage?.storagePath,
      imageName: attachedImage?.name,
      fileAttachment: attachedFile
        ? {
            name: attachedFile.name,
            size: attachedFile.size || 0,
            type: attachedFile.type,
            dataUrl: attachedFile.dataUrl,
          }
        : undefined,
    };

    const tempAssistantId = `temp_asst_${Date.now()}`;
    const optimisticAssistantMsg: ChatMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      model:
        modelToUse === 'pro'
          ? 'Luna Pro'
          : modelToUse === 'coder'
          ? 'Luna Coder'
          : 'Luna',
      isStreaming: true,
    };

    // Render immediately in chat state
    setActiveChat((prev) => {
      const base = prev || currentSession!;
      return {
        ...base,
        messages: [...base.messages, optimisticUserMsg, optimisticAssistantMsg],
      };
    });

    // Save locally immediately so message is never lost
    StorageService.saveMessageLocally(currentTargetId, activeUser, optimisticUserMsg);

    // 2. In parallel background: upload image to Firebase Storage if signed in and update message
    if (activeUser?.uid && attachedImage && currentTargetId) {
      uploadChatImageToFirebase(
        activeUser.uid,
        currentTargetId,
        attachedImage.file || attachedImage.dataUrl,
        attachedImage.name || 'image.jpg'
      )
        .then((uploadRes) => {
          if (uploadRes.imageUrl && uploadRes.imageUrl !== attachedImage.dataUrl) {
            // Update image URL with persistent Cloud Storage URL
            setActiveChat((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === userMsgId
                    ? {
                        ...m,
                        imageUrl: uploadRes.imageUrl,
                        storagePath: uploadRes.storagePath,
                      }
                    : m
                ),
              };
            });
          }
        })
        .catch((err) => {
          console.info('Firebase image upload handled gracefully:', err);
        });
    }

    // 3. Check if user is invoking /tiktoknowm tool or provided a TikTok link
    const trimmedCommand = messageText.trim();
    const tiktokUrl = extractTikTokUrl(messageText);
    const isTikTok = trimmedCommand.startsWith('/tiktoknowm') || Boolean(tiktokUrl);

    if (isTikTok) {
      if (!tiktokUrl) {
        const guideContent = `### Luna TikTok Downloader (Tanpa Watermark)\n\nSilakan cantumkan tautan video TikTok yang ingin Anda unduh.\n\n**Contoh Penggunaan:**\n\`\`\`text\n/tiktoknowm https://vt.tiktok.com/ZSjXxx/\n\`\`\`\natau cukup tempelkan link video TikTok langsung ke kolom chat.`;
        const guideMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: guideContent,
          createdAt: Date.now(),
          model: 'Luna TikTok',
          isStreaming: false,
        };
        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? guideMsg : m)),
          };
        });
        StorageService.saveMessageLocally(currentTargetId, activeUser, guideMsg);
        if (activeUser?.uid) {
          addFirebaseMessage(currentTargetId, activeUser.uid, guideMsg).catch(() => {});
        }
        return;
      }

      // Set Shimmer loader state for TikTok processing
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempAssistantId
              ? {
                  ...m,
                  isProcessingTool: true,
                  processingToolType: 'tiktok',
                  isStreaming: false,
                }
              : m
          ),
        };
      });

      try {
        const tiktokData = await fetchTikTokNoWm(tiktokUrl);
        const reportText = formatTikTokReport(tiktokData);

        const tiktokMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: reportText,
          createdAt: Date.now(),
          model: 'Luna TikTok',
          isStreaming: false,
          isProcessingTool: false,
          tiktokData,
          fileAttachment: {
            name: `tiktok_${tiktokData.id || 'video'}_nowm.mp4`,
            size: 0,
            type: 'video/mp4',
            dataUrl: `/api/tiktok/download-video?url=${encodeURIComponent(tiktokData.downloadUrl)}`,
          },
        };

        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? tiktokMsg : m)),
          };
        });

        await StorageService.saveMessageLocally(currentTargetId, activeUser, tiktokMsg);
        if (activeUser?.uid) {
          addFirebaseMessage(currentTargetId, activeUser.uid, tiktokMsg).catch(() => {});
        }
        return;
      } catch (err: any) {
        console.error('TikTok downloader error:', err);
        const errorMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: `### Gagal Mengunduh Video TikTok\n\nMaaf, terjadi kendala saat memproses video TikTok:\n> **${err.message || 'Tautan tidak valid atau server tidak merespons'}**\n\n**Tips:**\n- Pastikan video berstatus publik di TikTok.\n- Periksa apakah link video lengkap (\`https://vt.tiktok.com/...\` atau \`https://www.tiktok.com/@user/video/...\`).`,
          createdAt: Date.now(),
          model: 'Luna TikTok',
          isStreaming: false,
          isProcessingTool: false,
        };
        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? errorMsg : m)),
          };
        });
        StorageService.saveMessageLocally(currentTargetId, activeUser, errorMsg);
        return;
      }
    }

    // 4. Check if user is invoking /hapuslatarbelakang tool
    const isRemoveBg =
      trimmedCommand.startsWith('/hapuslatarbelakang') ||
      trimmedCommand.startsWith('/removebg') ||
      /^(hapus\s*background|hapus\s*latar\s*belakang|remove\s*background)/i.test(trimmedCommand);

    if (isRemoveBg) {
      let imageToProcess: string | undefined = attachedImage?.dataUrl;
      if (!imageToProcess && activeChat) {
        const lastImage = activeChat.messages
          .slice()
          .reverse()
          .find((m) => m.imageUrl && !m.imageUrl.startsWith('data:image/svg'));
        if (lastImage?.imageUrl) {
          imageToProcess = lastImage.imageUrl;
        }
      }

      if (!imageToProcess) {
        const guideContent = `### Hapus Latar Belakang Gambar (Remove BG)\n\nSilakan lampirkan gambar yang ingin dihapus latar belakangnya.\n\n**Cara Penggunaan:**\n1. Klik ikon **Gambar** atau seret gambar ke kolom chat.\n2. Kirim bersama perintah \`/hapuslatarbelakang\`.\n\nLuna akan menghapus background secara presisi dan mengirimkan file PNG transparan untuk Anda.`;
        const guideMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: guideContent,
          createdAt: Date.now(),
          model: 'Luna Vision',
          isStreaming: false,
        };
        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? guideMsg : m)),
          };
        });
        StorageService.saveMessageLocally(currentTargetId, activeUser, guideMsg);
        return;
      }

      // Set Shimmer loader state for remove bg processing
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempAssistantId
              ? {
                  ...m,
                  isProcessingTool: true,
                  processingToolType: 'removebg',
                  isStreaming: false,
                }
              : m
          ),
        };
      });

      try {
        const result = await removeBackground(imageToProcess);

        const removeBgMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: 'Gambar berhasil di hapus latar belakangnya!',
          createdAt: Date.now(),
          model: 'Luna Vision',
          isStreaming: false,
          isProcessingTool: false,
          imageUrl: result.dataUrl,
          imageName: 'gambar_tanpa_latar.png',
          fileAttachment: {
            name: 'gambar_tanpa_latar.png',
            size: result.size,
            type: 'image/png',
            dataUrl: result.dataUrl,
          },
        };

        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? removeBgMsg : m)),
          };
        });

        await StorageService.saveMessageLocally(currentTargetId, activeUser, removeBgMsg);
        if (activeUser?.uid) {
          addFirebaseMessage(currentTargetId, activeUser.uid, removeBgMsg).catch(() => {});
        }
        return;
      } catch (err: any) {
        console.error('Remove background error:', err);
        const errorMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content: `### Gagal Menghapus Latar Belakang\n\nMaaf, terjadi kendala saat memproses gambar:\n> **${err.message || 'Format gambar tidak didukung'}**`,
          createdAt: Date.now(),
          model: 'Luna Vision',
          isStreaming: false,
          isProcessingTool: false,
        };
        setIsLoading(false);
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempAssistantId ? errorMsg : m)),
          };
        });
        StorageService.saveMessageLocally(currentTargetId, activeUser, errorMsg);
        return;
      }
    }

    abortControllerRef.current = new AbortController();

    let targetAccumulatedText = '';
    let renderedText = '';
    let isStreamDone = false;
    let animFrameId: number | null = null;
    let resolveDrain: (() => void) | null = null;

    const drainPromise = new Promise<void>((resolve) => {
      resolveDrain = resolve;
    });

    const stepTypewriter = () => {
      if (renderedText.length < targetAccumulatedText.length) {
        const gap = targetAccumulatedText.length - renderedText.length;
        const step = Math.min(
          gap,
          gap > 60
            ? Math.ceil(gap / 6)
            : gap > 24
            ? 4
            : gap > 8
            ? 2
            : 1
        );

        renderedText = targetAccumulatedText.slice(0, renderedText.length + step);
        const snapshot = renderedText;

        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === tempAssistantId
                ? { ...m, content: snapshot, isStreaming: true }
                : m
            ),
          };
        });
        setStreamingText(snapshot);
      }

      if (renderedText.length < targetAccumulatedText.length || !isStreamDone) {
        animFrameId = requestAnimationFrame(stepTypewriter);
      } else {
        resolveDrain?.();
      }
    };

    animFrameId = requestAnimationFrame(stepTypewriter);

    try {
      // Luna AI -> /api/ai/chat -> Overchat (streaming)
      const resultText = await streamLunaChat(messageText, {
        modelVariant: modelToUse,
        customPrompt: activeUser.systemPrompt,
        recentMessages: activeChat?.messages || [],
        image: attachedImage ? { dataUrl: attachedImage.dataUrl, name: attachedImage.name } : undefined,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          targetAccumulatedText += chunk;
        },
      });

      if (!targetAccumulatedText && resultText) {
        targetAccumulatedText = resultText;
      }

      isStreamDone = true;
      await drainPromise;

      const finalAssistantMsg: ChatMessage = {
        id: tempAssistantId,
        role: 'assistant',
        content: targetAccumulatedText || '...',
        model:
          modelToUse === 'coder'
            ? 'Luna Coder'
            : modelToUse === 'pro'
            ? 'Luna Pro'
            : 'Luna',
        createdAt: Date.now(),
        isStreaming: false,
      };

      StorageService.saveMessageLocally(
        currentTargetId,
        activeUser,
        finalAssistantMsg
      );

      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempAssistantId ? finalAssistantMsg : m
          ),
        };
      });

      if (activeUser) {
        fetchChats(activeUser);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('AI service notice:', err);
        setErrorBanner(err?.message || 'Gagal terhubung ke layanan Luna AI. Periksa koneksi internet Anda.');

        isStreamDone = true;
        await drainPromise;

        const fallbackMsg: ChatMessage = {
          id: tempAssistantId,
          role: 'assistant',
          content:
            targetAccumulatedText ||
            'Maaf, terjadi kendala saat menghubungi server Luna AI. Mohon periksa koneksi internet Anda dan coba lagi.',
          model:
            modelToUse === 'coder'
              ? 'Luna Coder'
              : modelToUse === 'pro'
              ? 'Luna Pro'
              : 'Luna',
          createdAt: Date.now(),
          isStreaming: false,
        };

        StorageService.saveMessageLocally(currentTargetId, activeUser, fallbackMsg);

        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === tempAssistantId ? fallbackMsg : m
            ),
          };
        });
      }
    } finally {
      isStreamDone = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);

      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempAssistantId
              ? {
                  ...m,
                  content: targetAccumulatedText || m.content,
                  isStreaming: false,
                }
              : m
          ),
        };
      });

      setIsLoading(false);
      setStreamingText('');
      abortControllerRef.current = null;
    }
  };

  // Switch to coder confirmed by user ("Iya, Pindah")
  const handleConfirmSwitchToCoder = () => {
    setIsCodingModalOpen(false);
    setSelectedModel('coder');
    if (activeChatId && currentUser) {
      StorageService.updateChat(activeChatId, currentUser.username, { model: 'coder' });
    }

    let promptToRun = pendingCodingPrompt;
    if (!promptToRun && activeChat) {
      const lastUserCoding = activeChat.messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user' && isCodingRequest(m.content));
      if (lastUserCoding) {
        promptToRun = lastUserCoding.content;
      }
    }

    // Clean up any old refusal messages in active chat so the AI doesn't echo them
    if (activeChat) {
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(
            (m) =>
              !(
                m.role === 'assistant' &&
                (/tidak mendukung coding/i.test(m.content) || /khusus coding/i.test(m.content))
              )
          ),
        };
      });
    }

    if (promptToRun) {
      setPendingCodingPrompt(null);
      executeSendMessage(promptToRun, 'coder');
    }
  };

  // Switch to coder declined by user ("Tidak, Tetap disini")
  const handleDeclineSwitchToCoder = () => {
    setIsCodingModalOpen(false);
    if (pendingCodingPrompt) {
      const promptToRun = pendingCodingPrompt;
      setPendingCodingPrompt(null);
      executeSendMessage(promptToRun, selectedModel);
    }
  };

  const handleSwitchToCoderFromChat = (promptText?: string, refusalMessageId?: string) => {
    setSelectedModel('coder');
    if (activeChatId && currentUser) {
      StorageService.updateChat(activeChatId, currentUser.username, { model: 'coder' });
    }

    // Clean up the refusal message from the active chat state so the UI replaces it with the code
    if (activeChat) {
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(
            (m) =>
              m.id !== refusalMessageId &&
              !(
                m.role === 'assistant' &&
                (/tidak mendukung coding/i.test(m.content) || /khusus coding/i.test(m.content))
              )
          ),
        };
      });
    }

    let targetPrompt = promptText;
    if (!targetPrompt && activeChat) {
      const lastUserCoding = activeChat.messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user' && isCodingRequest(m.content));
      if (lastUserCoding) {
        targetPrompt = lastUserCoding.content;
      }
    }
    if (!targetPrompt && pendingCodingPrompt) {
      targetPrompt = pendingCodingPrompt;
    }

    if (targetPrompt) {
      setPendingCodingPrompt(null);
      executeSendMessage(targetPrompt, 'coder');
    }
  };

  // 6. Delete Chat
  const handleDeleteChat = async (id: string) => {
    if (!currentUser) return;
    try {
      const updated = chats.filter((c) => c.id !== id);
      setChats(updated);
      if (activeChatId === id) {
        // Setelah menghapus obrolan aktif, kembali ke beranda
        setActiveChatId(null);
        setActiveChat(null);
      }
      await StorageService.deleteChat(id, currentUser);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // 7. Rename Chat
  const handleRenameChat = async (id: string, newTitle: string) => {
    if (!currentUser) return;
    await StorageService.updateChat(id, currentUser, { title: newTitle });
    fetchChats(currentUser);
    if (activeChat && activeChat.id === id) {
      setActiveChat({ ...activeChat, title: newTitle });
    }
  };

  // 8. Toggle Pin Chat
  const handleTogglePin = async (id: string, currentPin: boolean) => {
    if (!currentUser) return;
    await StorageService.updateChat(id, currentUser, { pinned: !currentPin });
    fetchChats(currentUser);
  };

  // 9. Clear All History
  const handleClearHistory = async () => {
    if (!currentUser) return;
    await StorageService.clearChats(currentUser);
    setChats([]);
    setActiveChatId(null);
    setActiveChat(null);
  };

  // 10. Regenerate response
  const handleRegenerate = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    const lastUserMsg = [...activeChat.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // 11. Logout handler
  const handleLogout = async () => {
    await signOutFirebase().catch(() => {});
    localStorage.removeItem('luna_username');
    setCurrentUser(null);
    setChats([]);
    setActiveChatId(null);
    setActiveChat(null);
    setIsAuthModalOpen(false);
  };

  // 12. Login / Sign Up success handler - Hilangkan UI login seketika setelah berhasil
  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('luna_username', user.username);
    setIsAuthModalOpen(false); // Hilangkan modal/UI login seketika setelah masuk akun

    await fetchChats(user);

    // Jika sebelumnya user mencoba mengirim pesan saat belum login, otomatis kirim sekarang
    if (pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage(null);
      setTimeout(() => {
        handleSendMessage(msg.text, msg.optionsOrForceModel, user);
      }, 100);
    }
  };

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full fixed inset-0 overflow-hidden bg-[#0d0c12] text-[#e9e7f0] font-['Plus_Jakarta_Sans',sans-serif] overscroll-none">
      {/* Sidebar with Chat History and User Info */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => loadChat(id)}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        currentUser={currentUser || createDefaultUser('pengguna', 'Pengguna Tamu')}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Chat Workspace */}
      <div className="luna-stage flex flex-1 flex-col h-full max-h-full min-w-0 relative overflow-hidden">
        {/* Top Bar Header - Glassy Frosted Translucent Blur Background */}
        <header className="luna-glass absolute top-0 inset-x-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3 sm:px-4 md:px-6 pointer-events-auto">
          <div className="flex min-w-0 items-center gap-3">
            {/* Tombol menu: tiga garis berubah jadi X */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-300 transition-all duration-300 hover:bg-white/[0.07] hover:text-white active:scale-90 cursor-pointer"
              title={isSidebarOpen ? 'Tutup Bilah Sisi' : 'Buka Bilah Sisi'}
              aria-label="Toggle Menu"
              aria-expanded={isSidebarOpen}
            >
              <div className="relative w-4 h-3.5 flex flex-col justify-between items-center pointer-events-none">
                <span
                  className={`h-[2px] w-4 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${
                    isSidebarOpen ? 'rotate-45 translate-y-[5px] bg-amber-400' : 'bg-current'
                  }`}
                />
                <span
                  className={`h-[2px] w-4 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSidebarOpen ? 'opacity-0 scale-x-0' : 'bg-current opacity-100'
                  }`}
                />
                <span
                  className={`h-[2px] w-4 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${
                    isSidebarOpen ? '-rotate-45 -translate-y-[5px] bg-amber-400' : 'bg-current'
                  }`}
                />
              </div>
            </button>

            {/* Nama merek */}
            <div className="flex min-w-0 items-baseline gap-2 select-none">
              <span className="text-[22px] font-semibold tracking-tight leading-none text-neutral-50">Luna</span>
              <span className="hidden min-[420px]:inline truncate text-[11px] sm:text-xs text-amber-300/70 font-medium">
                oleh Gimoy Studio
              </span>
            </div>
          </div>

          {/* Sisi kanan */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-white/[0.07] hover:border-white/20 cursor-pointer"
              title="Buat Obrolan Baru"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              <span>Obrolan Baru</span>
            </button>

            {currentUser?.uid ? (
              <div className="flex items-center gap-1.5">
                {/* Profil: hanya tampilan, tidak bisa diklik */}
                <div
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 sm:pr-3 select-none cursor-default"
                  title={`${currentUser.displayName} (${currentUser.email || currentUser.username})`}
                >
                  <UserAvatar user={currentUser} className="h-7 w-7" ringClassName="ring-1 ring-amber-400/40" />
                  <span className="hidden md:inline max-w-[8rem] truncate text-xs font-semibold text-neutral-200">
                    {currentUser.displayName.split(' ')[0]}
                  </span>
                </div>

                {/* Tombol edit profil / pengaturan */}
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 transition-all hover:bg-white/[0.08] hover:text-amber-300 active:scale-90 cursor-pointer"
                  title="Edit profil & pengaturan"
                  aria-label="Edit profil dan pengaturan"
                >
                  <i className="fa-regular fa-pen-to-square text-[15px]" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 px-3 sm:px-3.5 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer border border-neutral-200"
                title="Masuk dengan Akun Google"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Masuk Google</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>
        </header>

        {/* System Error Toast if upstream issue */}
        {errorBanner && (
          <div className="absolute top-18 inset-x-4 z-20 flex items-center justify-between gap-3 rounded-xl bg-rose-950/90 backdrop-blur-md border border-rose-800/80 px-4 py-2.5 text-xs text-rose-200 shadow-xl">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="line-clamp-3 break-words leading-snug">{errorBanner}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setErrorBanner(null);
                  handleRegenerate();
                }}
                className="flex items-center gap-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 px-2.5 py-1 text-xs font-medium text-white transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Coba Lagi</span>
              </button>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-neutral-400 hover:text-white text-xs px-1.5 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chat Message View Area */}
        <ChatView
          messages={activeChat?.messages || []}
          currentUser={currentUser || createDefaultUser('pengguna@gmail.com', 'Pengguna')}
          isLoading={isLoading}
          streamingText={streamingText}
          onSendPrompt={handleSendMessage}
          onRegenerate={handleRegenerate}
          onSwitchToCoder={handleSwitchToCoderFromChat}
        />

        {/* Gemini Rounded Capsule Input Bar with Model Selector */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSelectModel={(variant) => setSelectedModel(variant)}
        />
      </div>

      {/* Coding Model Transition Modal */}
      <CodingSwitchModal
        isOpen={isCodingModalOpen}
        onConfirmSwitch={handleConfirmSwitchToCoder}
        onDecline={handleDeclineSwitchToCoder}
        currentModelName={selectedModel === 'pro' ? 'Luna Pro' : 'Luna (Standar)'}
        userPromptSnippet={pendingCodingPrompt || undefined}
      />

      {/* Auth / Username Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingMessage(null);
        }}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Settings & Database Modal */}
      {currentUser && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onClearHistory={handleClearHistory}
          totalChats={chats.length}
        />
      )}
    </div>
  );
}
