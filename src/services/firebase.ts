import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadString,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ChatSession, ChatSummary, ChatMessage } from '../types';

// 1. Initialize Firebase App (Singleton)
//
// Domain login kustom: popup Google menampilkan "authDomain". Bila situs dibuka dari
// domain Gimoy Studio, pakai login.gimoystudio.my.id (halaman /__/auth/* diteruskan ke
// Firebase lewat rewrite di vercel.json). Di domain lain (localhost, *.vercel.app) tetap
// memakai domain bawaan Firebase supaya login tidak rusak.
const CUSTOM_AUTH_DOMAIN = 'login.gimoystudio.my.id';
const CUSTOM_AUTH_ROOT = 'gimoystudio.my.id';

function resolveAuthDomain(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === CUSTOM_AUTH_ROOT || host.endsWith(`.${CUSTOM_AUTH_ROOT}`)) {
      return CUSTOM_AUTH_DOMAIN;
    }
  }
  return firebaseConfig.authDomain;
}

export const app =
  getApps().length === 0
    ? initializeApp({ ...firebaseConfig, authDomain: resolveAuthDomain() })
    : getApp();

// 2. Auth Instance & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 3. Firestore Instance with configured database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 4. Firebase Storage Instance
export const storage = getStorage(
  app,
  firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
);

// 5. Standard Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 5. Validate Firestore Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, falling back to local cache.');
      return false;
    }
    console.warn('Firestore test connection notice:', error);
    return true;
  }
}
testFirestoreConnection().catch(() => {});

// 6. Firebase Google Authentication Service
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  const rawUsername =
    fbUser.email?.split('@')[0] ||
    fbUser.displayName?.toLowerCase().replace(/\s+/g, '_') ||
    `user_${fbUser.uid.substring(0, 6)}`;
  const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  const userProfile: UserProfile = {
    uid: fbUser.uid,
    username: cleanUsername,
    email: fbUser.email || undefined,
    displayName: fbUser.displayName || cleanUsername,
    photoURL: fbUser.photoURL || undefined,
    avatarColor: '#ffbf48',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    systemPrompt:
      'Identitas Utama: Nama Anda adalah Luna. Anda adalah asisten kecerdasan buatan cerdas yang dibuat dan dikembangkan oleh Gimoy Studio.',
  };

  // Sync to Firestore
  try {
    await saveFirebaseUser(userProfile);
  } catch (err) {
    console.warn('Could not save user to Firestore immediately:', err);
  }

  return userProfile;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// 7. Firestore User Profile Operations
export async function saveFirebaseUser(user: UserProfile): Promise<void> {
  if (!user.uid) return;
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef).catch(() => null);

    if (existingSnap && existingSnap.exists()) {
      const existing = existingSnap.data();
      await updateDoc(userRef, {
        lastLoginAt: Date.now(),
        displayName: user.displayName || existing.displayName,
        photoURL: user.photoURL || existing.photoURL,
        email: user.email || existing.email || '',
      });
    } else {
      await setDoc(userRef, {
        id: user.uid,
        username: user.username,
        displayName: user.displayName,
        email: user.email || '',
        photoURL: user.photoURL || '',
        avatarColor: user.avatarColor || '#ffbf48',
        createdAt: user.createdAt || Date.now(),
        lastLoginAt: Date.now(),
        systemPrompt: user.systemPrompt || '',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getFirebaseUser(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      username: data.username || uid,
      displayName: data.displayName || 'Pengguna Google',
      email: data.email || undefined,
      photoURL: data.photoURL || undefined,
      avatarColor: data.avatarColor || '#ffbf48',
      createdAt: data.createdAt || Date.now(),
      lastLoginAt: data.lastLoginAt || Date.now(),
      systemPrompt: data.systemPrompt || undefined,
    };
  } catch (error) {
    console.error('Error fetching Firestore user:', error);
    return null;
  }
}

// 8. Firestore Chats Operations
export async function listFirebaseChats(uid: string): Promise<ChatSummary[]> {
  const path = `users/${uid}/chats`;
  try {
    const chatsCol = collection(db, 'users', uid, 'chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        username: data.username || uid,
        title: data.title || 'Percakapan Baru',
        model: data.model || 'standard',
        pinned: !!data.pinned,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      };
    });
  } catch (error) {
    console.error('Error listing Firestore chats:', error);
    return [];
  }
}

export async function createFirebaseChat(
  uid: string,
  title: string,
  model = 'standard'
): Promise<ChatSession> {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const path = `users/${uid}/chats/${chatId}`;

  const newChatData = {
    id: chatId,
    userId: uid,
    username: uid,
    title,
    model,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    await setDoc(chatRef, newChatData);

    return {
      ...newChatData,
      messages: [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function uploadChatImageToFirebase(
  uid: string,
  chatId: string,
  fileOrBase64: File | Blob | string,
  fileName: string
): Promise<{ imageUrl: string; storagePath?: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.jpg';
  const timestamp = Date.now();
  const path = `users/${uid}/chats/${chatId}/images/${timestamp}_${safeName}`;

  // Obtain fallback data URL immediately
  let fallbackDataUrl = '';
  if (typeof fileOrBase64 === 'string') {
    fallbackDataUrl = fileOrBase64;
  } else {
    try {
      fallbackDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    } catch {
      fallbackDataUrl = '';
    }
  }

  try {
    const fileRef = storageRef(storage, path);
    const uploadTask = (async () => {
      if (typeof fileOrBase64 === 'string') {
        await uploadString(fileRef, fileOrBase64, 'data_url');
      } else {
        await uploadBytes(fileRef, fileOrBase64);
      }
      return await getDownloadURL(fileRef);
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage timeout')), 2200)
    );

    const downloadUrl = await Promise.race([uploadTask, timeoutPromise]);
    return {
      imageUrl: downloadUrl,
      storagePath: path,
    };
  } catch (storageError) {
    // Graceful fallback to optimized data URL stored directly in Firestore
    return {
      imageUrl: fallbackDataUrl,
    };
  }
}

export async function deleteFirebaseImage(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    const fileRef = storageRef(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Firebase Storage image deletion notice:', error);
  }
}

export async function getFirebaseChat(uid: string, chatId: string): Promise<ChatSession | null> {
  const path = `users/${uid}/chats/${chatId}`;
  try {
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) return null;
    const chatData = chatSnap.data();

    // Fetch messages subcollection
    const messagesCol = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    const msgSnap = await getDocs(q);

    const messages: ChatMessage[] = msgSnap.docs.map((mDoc) => {
      const m = mDoc.data();
      return {
        id: mDoc.id,
        role: m.role || 'user',
        content: m.content || '',
        createdAt: m.createdAt || Date.now(),
        model: m.model || undefined,
        imageUrl: m.imageUrl || undefined,
        storagePath: m.storagePath || undefined,
        imageName: m.imageName || undefined,
      };
    });

    return {
      id: chatId,
      username: chatData.username || uid,
      title: chatData.title || 'Percakapan',
      model: chatData.model || 'standard',
      pinned: !!chatData.pinned,
      createdAt: chatData.createdAt || Date.now(),
      updatedAt: chatData.updatedAt || Date.now(),
      messages,
    };
  } catch (error) {
    console.error('Error fetching Firebase chat details:', error);
    return null;
  }
}

export async function updateFirebaseChat(
  uid: string,
  chatId: string,
  updates: { title?: string; pinned?: boolean; model?: string }
): Promise<void> {
  const path = `users/${uid}/chats/${chatId}`;
  try {
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    await updateDoc(chatRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFirebaseChat(uid: string, chatId: string): Promise<void> {
  const path = `users/${uid}/chats/${chatId}`;
  try {
    // 1. Fetch messages first and delete any associated images from Firebase Storage
    const messagesCol = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const msgSnap = await getDocs(messagesCol).catch(() => null);
    if (msgSnap) {
      for (const mDoc of msgSnap.docs) {
        const m = mDoc.data();
        if (m.storagePath) {
          try {
            await deleteFirebaseImage(m.storagePath);
          } catch (e) {
            console.warn('Error deleting message image from Firebase Storage:', e);
          }
        }
        await deleteDoc(mDoc.ref).catch(() => {});
      }
    }
    // 2. Delete chat document
    await deleteDoc(doc(db, 'users', uid, 'chats', chatId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addFirebaseMessage(
  uid: string,
  chatId: string,
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    imageUrl?: string;
    storagePath?: string;
    imageName?: string;
  }
): Promise<ChatMessage> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const path = `users/${uid}/chats/${chatId}/messages/${msgId}`;

  const msgData: Record<string, any> = {
    id: msgId,
    chatId,
    userId: uid,
    role: message.role,
    content: message.content,
    model: message.model || null,
    createdAt: now,
  };

  if (message.imageUrl) {
    msgData.imageUrl = message.imageUrl;
  }
  if (message.storagePath) {
    msgData.storagePath = message.storagePath;
  }
  if (message.imageName) {
    msgData.imageName = message.imageName;
  }

  try {
    const msgRef = doc(db, 'users', uid, 'chats', chatId, 'messages', msgId);
    await setDoc(msgRef, msgData);

    // Update chat updatedAt timestamp
    const chatRef = doc(db, 'users', uid, 'chats', chatId);
    await updateDoc(chatRef, { updatedAt: now }).catch(() => {});

    return {
      id: msgId,
      role: message.role,
      content: message.content,
      createdAt: now,
      model: message.model,
      imageUrl: message.imageUrl,
      storagePath: message.storagePath,
      imageName: message.imageName,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
