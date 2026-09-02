import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { IS_DEMO_MODE } from "./demoMode";

const firebaseConfig = {
  apiKey: "AIzaSyBQTzuiw28rBbXNzCwxqdJvI69jgoZybHc",
  authDomain: "kai3d-31415.firebaseapp.com",
  projectId: "kai3d-31415",
  storageBucket: "kai3d-31415.firebasestorage.app",
  messagingSenderId: "125610247694",
  appId: "1:125610247694:web:8961196799f6d906a1de5f",
  measurementId: "G-1L0LNWWGD9"
};

export let app = null;
export let auth = null;
export let googleProvider = null;
export let db = null;
export let storage = null;

// Demo mode intentionally does not initialize Firebase. This makes the local
// preview incapable of authenticating, reading, writing, or uploading against
// the production project even if a service guard is accidentally missed.
if (!IS_DEMO_MODE) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  // Persistent local cache: writes are queued locally when offline and synced
  // automatically on reconnect. Multi-tab manager keeps multiple open tabs in sync.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  storage = getStorage(app);
}
