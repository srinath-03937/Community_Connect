import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBJ_FztJ1_FBTHon3fe4pGqnyQ_RCQ_TC8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "community-connect-ai-69b9e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "community-connect-ai-69b9e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "community-connect-ai-69b9e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "277390182182",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:277390182182:web:e9dfe699d069af4846a3e7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GR6PT18ES7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
