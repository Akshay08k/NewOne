
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Use environment variables for sensitive data
const firebaseConfig = {
  // apiKey: process.env.FIREBASE_API_KEY,
  // authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // projectId: process.env.FIREBASE_PROJECT_ID,
  // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.FIREBASE_APP_ID,
  // measurementId: process.env.FIREBASE_MEASUREMENT_ID // Optional
  apiKey: "AIzaSyBJ0JhTy64vfvjC_Kca1HgTk4AxfSBBVQQ",
  authDomain: "taskflow-gr28u.firebaseapp.com",
  projectId: "taskflow-gr28u",
  storageBucket: "taskflow-gr28u.firebasestorage.app",
  messagingSenderId: "332913082587",
  appId: "1:332913082587:web:a2a14692d0937e39e1ccfe"
};
console.log(firebaseConfig)

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
