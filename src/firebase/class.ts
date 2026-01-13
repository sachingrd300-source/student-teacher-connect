import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "./firebase";

export async function createClass(subject: string, classLevel: string) {
  if (!auth.currentUser) {
    throw new Error("User not logged in");
  }

  // Generate a unique, human-readable-ish class code
  const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  await addDoc(collection(firestore, "classes"), {
    subject,
    classLevel,
    teacherId: auth.currentUser.uid,
    classCode,
    isActive: true,
    createdAt: serverTimestamp(),
  });
}
