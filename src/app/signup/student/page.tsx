
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, collection, query, where, limit, getDocs, addDoc } from 'firebase/firestore';
import { School } from 'lucide-react';

export default function StudentSignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const classLevels = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  const createUserProfileDocument = async (user: any, additionalData: any) => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, `users/${user.uid}`);
    const { name, email, mobileNumber, classLevel } = additionalData;
    
    const dataToSet = {
      id: user.uid,
      name,
      email,
      mobileNumber,
      classLevel,
      role: 'student',
      createdAt: serverTimestamp(),
      status: 'approved', // Self-registered students are auto-approved
    };
    await setDoc(userRef, dataToSet);
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    if (!classLevel) {
        setError("Please select your class level.");
        return;
    }
    setError(null);
    setIsSigningUp(true);

    if (!auth || !firestore) {
      setError('Firebase Auth is not available. Please try again later.');
      setIsSigningUp(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfileDocument(user, { name, email, mobileNumber, classLevel });

      if (classCode.trim()) {
        const classesRef = collection(firestore, 'classes');
        const q = query(classesRef, where('classCode', '==', classCode.trim().toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const classDoc = querySnapshot.docs[0];
            const classData = classDoc.data();
            
            const enrollmentData = {
                studentId: user.uid,
                studentName: name.trim(),
                mobileNumber: mobileNumber.trim(),
                classId: classDoc.id,
                teacherId: classData.teacherId,
                classTitle: classData.title,
                classSubject: classData.subject,
                teacherName: classData.teacherName,
                batchTime: classData.batchTime,
                status: 'approved',
                createdAt: serverTimestamp(),
            };
            const enrollmentsColRef = collection(firestore, 'enrollments');
            await addDoc(enrollmentsColRef, enrollmentData);
        } else {
            console.warn("Invalid class code entered during signup. The user can join later from the dashboard.");
        }
      }

      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email address is already in use by another account.');
      } else {
        setError(error.message);
      }
    } finally {
        setIsSigningUp(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
      <div className="w-full max-w-sm p-4 sm:p-8 space-y-4">
          <div className="text-center">
              <School className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-3xl font-bold font-serif text-foreground mt-2">EduConnect Pro</h1>
              <p className="text-muted-foreground">Join our learning community.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Create a Student Account</CardTitle>
              <CardDescription>
                For students in Jharkhand, all study materials and books for classes 8 and above are provided for free.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              )}
              <form onSubmit={handleSignUp} className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" placeholder="e.g., Priya Sharma" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input id="mobile" placeholder="e.g., 9876543210" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="priya@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="class-level">Class</Label>
                    <Select onValueChange={setClassLevel} value={classLevel}>
                        <SelectTrigger id="class-level">
                            <SelectValue placeholder="Select your class level" />
                        </SelectTrigger>
                        <SelectContent>
                            {classLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                  <Label htmlFor="class-code">Class Code (Optional)</Label>
                  <Input 
                    id="class-code" 
                    placeholder="Enter code from your teacher" 
                    value={classCode} 
                    onChange={(e) => setClassCode(e.target.value)} 
                    className="uppercase"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

    
