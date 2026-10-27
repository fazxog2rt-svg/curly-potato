import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { api } from "@/lib/api";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Check if Firebase keys are set in environment
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

// Safely initialize Firebase app on client
let app: any = null;
let auth: any = null;
let googleProvider: any = null;

if (typeof window !== "undefined") {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
    }
  } catch (error) {
    console.error("Firebase initialization warning:", error);
  }
}

/**
 * Perform real Google Login with Firebase Auth popup
 * Authenticates with Firebase, obtains the Google ID Token, and exchanges it with our backend.
 */
export async function loginWithGoogleFirebase(): Promise<any> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error(
      "Firebase belum dikonfigurasi. Harap lengkapi NEXT_PUBLIC_FIREBASE_API_KEY di file .env."
    );
  }

  // 1. Trigger Firebase Google Popup
  const userCredential = await signInWithPopup(auth, googleProvider);
  const fbUser: FirebaseUser = userCredential.user;

  // 2. Get real Firebase ID Token
  const idToken = await fbUser.getIdToken();

  // 3. Exchange with our backend database (Neon PostgreSQL) to create/retrieve user session
  const res = await api.auth.googleAuth({
    credential: idToken,
    email: fbUser.email || "",
    full_name: fbUser.displayName || "Pelajar Google",
  });

  if (res?.access_token) {
    localStorage.setItem("study_token", res.access_token);
    localStorage.setItem(
      "study_user",
      JSON.stringify({
        ...res.user,
        photoURL: fbUser.photoURL,
      })
    );
  }

  return res;
}

export { app, auth, googleProvider, signOut };
