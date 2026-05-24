// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDek7vp8sk9TLMsGqzqo2UEiZFgfu3WeGM",
  authDomain: "estai-web.firebaseapp.com",
  projectId: "estai-web",
  storageBucket: "estai-web.firebasestorage.app",
  messagingSenderId: "399458102016",
  appId: "1:399458102016:web:7cc3ae19d722fda78321e5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };