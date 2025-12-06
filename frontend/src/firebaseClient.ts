// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <--- 1. Importă asta

const firebaseConfig = {
  apiKey: "AIzaSyA3Q3nXtVYalLn6sB0u4Z49bV20WA9zZe8",
  authDomain: "retro-app-41f87.firebaseapp.com",
  projectId: "retro-app-41f87",
  storageBucket: "retro-app-41f87.firebasestorage.app",
  messagingSenderId: "242369148302",
  appId: "1:242369148302:web:700f1a11b4cedb90ef20df",
  measurementId: "G-W9BB98WKHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app); // <--- 2. Exportă baza de date
export default app;