import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "../firebase";
import { IS_DEMO_MODE } from "../demoMode";

/**
 * Upload an image Blob to Firebase Storage under the current user's folder.
 * Returns { url, storagePath } on success.
 */
export const uploadImage = async (blob) => {
  if (IS_DEMO_MODE) throw new Error("Image uploads are disabled in local demo mode.");
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const ext = blob.type.split("/")[1] ?? "png";
  const path = `users/${uid}/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return { url, storagePath: path };
};

/**
 * Upload a feedback/screenshot image to the shared feedback/images/ path.
 * Any authenticated user can upload here; no per-user restriction.
 * Returns { url, storagePath } on success.
 */
export const uploadFeedbackImage = async (blob) => {
  if (IS_DEMO_MODE) throw new Error("Feedback uploads are disabled in local demo mode.");
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ext = blob.type.split("/")[1] ?? "png";
  const path = `feedback/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return { url, storagePath: path };
};

/**
 * Delete an image from Firebase Storage by its storagePath.
 * Silently ignores missing objects.
 */
export const deleteStorageImage = async (storagePath) => {
  if (IS_DEMO_MODE) return;
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    // object-not-found is fine — already gone
    if (err?.code !== "storage/object-not-found") throw err;
  }
};
