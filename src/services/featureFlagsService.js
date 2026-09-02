import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { IS_DEMO_MODE } from "../demoMode";

const flagsDoc = () => doc(db, "config", "featureFlags");

// Real-time subscription to feature flags
export function subscribeToFeatureFlags(callback) {
  if (IS_DEMO_MODE) {
    callback({ scratchPadEnabled: false });
    return () => {};
  }
  return onSnapshot(flagsDoc(), (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
}

// Update a single flag (admin only — enforced by Firestore rules)
export async function setFeatureFlag(key, value) {
  if (IS_DEMO_MODE) return;
  await setDoc(flagsDoc(), { [key]: value }, { merge: true });
}
