import { createContext, useContext, useEffect, useState } from "react";
import { getIdTokenResult, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
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
  const [hasAccess,    setHasAccess]    = useState(IS_DEMO_MODE);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [deniedUser,   setDeniedUser]   = useState(null); // { email, name } from rejected sign-in

  useEffect(() => {
    if (IS_DEMO_MODE) return undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setHasAccess(false);
        setIsAdmin(false);
        setUser(null);
        return;
      }

      // Custom claims are assigned only by trusted Firebase administration.
      // They form the same server-enforced whitelist used by Firestore Rules.
      try {
        const token = await getIdTokenResult(firebaseUser, true);
        if (token.claims.xmbtaskAccess === true) {
          setHasAccess(true);
          setIsAdmin(token.claims.xmbtaskAdmin === true);
          setAccessDenied(false);
          setUser(firebaseUser);
        } else {
          setDeniedUser({ email: firebaseUser.email, name: firebaseUser.displayName ?? "" });
          await signOut(auth);
          setHasAccess(false);
          setIsAdmin(false);
          setAccessDenied(true);
          setUser(null);
        }
      } catch {
        // If the access claim cannot be verified, deny access to be safe.
        setDeniedUser({ email: firebaseUser.email, name: firebaseUser.displayName ?? "" });
        await signOut(auth);
        setHasAccess(false);
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
    <AuthContext.Provider value={{ user, error, accessDenied, hasAccess, isAdmin, deniedUser, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
