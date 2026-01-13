import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "./firebase";

export async function uploadMaterial(title: string, classId: string) {
  if (!auth.currentUser) return;

  await addDoc(collection(firestore, "studyMaterials"), {
    title,
    classId,
    teacherId: auth.currentUser.uid,
    isFree: true,
    createdAt: serverTimestamp(),
  });
}
