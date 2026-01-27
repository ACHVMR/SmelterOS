/**
 * Firebase Client SDK for SmelterOS
 * 
 * Handles authentication and Firestore operations.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cosmic-tenure-480918-a9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Auth Functions
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user document
    await createOrUpdateUser(user);
    
    return { user, error: null };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error };
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// User Document Functions
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    tier: "free" | "dataEntry" | "premium";
    status: "active" | "canceled" | "past_due" | "trialing";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  apiKeys: {
    openrouter?: string; // Encrypted
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  usage: {
    requestsToday: number;
    tokensThisMonth: number;
    lastResetDate: Date;
  };
}

async function createOrUpdateUser(user: User) {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create new user
    const newUser: UserDocument = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
      subscription: {
        tier: "free",
        status: "active",
      },
      apiKeys: {},
      usage: {
        requestsToday: 0,
        tokensThisMonth: 0,
        lastResetDate: new Date(),
      },
    };
    await setDoc(userRef, newUser);
    return newUser;
  } else {
    // Update existing user
    await updateDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: new Date(),
    });
    return userDoc.data() as UserDocument;
  }
}

export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? (userDoc.data() as UserDocument) : null;
}

export async function updateUserSubscription(
  uid: string,
  subscription: Partial<UserDocument["subscription"]>
) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    subscription,
    updatedAt: new Date(),
  });
}

export async function saveUserApiKey(
  uid: string,
  provider: string,
  encryptedKey: string
) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    [`apiKeys.${provider}`]: encryptedKey,
    updatedAt: new Date(),
  });
}

export async function incrementUsage(uid: string, tokens: number) {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data() as UserDocument;
    const today = new Date().toDateString();
    const lastReset = new Date(data.usage.lastResetDate).toDateString();
    
    const newUsage = {
      requestsToday: today === lastReset ? data.usage.requestsToday + 1 : 1,
      tokensThisMonth: data.usage.tokensThisMonth + tokens,
      lastResetDate: today === lastReset ? data.usage.lastResetDate : new Date(),
    };
    
    await updateDoc(userRef, { usage: newUsage });
  }
}

// Circuit Box Config
export async function getCircuitBoxConfig() {
  const configRef = doc(db, "config", "circuit-box");
  const configDoc = await getDoc(configRef);
  return configDoc.exists() ? configDoc.data() : null;
}

export { app, auth, db };
