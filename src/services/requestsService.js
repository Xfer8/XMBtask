import { db } from "../firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, arrayUnion,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";

// Submit a new access request (works unauthenticated)
export async function submitAccessRequest({ name, email, message }) {
  await addDoc(collection(db, "accessRequests"), {
    name,
    email,
    message,
    timestamp: serverTimestamp(),
  });
}

// Real-time listener for all pending requests (admin only)
export function subscribeToRequests(callback) {
  const q = query(collection(db, "accessRequests"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Approve: add email to allowedUsers, delete the request
export async function approveRequest(request) {
  await updateDoc(doc(db, "config", "allowedUsers"), {
    emails: arrayUnion(request.email),
  });
  await deleteDoc(doc(db, "accessRequests", request.id));
}

// Deny: just delete the request
export async function denyRequest(requestId) {
  await deleteDoc(doc(db, "accessRequests", requestId));
}
