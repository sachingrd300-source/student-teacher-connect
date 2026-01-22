
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
import { useAuth, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface PendingStudentData {
    studentName: string;
    fatherName: string;
    mobileNumber: string;
    address: string;
    teacherId: string;
    teacherName: string;
    classId: string;
    classTitle: string;
}

export default function StudentSignupPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [studentId, setStudentId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    const [pendingData, setPendingData] = useState<PendingStudentData | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState<string | null>(null);

    const handleIdVerification = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsVerifying(true);
        if (!studentId.trim() || !firestore) {
            setError('Please enter a valid Student ID.');
            setIsVerifying(false);
            return;
        }

        try {
            const pendingStudentRef = doc(firestore, 'pendingStudents', studentId.trim());
            const docSnap = await getDoc(pendingStudentRef);

            if (docSnap.exists()) {
                setPendingData(docSnap.data() as PendingStudentData);
                setStep(2);
            } else {
                setError('Invalid Student ID. Please check the ID and try again.');
            }
        } catch (err) {
            console.error("Error verifying Student ID:", err);
            setError('An error occurred during verification. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCreateAccount = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password || !pendingData || !firestore) {
            setError('Please fill out all fields.');
            return;
        }

        try {
            // 1. Create the Firebase Auth user
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Create the user profile in 'users' collection
            const userRef = doc(firestore, `users/${user.uid}`);
            const userProfileData = {
                id: user.uid,
                name: pendingData.studentName,
                fatherName: pendingData.fatherName,
                mobileNumber: pendingData.mobileNumber,
                address: pendingData.address,
                email: user.email,
                role: 'student',
                createdAt: serverTimestamp(),
                status: 'approved',
            };
            setDocumentNonBlocking(userRef, userProfileData, { merge: true });

            // 3. Create an 'approved' enrollment document
            const enrollmentData = {
                studentId: user.uid,
                studentName: pendingData.studentName,
                classId: pendingData.classId,
                teacherId: pendingData.teacherId,
                classTitle: pendingData.classTitle,
                teacherName: pendingData.teacherName,
                status: 'approved',
                createdAt: serverTimestamp(),
            };
            const enrollmentsColRef = collection(firestore, 'enrollments');
            addDocumentNonBlocking(enrollmentsColRef, enrollmentData);
            
            // 4. Delete the pending student document
            const pendingStudentRef = doc(firestore, 'pendingStudents', studentId.trim());
            await deleteDoc(pendingStudentRef);

            // 5. Redirect to the dashboard
            router.push('/dashboard');

        } catch (error: any) {
            setError(error.message);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Student Signup</CardTitle>
                    <CardDescription>
                        {step === 1 
                            ? 'Enter the Student ID provided by your teacher.'
                            : `Welcome, ${pendingData?.studentName}! Create your account.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <p className="text-sm font-medium text-destructive mb-4">{error}</p>
                    )}

                    {step === 1 && (
                         <form onSubmit={handleIdVerification} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="student-id">Student ID</Label>
                                <Input
                                    id="student-id"
                                    placeholder="Enter your ID"
                                    required
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isVerifying}>
                                {isVerifying ? 'Verifying...' : 'Verify ID'}
                            </Button>
                         </form>
                    )}

                    {step === 2 && pendingData && (
                        <form onSubmit={handleCreateAccount} className="grid gap-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2 col-span-2">
                                    <Label>Student Name</Label>
                                    <Input
                                        value={pendingData.studentName}
                                        readOnly
                                        className="bg-secondary"
                                    />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label>Father's Name</Label>
                                    <Input
                                        value={pendingData.fatherName}
                                        readOnly
                                        className="bg-secondary"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Create Account
                            </Button>
                        </form>
                    )}
                    
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="underline">
                            Login
                        </Link>
                    </div>
                     <div className="mt-2 text-center text-sm">
                        Are you a teacher?{' '}
                        <Link href="/signup" className="underline">
                            Sign up here
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
