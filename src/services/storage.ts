import { UserProfile, ChatSession, ChatSummary, ChatMessage } from '../types';
import {
  listFirebaseChats,
  createFirebaseChat,
  getFirebaseChat,
  updateFirebaseChat,
  deleteFirebaseChat,
  addFirebaseMessage,
  saveFirebaseUser,
} from './firebase';

function getLocalUsers(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem('luna_all_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, UserProfile>) {
  try {
    localStorage.setItem('luna_all_users', JSON.stringify(users));
  } catch (err) {
    console.warn('Storage save error:', err);
  }
}

function getLocalChats(key: string): Record<string, ChatSession> {
  const clean = key.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(`luna_chats_${clean}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalChats(key: string, chats: Record<string, ChatSession>) {
  const clean = key.trim().toLowerCase();
  try {
    localStorage.setItem(`luna_chats_${clean}`, JSON.stringify(chats));
  } catch (err) {
    console.warn('Storage save chats error:', err);
  }
}

function resolveUser(userOrUsername: UserProfile | string): { clean: string; uid?: string; user?: UserProfile } {
  if (typeof userOrUsername === 'object' && userOrUsername !== null) {
    const clean = (userOrUsername.uid || userOrUsername.username).trim().toLowerCase();
    if (userOrUsername.uid) {
      const users = getLocalUsers();
      users[userOrUsername.uid] = userOrUsername;
      users[userOrUsername.username.toLowerCase()] = userOrUsername;
      saveLocalUsers(users);
    }
    return { clean, uid: userOrUsername.uid, user: userOrUsername };
  }
  const clean = String(userOrUsername || '').trim().toLowerCase();
  const users = getLocalUsers();
  let found: UserProfile | undefined = users[clean];
  if (!found) {
    found = Object.values(users).find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.uid?.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );
  }
  return { clean, uid: found?.uid, user: found };
}

export function createDefaultUser(username: string, displayName?: string, email?: string): UserProfile {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const colors = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];
  const namePart = displayName?.trim() || clean.split('@')[0] || clean;
  return {
    username: clean,
    email: email || (clean.includes('@') ? clean : undefined),
    displayName: namePart,
    avatarColor,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    systemPrompt:
      'Identitas Utama: Nama Anda adalah Luna. Anda adalah asisten kecerdasan buatan cerdas yang dibuat dan dikembangkan oleh Gimoy Studio.',
  };
}

export const StorageService = {
  // Test if backend API is online
  async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Robust User Login / Account Creation
  async login(
    username: string,
    displayName?: string,
    pin?: string,
    email?: string
  ): Promise<{ user: UserProfile; isOffline: boolean }> {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername) {
      throw new Error('Username tidak boleh kosong');
    }
    const cleanEmail = email ? email.trim().toLowerCase() : cleanUsername.includes('@') ? cleanUsername : undefined;
    let isOffline = false;
    let finalUser: UserProfile | null = null;

    // 1. Attempt Server Login
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          displayName: displayName?.trim() || undefined,
          pin: pin?.trim() || undefined,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          finalUser = data.user;
        }
      } else if (!res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error && data.error.includes('PIN')) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('PIN')) {
        throw err;
      }
      isOffline = true;
    }

    // 2. Fallback to Local Storage Account
    if (!finalUser) {
      const users = getLocalUsers();
      if (users[cleanUsername]) {
        finalUser = {
          ...users[cleanUsername],
          displayName: displayName?.trim() || users[cleanUsername].displayName,
          lastLoginAt: Date.now(),
        };
      } else {
        finalUser = createDefaultUser(cleanUsername, displayName, cleanEmail);
      }
      users[cleanUsername] = finalUser;
      saveLocalUsers(users);
      isOffline = true;
    }

    // Sync to local state
    localStorage.setItem('luna_username', finalUser.username);
    const users = getLocalUsers();
    users[finalUser.username] = finalUser;
    saveLocalUsers(users);

    return { user: finalUser, isOffline };
  },

  // Get User Profile
  async getUser(username: string): Promise<UserProfile> {
    const clean = username.trim().toLowerCase();

    if (clean === 'ardan' || clean === 'guest_user') {
      throw new Error('Akun uji coba telah dihapus');
    }

    try {
      const res = await fetch(`/api/auth/me?username=${encodeURIComponent(clean)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          const users = getLocalUsers();
          users[clean] = data.user;
          saveLocalUsers(users);
          return data.user;
        }
      }
    } catch {
      // Ignore network error
    }

    const users = getLocalUsers();
    if (users[clean]) return users[clean];
    const newUser = createDefaultUser(clean);
    users[clean] = newUser;
    saveLocalUsers(users);
    return newUser;
  },

  // Update Profile
  async updateProfile(userOrUsername: UserProfile | string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { clean, uid, user } = resolveUser(userOrUsername);
    const existing = user || createDefaultUser(clean);
    const updated: UserProfile = { ...existing, ...updates, username: clean };

    const users = getLocalUsers();
    users[clean] = updated;
    if (uid) {
      users[uid] = updated;
    }
    saveLocalUsers(users);

    // Sync to Firestore if user has Firebase UID
    if (uid) {
      saveFirebaseUser(updated).catch(() => {});
    }

    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clean,
          displayName: updates.displayName,
          avatarColor: updates.avatarColor,
          systemPrompt: updates.systemPrompt,
        }),
      });
    } catch {
      // Background sync ignored if offline
    }

    return updated;
  },

  // List Chats (Supports Firebase Firestore and Local Storage)
  async listChats(userOrUsername: UserProfile | string): Promise<ChatSummary[]> {
    const { clean, uid } = resolveUser(userOrUsername);

    // 1. If signed in with Firebase, fetch from Firestore
    if (uid) {
      try {
        const firestoreChats = await listFirebaseChats(uid);
        const localChats = getLocalChats(uid);
        for (const fc of firestoreChats) {
          if (!localChats[fc.id]) {
            localChats[fc.id] = {
              ...fc,
              messages: [],
            };
          } else {
            localChats[fc.id].title = fc.title;
            localChats[fc.id].pinned = fc.pinned;
            localChats[fc.id].model = fc.model;
            localChats[fc.id].updatedAt = fc.updatedAt;
          }
        }
        saveLocalChats(uid, localChats);
        return firestoreChats;
      } catch (err) {
        console.warn('Firestore listChats fallback to local:', err);
      }
    }

    // 2. Fallback to server endpoint
    try {
      const res = await fetch(`/api/chats?username=${encodeURIComponent(clean)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.chats) && data.chats.length > 0) {
          return data.chats;
        }
      }
    } catch {
      // Network failure
    }

    // 3. Fallback to local chats
    const chats = getLocalChats(clean);
    return Object.values(chats)
      .map(({ id, username: u, title, model, pinned, createdAt, updatedAt }) => ({
        id,
        username: u,
        title,
        model,
        pinned,
        createdAt,
        updatedAt,
      }))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  },

  // Get Single Chat
  async getChat(chatId: string, userOrUsername: UserProfile | string): Promise<ChatSession | null> {
    const { clean, uid } = resolveUser(userOrUsername);

    // 1. Check Firebase Firestore if user has UID
    if (uid) {
      try {
        const fbChat = await getFirebaseChat(uid, chatId);
        if (fbChat) {
          const localChats = getLocalChats(uid);
          localChats[chatId] = fbChat;
          saveLocalChats(uid, localChats);
          return fbChat;
        }
      } catch (err) {
        console.warn('Firestore getChat fallback to local:', err);
      }
    }

    // 2. Check server endpoint
    try {
      const res = await fetch(`/api/chats/${chatId}?username=${encodeURIComponent(clean)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.chat) {
          const localChats = getLocalChats(clean);
          localChats[chatId] = data.chat;
          saveLocalChats(clean, localChats);
          return data.chat;
        }
      }
    } catch {
      // Ignore
    }

    // 3. Local fallback
    const localChats = getLocalChats(clean);
    return localChats[chatId] || null;
  },

  // Create Chat
  async createChat(
    userOrUsername: UserProfile | string,
    title?: string,
    model = 'standard'
  ): Promise<ChatSession> {
    const { clean, uid } = resolveUser(userOrUsername);
    const chatTitle = title?.trim() || 'Percakapan Baru';

    // 1. Create in Firebase Firestore if user has UID
    if (uid) {
      try {
        const fbChat = await createFirebaseChat(uid, chatTitle, model);
        const localChats = getLocalChats(uid);
        localChats[fbChat.id] = fbChat;
        saveLocalChats(uid, localChats);
        return fbChat;
      } catch (err) {
        console.warn('Firestore createChat fallback to local:', err);
      }
    }

    // 2. Create in Local storage
    const id = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newChat: ChatSession = {
      id,
      username: clean,
      title: chatTitle,
      model,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    const localChats = getLocalChats(clean);
    localChats[id] = newChat;
    saveLocalChats(clean, localChats);

    // Try server sync
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean, title: newChat.title, model: newChat.model }),
    }).catch(() => {});

    return newChat;
  },

  // Update Chat
  async updateChat(
    chatId: string,
    userOrUsername: UserProfile | string,
    updates: Partial<Pick<ChatSession, 'title' | 'pinned' | 'model'>>
  ): Promise<void> {
    const { clean, uid } = resolveUser(userOrUsername);
    const localKey = uid || clean;

    // 1. Local update
    const localChats = getLocalChats(localKey);
    if (localChats[chatId]) {
      localChats[chatId] = {
        ...localChats[chatId],
        ...updates,
        updatedAt: Date.now(),
      };
      saveLocalChats(localKey, localChats);
    }

    // 2. Firebase update if authenticated
    if (uid) {
      updateFirebaseChat(uid, chatId, updates).catch(() => {});
    }

    // 3. Server update
    fetch(`/api/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean, ...updates }),
    }).catch(() => {});
  },

  // Delete Chat
  async deleteChat(chatId: string, userOrUsername: UserProfile | string): Promise<void> {
    const { clean, uid } = resolveUser(userOrUsername);
    const localKey = uid || clean;

    // 1. Delete locally
    const localChats = getLocalChats(localKey);
    delete localChats[chatId];
    saveLocalChats(localKey, localChats);

    // 2. Delete from Firebase Firestore if authenticated
    if (uid) {
      deleteFirebaseChat(uid, chatId).catch(() => {});
    }

    // 3. Delete from Server
    fetch(`/api/chats/${chatId}?username=${encodeURIComponent(clean)}`, {
      method: 'DELETE',
    }).catch(() => {});
  },

  // Clear All Chats
  async clearChats(userOrUsername: UserProfile | string): Promise<void> {
    const { clean, uid } = resolveUser(userOrUsername);
    saveLocalChats(clean, {});

    if (uid) {
      listFirebaseChats(uid).then((all) => {
        for (const c of all) {
          deleteFirebaseChat(uid, c.id).catch(() => {});
        }
      });
    }

    fetch(`/api/chats?username=${encodeURIComponent(clean)}`, {
      method: 'DELETE',
    }).catch(() => {});
  },

  // Save Message Locally & Sync to Firebase Firestore & Server
  saveMessageLocally(chatId: string, userOrUsername: UserProfile | string, message: ChatMessage): void {
    const { clean, uid } = resolveUser(userOrUsername);
    const localKey = uid || clean;
    const localChats = getLocalChats(localKey);

    if (localChats[chatId]) {
      const existingIdx = localChats[chatId].messages.findIndex((m) => m.id === message.id);
      if (existingIdx >= 0) {
        localChats[chatId].messages[existingIdx] = message;
      } else {
        localChats[chatId].messages.push(message);
      }

      localChats[chatId].updatedAt = Date.now();
      if (localChats[chatId].title === 'Percakapan Baru' && message.role === 'user') {
        const summary = message.content.trim().split('\n')[0].substring(0, 38);
        if (summary.length > 0) {
          localChats[chatId].title = summary;
          if (uid) {
            updateFirebaseChat(uid, chatId, { title: summary }).catch(() => {});
          }
          fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: clean, title: summary }),
          }).catch(() => {});
        }
      }
      saveLocalChats(localKey, localChats);
    }

    // Sync message to Firebase Firestore
    if (uid && !message.isStreaming) {
      addFirebaseMessage(uid, chatId, {
        role: message.role,
        content: message.content,
        model: message.model,
        imageUrl: message.imageUrl,
        storagePath: message.storagePath,
        imageName: message.imageName,
      }).catch((err) => {
        console.warn('Firestore addMessage error:', err);
      });
    }

    // Sync to Server endpoint
    if (!message.isStreaming) {
      fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clean,
          role: message.role,
          content: message.content,
          model: message.model,
          imageUrl: message.imageUrl,
          imageName: message.imageName,
        }),
      }).catch(() => {});
    }
  },
};
