export interface ChatFileAttachment {
  name: string;
  size: number;
  type?: string;
  dataUrl?: string;
}

export interface TikTokData {
  id: string;
  author: {
    username: string;
    nickname: string;
    avatar?: string;
    verified?: boolean;
    signature?: string;
  };
  description?: string;
  cover?: string;
  stats?: {
    likes?: number;
    comments?: number;
    views?: number;
    shares?: number;
    saves?: number;
  };
  hashtags?: Array<{ hashtagName: string }>;
  downloadUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  model?: string;
  isStreaming?: boolean;
  imageUrl?: string;
  storagePath?: string;
  imageName?: string;
  tiktokData?: TikTokData;
  fileAttachment?: ChatFileAttachment;
  isProcessingTool?: boolean;
  processingToolType?: 'tiktok' | 'removebg';
}

export interface ChatSession {
  id: string;
  username: string;
  title: string;
  model: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatSummary {
  id: string;
  username: string;
  title: string;
  model: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid?: string;
  username: string;
  email?: string;
  displayName: string;
  photoURL?: string;
  avatarColor: string;
  hasPin?: boolean;
  createdAt: number;
  lastLoginAt: number;
  systemPrompt?: string;
}

export type ModelVariant = 'standard' | 'pro' | 'coder';

export interface ModelInfo {
  id: ModelVariant;
  name: string;
  badge: string;
  description: string;
  iconName: string;
}

export interface AttachedImage {
  dataUrl: string;
  name: string;
  size?: number;
  storagePath?: string;
  file?: File;
}

export interface SendOptions {
  /** Minta jawaban lebih rinci (tidak mengubah teks pesan yang tampil). */
  research?: boolean;
  forceModel?: ModelVariant;
  image?: AttachedImage;
  fileAttachment?: ChatFileAttachment;
}
