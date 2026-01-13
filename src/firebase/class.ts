
import { addDoc, collection, serverTimestamp, Firestore } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new class document in Firestore.
 * @param firestore - The Firestore instance.
 * @param teacherId - The UID of the teacher creating the class.
 * @param subject - The subject of the class.
 * @param classLevel - The level of the class (e.g., "9-10").
 */
export async function createClass(
  firestore: Firestore,
  teacherId: string,
  subject: string,
  classLevel: string
) {
  if (!teacherId) {
    throw new Error("User not logged in");
  }

  // Generate a unique, human-readable-ish class code
  const classCode = uuidv4().slice(0, 6).toUpperCase();

  await addDoc(collection(firestore, "classes"), {
    teacherId,
    subject,
    classLevel,
    classCode,
    isActive: true,
    createdAt: serverTimestamp()
  });
}
