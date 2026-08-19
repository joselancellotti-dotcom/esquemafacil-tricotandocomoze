import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase App with active API Key
const activeFirebaseConfig = {
  ...firebaseConfig,
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey
};

const app = initializeApp(activeFirebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Configure Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();

// Request read-only YouTube access to fetch the user's channel ID
googleProvider.addScope("https://www.googleapis.com/auth/youtube.readonly");
