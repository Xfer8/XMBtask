import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import { IS_DEMO_MODE } from "../demoMode";

const AuthContext = createContext(null);
const DEMO_USER = Object.freeze({
  uid: "local-demo-user",
  email: "demo@local.invalid",
  displayName: "Demo User",
  photoURL: null,
});

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(IS_DEMO_MODE ? DEMO_USER : undefined); // undefined = still loading
  const [error,        setError]        = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [deniedUser,   setDeniedUser]   = useState(null); // { email, name } from rejected sign-in

  useEffect(() => {
    if (IS_DEMO_MODE) return undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      // Check whitelist
      try {
        const snap = await getDoc(doc(db, "config", "allowedUsers"));
        const allowed = snap.exists() ? (snap.data().emails ?? []) : [];

        if (allowed.includes(firebaseUser.email)) {
          const admins = snap.exists() ? (snap.data().admins ?? []) : [];
          setIsAdmin(admins.includes(firebaseUser.email));
          setAccessDenied(false);
          setUser(firebaseUser);
        } else {
          setDeniedUser({ email: firebaseUser.email, name: firebaseUser.displayName ?? "" });
          await signOut(auth);
          setIsAdmin(false);
          setAccessDenied(true);
          setUser(null);
        }
      } catch {
        // If the whitelist can't be read, deny access to be safe
        setDeniedUser({ email: firebaseUser.email, name: firebaseUser.displayName ?? "" });
        await signOut(auth);
        setIsAdmin(false);
        setAccessDenied(true);
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (IS_DEMO_MODE) return;
    setError(null);
    setAccessDenied(false);
    setDeniedUser(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const signOutUser = () => IS_DEMO_MODE ? undefined : signOut(auth);

  return (
    <AuthContext.Provider value={{ user, error, accessDenied, isAdmin, deniedUser, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
