import { db } from "../firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, arrayUnion,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { IS_DEMO_MODE } from "../demoMode";

// Submit a new access request (works unauthenticated)
export async function submitAccessRequest({ name, email, message }) {
  if (IS_DEMO_MODE) throw new Error("Access requests are disabled in local demo mode.");
  await addDoc(collection(db, "accessRequests"), {
    name,
    email,
    message,
    timestamp: serverTimestamp(),
  });
}

// Real-time listener for all pending requests (admin only)
export function subscribeToRequests(callback) {
  if (IS_DEMO_MODE) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "accessRequests"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Approve: add email to allowedUsers, delete the request
export async function approveRequest(request) {
  if (IS_DEMO_MODE) throw new Error("User administration is disabled in local demo mode.");
  await updateDoc(doc(db, "config", "allowedUsers"), {
    emails: arrayUnion(request.email),
  });
  await deleteDoc(doc(db, "accessRequests", request.id));
}

// Deny: just delete the request
export async function denyRequest(requestId) {
  if (IS_DEMO_MODE) throw new Error("User administration is disabled in local demo mode.");
  await deleteDoc(doc(db, "accessRequests", requestId));
}
