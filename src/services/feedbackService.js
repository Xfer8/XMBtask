import { db } from "../firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { IS_DEMO_MODE } from "../demoMode";

// Any authenticated user can submit feedback
export async function submitFeedback({ type, description, userEmail, userName, images = [] }) {
  if (IS_DEMO_MODE) throw new Error("Feedback is disabled in local demo mode.");
  await addDoc(collection(db, "feedback"), {
    type,
    description,
    images,                              // array of { url, storagePath } objects
    userEmail:   userEmail ?? "Unknown",
    userName:    userName  ?? "Unknown",
    submittedAt: serverTimestamp(),
  });
}

// Real-time listener for pending feedback (admin only)
export function subscribeToFeedback(callback) {
  if (IS_DEMO_MODE) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "feedback"), orderBy("submittedAt", "asc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Delete after processing
export async function deleteFeedback(id) {
  if (IS_DEMO_MODE) return;
  await deleteDoc(doc(db, "feedback", id));
}
