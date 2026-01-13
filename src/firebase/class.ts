import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase';

type ClassData = {
  subject: string;
  classLevel: string;
  batchTime: string;
};

/**
 * Creates a new class document in Firestore for the currently logged-in teacher.
 * @param classData - The data for the new class.
 * @returns The unique class code for the newly created class.
 * @throws An error if the user is not authenticated.
 */
export async function createClass(classData: ClassData): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated. Cannot create class.');
  }

  const { subject, classLevel, batchTime } = classData;

  if (!subject || !classLevel) {
    throw new Error('Subject and class level are required to create a class.');
  }

  // Generate a unique, human-readable class code
  const classCode = `${subject
    .substring(0, 4)
    .toUpperCase()}${classLevel.replace(/\s/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const newClassDoc = {
    teacherId: user.uid,
    subject,
    classLevel,
    batchTime,
    classCode,
    createdAt: serverTimestamp(),
    isActive: true,
  };

  await addDoc(collection(firestore, 'classes'), newClassDoc);

  return classCode;
}
