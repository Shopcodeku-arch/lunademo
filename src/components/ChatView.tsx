import React, { useRef, useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Lightbulb,
  Code2,
  FileText,
  Atom,
  ArrowRight,
  ImageIcon,
  Maximize2,
  X,
  Download,
  Languages,
  FileArchive,
  File,
  Video,
  Scissors,
  Heart,
  MessageCircle,
  Eye,
  User,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, UserProfile } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LunaOrb } from './LunaOrb';
import { UserAvatar } from './UserAvatar';
import { DexterLoader } from './DexterLoader';
import { tiktokProxyUrl } from '../services/tiktok';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ChatViewProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  isLoading: boolean;
  streamingText: string;
  onSendPrompt: (prompt: string) => void;
  onRegenerate: () => void;
  onSwitchToCoder?: (userPrompt?: string, refusalMessageId?: string) => void;
}

function renderUserContent(content: string) {
  if (!content.includes('**') && !content.includes('==')) {
    return content;
  }
  const parts = content.split(/(\*\*[^*]+\*\*|==[^=]+==)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="important-highlight">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark key={i} className="important-highlight">
          {part.slice(2, -2)}
        </mark>
      );
    }
    return part;
  });
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentUser,
  isLoading,
  streamingText,
  onSendPrompt,
  onRegenerate,
  onSwitchToCoder,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [dismissedCodingSuggestions, setDismissedCodingSuggestions] = useState<Record<string, boolean>>({});
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; name?: string } | null>(null);

  const [showScrollDown, setShowScrollDown] = useState(false);
  const isUserScrolledUpRef = useRef(false);
  const prevMsgLengthRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isLoading);

  // Monitor user scroll to avoid interrupting manual reading
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // User intentionally scrolled up if more than 120px from bottom
    isUserScrolledUpRef.current = distanceFromBottom > 120;
    // Tombol panah bawah muncul bila posisi sudah cukup jauh dari pesan terbaru
    setShowScrollDown(distanceFromBottom > 240);
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isUserScrolledUpRef.current = false;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  // Rock-solid auto-scroll without naik-turun jitter during streaming
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 1. When a new message is sent/received, reset user-scroll and smooth-scroll
    if (messages.length > prevMsgLengthRef.current) {
      isUserScrolledUpRef.current = false;
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      });
    }
    prevMsgLengthRef.current = messages.length;

    // 2. While actively streaming tokens: pin directly via scrollTop to avoid animation fighting
    if (isLoading && !isUserScrolledUpRef.current) {
      requestAnimationFrame(() => {
        if (container && !isUserScrolledUpRef.current) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }

    // 3. When generation completes: trigger single smooth scroll to bottom
    if (prevIsLoadingRef.current && !isLoading && !isUserScrolledUpRef.current) {
      requestAnimationFrame(() => {
        if (container && !isUserScrolledUpRef.current) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      });
    }
    prevIsLoadingRef.current = isLoading;
  }, [messages, streamingText, isLoading]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~>\[\]\(\)]/g, ' ').slice(0, 1000);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('IND'));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return 'Selamat Pagi';
    } else if (hour >= 11 && hour < 15) {
      return 'Selamat Siang';
    } else if (hour >= 15 && hour < 18) {
      return 'Selamat Sore';
    } else {
      return 'Selamat Malam';
    }
  };

  const userGreetingName = currentUser.displayName || currentUser.username || 'Pengguna';
  const fullGreetingText = `${getTimeBasedGreeting()}, ${userGreetingName}`;
  const [typedGreeting, setTypedGreeting] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setTypedGreeting('');
    setIsTypingComplete(false);

    let charIndex = 0;
    const typingSpeed = 40; // ms per char: snappy, dynamic, smooth

    const timer = setInterval(() => {
      charIndex++;
      if (charIndex <= fullGreetingText.length) {
        setTypedGreeting(fullGreetingText.slice(0, charIndex));
      } else {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [fullGreetingText]);

  const ALL_SUGGESTIONS = [
    {
      title: 'Baca & Analisis Gambar',
      subtitle: 'Kirim foto atau diagram untuk diteliti secara detail oleh Luna',
      prompt: 'Tolong jelaskan dan analisis detail apa saja yang ada pada gambar yang saya lampirkan.',
      icon: <ImageIcon className="h-5 w-5 text-violet-400" />,
    },
    {
      title: 'Pemrograman & Rekayasa Software',
      subtitle: 'Tulis kode, algoritma, atau debugging sistem modern',
      prompt: 'Tuliskan arsitektur dan kode TypeScript untuk implementasi rate-limiting queue dengan exponential backoff.',
      icon: <Code2 className="h-5 w-5 text-emerald-400" />,
    },
    {
      title: 'Analisis & Rangkum Dokumen',
      subtitle: 'Ekstrak poin kunci dan buat kerangka kerja strategis',
      prompt: 'Bantu saya menyusun kerangka analisis SWOT dan roadmap implementasi transformasi digital untuk perusahaan.',
      icon: <FileText className="h-5 w-5 text-purple-400" />,
    },
    {
      title: 'Konsep Startup AI Inovatif',
      subtitle: 'Rancang ide bisnis dan solusi berbasis kecerdasan buatan',
      prompt: 'Buatkan konsep ide startup berbasis AI yang memecahkan masalah nyata di Asia Tenggara beserta rencana monetisasinya.',
      icon: <Lightbulb className="h-5 w-5 text-rose-400" />,
    },
    {
      title: 'Penerjemah & Bahasa Asing',
      subtitle: 'Terjemahkan dokumen dengan gaya luwes, alami & profesional',
      prompt: 'Tolong terjemahkan teks ini ke bahasa Inggris formal dan berikan alternatif gaya percakapan yang kasual.',
      icon: <Languages className="h-5 w-5 text-cyan-400" />,
    },
    {
      title: 'Sains & Pemecahan Matematika',
      subtitle: 'Pecahkan rumus rumit, teori fisika & persoalan sains komputasi',
      prompt: 'Jelaskan langkah demi langkah penyelesaian rumus dan konsep sains ini secara intuitif dan komprehensif.',
      icon: <Atom className="h-5 w-5 text-sky-400" />,
    },
  ];

  // Pick 2 random unique suggestions each time the website is opened/refreshed
  const [displayedSuggestions] = useState(() => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  });

  const hasActiveStreamingMessage = messages.some((m) => m.isStreaming);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={`flex-1 min-h-0 overflow-x-hidden px-4 scrollbar-thin w-full overscroll-none [overflow-anchor:none] ${
        messages.length === 0
          ? 'overflow-y-auto sm:overflow-y-hidden flex flex-col justify-center pt-20 sm:pt-24 pb-4'
          : 'overflow-y-auto pt-20 sm:pt-22 pb-6'
      }`}
    >
      <div className="mx-auto max-w-3xl w-full">
        {/* Empty State / Welcome Screen */}
        {messages.length === 0 && !streamingText ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-start justify-center py-2 sm:py-6 w-full"
          >
            {/* Clean Gemini Header Greeting with Typewriter Animation */}
            <div className="space-y-1.5 sm:space-y-2.5 w-full">
              <h1 className="text-[32px] sm:text-5xl font-semibold tracking-tight leading-[1.1] min-h-[44px] sm:min-h-[60px] flex items-center text-neutral-50">
                <span>{typedGreeting || 'H'}</span>
                {!isTypingComplete && (
                  <span className="inline-block w-[3px] h-8 sm:h-12 ml-1.5 bg-violet-400 animate-pulse rounded-full" />
                )}
              </h1>
              <div className="min-h-[34px] sm:min-h-[50px]">
                <AnimatePresence>
                  {isTypingComplete && (
                    <motion.h2
                      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      className="text-xl sm:text-3xl font-medium tracking-tight text-neutral-400 leading-snug"
                    >
                      Bagaimana Luna dapat membantu Anda hari ini?
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Prompt Suggestion Cards (Exactly 2 cards, randomized on each website refresh) */}
            <div className="mt-5 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
              {displayedSuggestions.map((item, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: isTypingComplete ? idx * 0.06 : 0.3 + idx * 0.06 }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => onSendPrompt(item.prompt)}
                  className="group flex flex-col justify-between rounded-2xl bg-[#16151d]/90 p-3.5 sm:p-4 text-left border border-neutral-800/80 hover:bg-[#211f2b] hover:border-neutral-700 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="rounded-xl bg-neutral-900/80 p-2 sm:p-2.5 transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="mt-2.5 sm:mt-3">
                    <div className="text-[13px] sm:text-sm font-semibold text-neutral-100 group-hover:text-white line-clamp-1">
                      {item.title}
                    </div>
                    <div className="mt-0.5 sm:mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Conversation Stream */
          <div className="space-y-6 pb-6 w-full max-w-full overflow-hidden">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="group w-full max-w-full"
                >
                  {msg.role === 'user' ? (
                    /* User Message: Clean bubble, strictly wrapping downwards */
                    <div className="flex items-start justify-end gap-3 w-full">
                      <div className="max-w-[85%] rounded-3xl bg-[#221f2d] px-5 py-3 text-[15px] text-neutral-100 shadow-sm border border-neutral-700/50 leading-relaxed chat-wrap-down break-words [overflow-wrap:anywhere]">
                        {msg.imageUrl && (
                          <div className="mb-2.5">
                            <div
                              onClick={() => setPreviewModalImage({ url: msg.imageUrl!, name: msg.imageName })}
                              className="relative group/img inline-block cursor-pointer overflow-hidden rounded-xl border border-neutral-700/80 bg-neutral-900 max-w-[9.5rem]"
                              title="Klik untuk melihat ukuran penuh"
                            >
                              <img
                                src={msg.imageUrl}
                                alt={msg.imageName || 'Gambar lampiran'}
                                className="block h-24 sm:h-28 w-auto max-w-full object-cover rounded-xl group-hover/img:scale-[1.03] transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium backdrop-blur-[2px]">
                                <Maximize2 className="h-4 w-4" />
                                <span>Perbesar</span>
                              </div>
                            </div>
                            {msg.imageName && (
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400 truncate max-w-[9.5rem]">
                                <ImageIcon className="h-3 w-3 text-violet-400 shrink-0" />
                                <span className="truncate">{msg.imageName}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* File Attachment in User Message (including .zip) */}
                        {msg.fileAttachment && (
                          <div className="mb-2 flex max-w-[15rem] items-center justify-between gap-2 rounded-xl bg-[#16151d] border border-white/10 p-2 text-xs text-neutral-200">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-700 text-cyan-400">
                                {msg.fileAttachment.name.toLowerCase().endsWith('.zip') ? (
                                  <FileArchive className="h-4 w-4 text-violet-400" />
                                ) : (
                                  <File className="h-4 w-4 text-cyan-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-neutral-100 truncate max-w-[7.5rem] sm:max-w-[9rem]">
                                  {msg.fileAttachment.name}
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  {formatBytes(msg.fileAttachment.size || 0)}
                                </div>
                              </div>
                            </div>
                            {msg.fileAttachment.dataUrl && (
                              <a
                                href={msg.fileAttachment.dataUrl}
                                download={msg.fileAttachment.name}
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition"
                                title="Unduh file"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}

                        {renderUserContent(msg.content)}
                      </div>
                      <UserAvatar user={currentUser} className="h-8 w-8" ringClassName="ring-1 ring-violet-400/30" />
                    </div>
                  ) : (
                    /* Assistant Message: Luna with animated Uiverse loader orb */
                    <div className="flex items-start gap-3.5 sm:gap-4 w-full max-w-full">
                      {/* Pure floating round Luna Orb without background box or outline */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center select-none">
                        <LunaOrb size={0.3} animated={Boolean(msg.isStreaming || msg.isProcessingTool)} />
                      </div>

                      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-neutral-200">
                            {(() => {
                              const raw = msg.model || 'Luna';
                              if (/coder/i.test(raw)) return 'Luna Coder';
                              if (/pro/i.test(raw)) return 'Luna Pro';
                              if (/tiktok/i.test(raw)) return 'Luna TikTok';
                              if (/vision/i.test(raw)) return 'Luna Vision';
                              return 'Luna';
                            })()}
                          </span>
                          {msg.isStreaming ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-violet-400 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                              sedang mengetik...
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Content: Shimmer loader, dexter loader, or rendered content with TikTok / Image cards */}
                        {msg.isProcessingTool ? (
                          <div className="w-full max-w-[18rem] rounded-2xl bg-[#16151d] border border-neutral-800 p-3 shadow-xl overflow-hidden relative">
                            {/* Animated Shimmer sweep */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-luna-shimmer pointer-events-none" />

                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse flex items-center justify-center text-violet-400 shrink-0">
                                {msg.processingToolType === 'tiktok' ? (
                                  <Video className="h-5 w-5 text-violet-400" />
                                ) : (
                                  <Scissors className="h-5 w-5 text-cyan-400" />
                                )}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="h-4 w-3/4 bg-neutral-800 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-neutral-800/80 rounded animate-pulse" />
                              </div>
                            </div>

                            <div className="space-y-2 mt-4">
                              <div className="h-20 w-full bg-neutral-800/60 rounded-xl animate-pulse" />
                              <div className="flex gap-2">
                                <div className="h-8 flex-1 bg-neutral-800 rounded-lg animate-pulse" />
                                <div className="h-8 w-24 bg-neutral-800 rounded-lg animate-pulse" />
                              </div>
                            </div>

                            <div className="mt-3 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping shrink-0" />
                              <span>
                                {msg.processingToolType === 'tiktok'
                                  ? 'Sedang memproses & mengunduh video TikTok tanpa watermark...'
                                  : 'Sedang memproses penghapusan latar belakang gambar...'}
                              </span>
                            </div>
                          </div>
                        ) : msg.isStreaming && !msg.content ? (
                          <DexterLoader />
                        ) : (
                          <div className="text-neutral-200 chat-wrap-down break-words [overflow-wrap:anywhere] max-w-full overflow-hidden">
                            <MarkdownRenderer
                              content={msg.content}
                              isStreaming={msg.isStreaming}
                              userQuestion={
                                messages
                                  .slice(0, messages.findIndex((m) => m.id === msg.id))
                                  .reverse()
                                  .find((m) => m.role === 'user')?.content
                              }
                            />

                            {/* TikTok Video Post Card */}
                            {msg.tiktokData && (
                              <div className="mt-3 w-full max-w-[18rem] rounded-2xl bg-[#16151d] border border-neutral-700/80 p-3 shadow-xl overflow-hidden space-y-2.5">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {msg.tiktokData.author?.avatar ? (
                                      <img
                                        src={msg.tiktokData.author.avatar}
                                        alt={msg.tiktokData.author.nickname || 'Author'}
                                        className="h-10 w-10 rounded-full object-cover border border-neutral-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                        <User className="h-5 w-5" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                                          {msg.tiktokData.author?.nickname || msg.tiktokData.author?.username || 'TikTok Creator'}
                                        </span>
                                        {msg.tiktokData.author?.verified && (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 fill-blue-400/20" />
                                        )}
                                      </div>
                                      <span className="text-[11px] text-neutral-400 block truncate font-mono">
                                        @{msg.tiktokData.author?.username || 'user'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                                    No Watermark
                                  </span>
                                </div>

                                <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-800">
                                  <video
                                    controls
                                    playsInline
                                    poster={msg.tiktokData.cover}
                                    preload="metadata"
                                    src={tiktokProxyUrl(msg.tiktokData.downloadUrl, { inline: true })}
                                    className="w-full max-h-[240px] object-contain rounded-xl bg-black"
                                  >
                                    Browser Anda tidak mendukung tag video.
                                  </video>
                                </div>

                                <div className="flex items-center justify-between text-xs text-neutral-300 px-1 pt-1 border-t border-neutral-800/80">
                                  <div className="flex items-center gap-1.5 text-rose-400">
                                    <Heart className="h-4 w-4 fill-rose-500/20" />
                                    <span className="font-semibold">
                                      {msg.tiktokData.stats?.likes ? Number(msg.tiktokData.stats.likes).toLocaleString('id-ID') : 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sky-400">
                                    <MessageCircle className="h-4 w-4 fill-sky-500/20" />
                                    <span className="font-semibold">
                                      {msg.tiktokData.stats?.comments ? Number(msg.tiktokData.stats.comments).toLocaleString('id-ID') : 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-violet-400">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-semibold">
                                      {msg.tiktokData.stats?.views ? Number(msg.tiktokData.stats.views).toLocaleString('id-ID') : 0}
                                    </span>
                                  </div>
                                </div>

                                {msg.tiktokData.hashtags && msg.tiktokData.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {msg.tiktokData.hashtags.slice(0, 6).map((h, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md"
                                      >
                                        #{h.hashtagName}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <a
                                  href={tiktokProxyUrl(msg.tiktokData.downloadUrl, {
                                    name: `tiktok_${msg.tiktokData.id || 'video'}_nowm.mp4`,
                                  })}
                                  download={`tiktok_${msg.tiktokData.id || 'video'}_nowm.mp4`}
                                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-500 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-400 active:scale-[0.99] transition cursor-pointer"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Unduh Video (Tanpa Watermark)</span>
                                </a>
                              </div>
                            )}

                            {/* Transparent PNG Preview for Remove BG */}
                            {msg.role === 'assistant' && msg.imageUrl && (
                              <div className="mt-3 w-full max-w-[16rem] rounded-2xl bg-[#16151d] border border-neutral-700/80 p-2.5 shadow-xl overflow-hidden space-y-2">
                                <div
                                  onClick={() => setPreviewModalImage({ url: msg.imageUrl!, name: msg.imageName })}
                                  className="relative cursor-pointer overflow-hidden rounded-xl border border-neutral-700 checkerboard-pattern flex items-center justify-center p-3 group/img"
                                  title="Klik untuk melihat ukuran penuh"
                                >
                                  <img
                                    src={msg.imageUrl}
                                    alt={msg.imageName || 'Gambar tanpa latar belakang'}
                                    className="max-h-36 w-auto object-contain rounded-lg group-hover/img:scale-[1.02] transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium backdrop-blur-[2px]">
                                    <Maximize2 className="h-4 w-4" />
                                    <span>Lihat Penuh</span>
                                  </div>
                                </div>
                                <a
                                  href={msg.imageUrl}
                                  download={msg.imageName || 'gambar_tanpa_latar.png'}
                                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-500 px-4 py-2.5 text-xs font-semibold text-neutral-950 shadow-md hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Unduh Gambar (PNG Transparan)</span>
                                </a>
                              </div>
                            )}

                            {/* Assistant Downloadable File Attachment */}
                            {msg.role === 'assistant' && msg.fileAttachment && (
                              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#16151d] border border-white/10 p-2.5 text-xs text-neutral-200 max-w-[18rem]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-700 text-cyan-400">
                                    {msg.fileAttachment.name.toLowerCase().endsWith('.zip') ? (
                                      <FileArchive className="h-5 w-5 text-violet-400" />
                                    ) : (
                                      <File className="h-5 w-5 text-cyan-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-neutral-100 truncate">{msg.fileAttachment.name}</div>
                                    <div className="text-[10px] text-neutral-400">{formatBytes(msg.fileAttachment.size || 0)}</div>
                                  </div>
                                </div>
                                {msg.fileAttachment.dataUrl && (
                                  <a
                                    href={msg.fileAttachment.dataUrl}
                                    download={msg.fileAttachment.name}
                                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Unduh</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assistant Actions Bar: smooth fade in once generation completes */}
                        {!msg.isStreaming && msg.content && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            className="mt-3 flex items-center gap-1 text-xs text-neutral-400"
                          >
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-neutral-400 hover:bg-[#221f2d] hover:text-white transition-colors"
                              title="Salin pesan"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Disalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleSpeak(msg.id, msg.content)}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
                                speakingId === msg.id
                                  ? 'text-violet-400 bg-violet-950/40'
                                  : 'text-neutral-400 hover:bg-[#221f2d] hover:text-white'
                              }`}
                              title="Bacakan dengan suara"
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <VolumeX className="h-3.5 w-3.5" />
                                  <span>Hentikan</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5" />
                                  <span>Dengarkan</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={onRegenerate}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-neutral-400 hover:bg-[#221f2d] hover:text-white transition-colors"
                              title="Buat ulang respons terakhir"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Buat ulang</span>
                            </button>
                          </motion.div>
                        )}

                        {/* Interactive Coding Switch Prompt if Assistant Declines Coding */}
                        {(() => {
                          const isCodingNotice =
                            /tidak mendukung coding/i.test(msg.content) ||
                            /khusus coding/i.test(msg.content);
                          if (!isCodingNotice || dismissedCodingSuggestions[msg.id]) return null;

                          const prevUserMsg = messages
                            .slice(0, messages.findIndex((m) => m.id === msg.id))
                            .reverse()
                            .find((m) => m.role === 'user');

                          return (
                            <div className="mt-3.5 rounded-2xl border border-emerald-500/40 bg-[#161a18] p-3.5 sm:p-4 shadow-lg shadow-emerald-950/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <Code2 className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                    Saat ini model Luna tidak mendukung coding, apakah anda ingin beralih ke mode bahasa khusus coding?
                                  </h4>
                                  <p className="text-[11px] text-neutral-400 mt-1">
                                    Beralih ke Luna Coder untuk langsung membuat program, struktur kode, dan arsitektur aplikasi secara lengkap.
                                  </p>

                                  <div className="mt-3 flex items-center gap-2.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => onSwitchToCoder?.(prevUserMsg?.content, msg.id)}
                                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 px-3.5 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                      <Code2 className="h-3.5 w-3.5" />
                                      <span>Iya, Pindah</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDismissedCodingSuggestions((prev) => ({
                                          ...prev,
                                          [msg.id]: true,
                                        }))
                                      }
                                      className="rounded-xl border border-neutral-700/80 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                                    >
                                      <span>Tidak, Tetap disini</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Fallback loading indicator only if no message has isStreaming */}
            {isLoading && !hasActiveStreamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3.5 sm:gap-4 w-full max-w-full"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center select-none">
                  <LunaOrb size={0.3} animated />
                </div>
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-neutral-200">
                      Luna
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-violet-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                      sedang berpikir...
                    </span>
                  </div>
                  <DexterLoader />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>

      {/* Tombol gulir ke pesan terbaru */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
        <AnimatePresence>
          {showScrollDown && messages.length > 0 && (
            <motion.button
              key="scroll-down"
              type="button"
              onClick={scrollToBottom}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#1a1922]/95 text-neutral-200 shadow-lg shadow-black/40 backdrop-blur transition-colors hover:bg-[#25232f] hover:text-white active:scale-90 cursor-pointer"
              aria-label="Gulir ke pesan terbaru"
              title="Ke pesan terbaru"
            >
              <ArrowDown className="h-[18px] w-[18px]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {previewModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModalImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[90vh] flex flex-col items-center bg-[#121118] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header Bar */}
              <div className="w-full flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-[#16151d]/80">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-300 truncate max-w-md">
                  <ImageIcon className="h-4 w-4 text-violet-400 shrink-0" />
                  <span className="truncate">{previewModalImage.name || 'Gambar Terlampir'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewModalImage.url}
                    download={previewModalImage.name || 'luna-image.png'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    title="Unduh Gambar"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewModalImage(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                    title="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Image Container */}
              <div className="p-3 sm:p-5 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)]">
                <img
                  src={previewModalImage.url}
                  alt={previewModalImage.name || 'Gambar penuh'}
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
