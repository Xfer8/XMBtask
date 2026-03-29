import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQTzuiw28rBbXNzCwxqdJvI69jgoZybHc",
  authDomain: "kai3d-31415.firebaseapp.com",
  projectId: "kai3d-31415",
  storageBucket: "kai3d-31415.firebasestorage.app",
  messagingSenderId: "125610247694",
  appId: "1:125610247694:web:8961196799f6d906a1de5f",
  measurementId: "G-1L0LNWWGD9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
