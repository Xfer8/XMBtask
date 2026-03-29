import { db } from "../firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";

// Any authenticated user can submit feedback
export async function submitFeedback({ type, description, userEmail, userName }) {
  await addDoc(collection(db, "feedback"), {
    type,
    description,
    userEmail:   userEmail ?? "Unknown",
    userName:    userName  ?? "Unknown",
    submittedAt: serverTimestamp(),
  });
}

// Real-time listener for pending feedback (admin only)
export function subscribeToFeedback(callback) {
  const q = query(collection(db, "feedback"), orderBy("submittedAt", "asc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Delete after processing
export async function deleteFeedback(id) {
  await deleteDoc(doc(db, "feedback", id));
}
