import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  ImageIcon,
  Mic,
  MicOff,
  X,
  FileText,
  Square,
  Image as ImageFileIcon,
  FileArchive,
  File as FileIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ModelVariant, SendOptions, AttachedImage, ChatFileAttachment } from '../types';
import { ModelSelector } from './ModelSelector';
import { buildAttachmentMessage } from '../utils/attachment';
import { optimizeImage } from '../utils/imageOptimizer';

export interface SlashTool {
  id: string;
  command: string;
  name: string;
  desc: string;
}

export const SLASH_TOOLS: SlashTool[] = [
  {
    id: 'tiktoknowm',
    command: '/tiktoknowm',
    name: 'Download TikTok No WM',
    desc: 'Unduh video TikTok tanpa watermark otomatis',
  },
  {
    id: 'hapuslatarbelakang',
    command: '/hapuslatarbelakang',
    name: 'Hapus Latar Belakang',
    desc: 'Hapus background foto menjadi transparan',
  },
];

interface ChatInputProps {
  onSendMessage: (message: string, options?: SendOptions) => void;
  isLoading: boolean;
  selectedModel: ModelVariant;
  onSelectModel: (variant: ModelVariant) => void;
  onStopGeneration?: () => void;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB for zip and documents
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB for images
const MAX_FILE_CHARS = 10000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  onStopGeneration,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [deepMode, setDeepMode] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; content: string; truncated: boolean } | null>(null);
  const [imageAttachment, setImageAttachment] = useState<AttachedImage | null>(null);
  const [fileAttachment, setFileAttachment] = useState<ChatFileAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsMenu]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val === '/') {
      setShowToolsMenu(true);
    } else if (val === '' && showToolsMenu) {
      setShowToolsMenu(false);
    }
  };

  const handleSelectTool = (tool: SlashTool) => {
    setText(`${tool.command} `);
    setShowToolsMenu(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Perangkat sentuh: Enter = baris baru. Desktop: Enter = kirim, Shift+Enter = baris baru.
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 28), 160)}px`;
  }, [text]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  const canSubmit =
    (text.trim().length > 0 || attachment !== null || imageAttachment !== null || fileAttachment !== null) &&
    !isLoading;

  const handleSend = () => {
    if (!canSubmit) return;
    const typed = text.trim();
    let message = typed;
    if (attachment) {
      message = buildAttachmentMessage(attachment.name, attachment.content, typed);
    } else if (!message && imageAttachment) {
      message = 'Tolong jelaskan dan analisis gambar ini dengan detail.';
    } else if (!message && fileAttachment) {
      message = `Mohon periksa dan analisis file lampiran: ${fileAttachment.name}`;
    }

    if (!message && !imageAttachment && !fileAttachment) return;

    onSendMessage(message, {
      research: deepMode,
      image: imageAttachment || undefined,
      fileAttachment: fileAttachment || undefined,
    });

    setText('');
    setAttachment(null);
    setImageAttachment(null);
    setFileAttachment(null);
    if (isTouch) textareaRef.current?.blur();
    else textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || isTouch) return;
    e.preventDefault();
    handleSend();
  };

  // Helper to read, optimize, and process image file
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotice('File yang dipilih bukan gambar yang didukung.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setNotice('Ukuran gambar maksimal 15 MB.');
      return;
    }

    try {
      // Pre-compress and optimize image to ~1024px and ~80KB for fast AI analysis
      const optimized = await optimizeImage(file, {
        fileName: file.name,
        maxDimension: 1024,
        quality: 0.82,
      });

      setImageAttachment({
        dataUrl: optimized.dataUrl,
        name: optimized.name,
        size: optimized.size,
        file: optimized.blob ? new File([optimized.blob], optimized.name, { type: 'image/jpeg' }) : file,
      });
    } catch (err) {
      console.warn('Image optimization fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = String(event.target?.result ?? '');
        if (dataUrl) {
          setImageAttachment({
            dataUrl,
            name: file.name,
            size: file.size,
            file,
          });
        }
      };
      reader.onerror = () => setNotice('Gagal membaca gambar. Silakan coba file lain.');
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    processImageFile(file);
  };

  // Clipboard paste support for images
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processGeneralFile = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setNotice('Ukuran file maksimal 25 MB.');
      return;
    }

    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isTextDoc = /\.(txt|md|json|csv|js|jsx|ts|tsx|py|html|css|sql|xml|yml|yaml|log|java|c|cpp|go|rs|php|sh)$/i.test(
      file.name
    );

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result ?? '');
      setFileAttachment({
        name: file.name,
        size: file.size,
        type: file.type || (isZip ? 'application/zip' : 'application/octet-stream'),
        dataUrl,
      });

      if (isTextDoc) {
        try {
          const textReader = new FileReader();
          textReader.onload = (te) => {
            const content = String(te.target?.result ?? '');
            setAttachment({
              name: file.name,
              content: content.slice(0, MAX_FILE_CHARS),
              truncated: content.length > MAX_FILE_CHARS,
            });
          };
          textReader.readAsText(file);
        } catch {
          // ignore
        }
      }
    };
    reader.onerror = () => setNotice('Gagal membaca file.');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      processGeneralFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type.startsWith('image/')) {
      processImageFile(file);
      return;
    }

    processGeneralFile(file);
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop?.();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice('Browser ini belum mendukung input suara.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event?.error === 'not-allowed') setNotice('Izin mikrofon ditolak. Aktifkan di pengaturan browser.');
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const iconBtn =
    'flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 active:scale-90 transition';

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-4 shrink-0">
      {/* Attachments / Image Previews / File / Notice bar */}
      {(attachment || imageAttachment || fileAttachment || notice) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {/* File Attachment Card (including .zip files) */}
          {fileAttachment && (
            <div className="inline-flex max-w-full items-center gap-2.5 rounded-2xl bg-neutral-800/95 border border-cyan-500/40 p-1.5 pr-2.5 text-xs text-neutral-200 shadow-lg">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-700 text-cyan-400">
                {fileAttachment.name.toLowerCase().endsWith('.zip') ? (
                  <FileArchive className="h-5 w-5 text-violet-400" />
                ) : (
                  <FileIcon className="h-5 w-5 text-cyan-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5 font-medium break-all max-w-[11rem] sm:max-w-xs text-neutral-100">
                  <span className="break-all">{fileAttachment.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                  <span>{formatBytes(fileAttachment.size || 0)}</span>
                  <span className="text-cyan-400 font-medium">• Siap dikirim ke Luna</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFileAttachment(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                aria-label="Hapus file lampiran"
                title="Hapus file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Image Preview Thumbnail Card */}
          {imageAttachment && (
            <div className="inline-flex max-w-full items-center gap-2.5 rounded-2xl bg-neutral-800/95 border border-violet-500/40 p-1.5 pr-2.5 text-xs text-neutral-200 shadow-lg">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
                <img
                  src={imageAttachment.dataUrl}
                  alt={imageAttachment.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5 font-medium break-all max-w-[11rem] sm:max-w-xs text-neutral-100">
                  <ImageFileIcon className="h-3 w-3 text-violet-400 shrink-0" />
                  <span className="break-all">{imageAttachment.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                  <span>{formatBytes(imageAttachment.size || 0)}</span>
                  <span className="text-violet-400 font-medium">• Luna siap menganalisis</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                aria-label="Hapus gambar lampiran"
                title="Hapus gambar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Text/Code Document Attachment Card */}
          {attachment && !fileAttachment && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-lg bg-neutral-800/90 border border-neutral-700 pl-3 pr-1.5 py-1 text-xs text-neutral-300">
              <FileText className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="font-medium break-all max-w-[10rem] sm:max-w-xs">{attachment.name}</span>
              {attachment.truncated && <span className="shrink-0 text-neutral-500">(dipotong)</span>}
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white"
                aria-label="Hapus lampiran"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Notification notice */}
          {notice && (
            <div role="status" className="fade-in rounded-lg bg-rose-950/50 border border-rose-800/60 px-3 py-1 text-xs text-rose-200">
              {notice}
            </div>
          )}
        </div>
      )}

      {/* Model Selector Bar */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
      </div>

      {/* Main Input Box with Drag & Drop & Paste handlers */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col rounded-[26px] bg-[#16151d] border transition-colors shadow-xl ${
          isDragging
            ? 'border-violet-400 bg-[#1b1830]'
            : 'border-[#2c2a38] focus-within:border-[#5a5e63] focus-within:bg-[#1c1a24]'
        }`}
      >
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="*,.zip,.rar,.7z,.tar,.gz,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.html,.css,.sql,.xml,.pdf,.doc,.docx"
          className="hidden"
        />

        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageChange}
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          className="hidden"
        />

        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isLoading
                ? 'Luna sedang menjawab...'
                : imageAttachment
                ? 'Tanyakan apa saja tentang gambar ini (atau klik tombol kirim)...'
                : 'Tanyakan apa saja kepada Luna, atau ketik / untuk tools...'
            }
            rows={1}
            enterKeyHint={isTouch ? 'enter' : 'send'}
            aria-label="Pesan untuk Luna"
            className="block w-full resize-none bg-transparent text-base sm:text-[15px] text-neutral-100 placeholder-neutral-500 outline-none max-h-40 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between px-2 sm:px-3 pb-2 pt-0.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Upload Image Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`${iconBtn} ${imageAttachment ? 'text-violet-400 bg-violet-500/10' : ''}`}
              title="Kirim gambar ke Luna (Membaca & Analisis Gambar)"
              aria-label="Kirim gambar ke Luna"
            >
              <ImageIcon className="h-[18px] w-[18px]" />
            </button>

            {/* Upload Document / Code Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={iconBtn}
              title="Lampirkan file teks atau kode"
              aria-label="Lampirkan file"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>

            {/* Slash Tools Mode Button - sama gayanya dengan ikon gambar dan klip */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setShowToolsMenu((prev) => !prev)}
                className={`${iconBtn} ${showToolsMenu ? '!text-neutral-100 !bg-neutral-800' : ''}`}
                title="Mode Tools (/)"
                aria-label="Mode Tools"
              >
                <span className="font-mono text-base font-normal leading-none select-none">/</span>
              </button>

              {/* Slash Tools Popover - slides up cleanly, simple and compact */}
              <AnimatePresence>
                {showToolsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 bottom-full mb-2 w-60 sm:w-64 rounded-xl bg-[#1c1a24] border border-neutral-700/60 p-1 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex flex-col">
                      {SLASH_TOOLS.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleSelectTool(tool)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-neutral-200">
                              {tool.command}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium">
                              Aktif
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                            {tool.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`${iconBtn} ${isListening ? '!bg-rose-500/20 !text-rose-400 animate-pulse' : ''}`}
              title={isListening ? 'Hentikan perekaman' : 'Ketik dengan suara (Bahasa Indonesia)'}
              aria-label={isListening ? 'Hentikan perekaman' : 'Ketik dengan suara'}
            >
              {isListening ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 hover:bg-white active:scale-90 transition"
              title="Hentikan jawaban"
              aria-label="Hentikan jawaban"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full transition ${
                canSubmit
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400 active:scale-90'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
              }`}
              title="Kirim pesan"
              aria-label="Kirim pesan"
            >
              <ArrowUp className="h-[18px] w-[18px] stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] leading-snug text-neutral-400">
        Luna dapat membuat kekeliruan. Verifikasi informasi penting.
      </div>
    </div>
  );
};
