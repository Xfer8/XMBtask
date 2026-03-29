import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const FLAGS_DOC = doc(db, "config", "featureFlags");

// Real-time subscription to feature flags
export function subscribeToFeatureFlags(callback) {
  return onSnapshot(FLAGS_DOC, (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
}

// Update a single flag (admin only — enforced by Firestore rules)
export async function setFeatureFlag(key, value) {
  await setDoc(FLAGS_DOC, { [key]: value }, { merge: true });
}
