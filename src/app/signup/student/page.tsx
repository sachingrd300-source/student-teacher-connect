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
import { School } from 'lucide-react';

interface PendingStudentData {
    studentName: string;
    fatherName: string;
    mobileNumber: string;
    address: string;
    teacherId: string;
    teacherName: string;
    classId: string;
    classTitle: string;
    classSubject: string; 
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
                const data = docSnap.data() as PendingStudentData;
                // Fetch class subject for better description
                const classRef = doc(firestore, 'classes', data.classId);
                const classSnap = await getDoc(classRef);
                if (classSnap.exists()) {
                    data.classSubject = classSnap.data().subject;
                }
                setPendingData(data);
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
        if (!email || !password || !pendingData || !firestore || !auth) {
            setError('Please fill out all fields and ensure services are available.');
            return;
        }

        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

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

            const enrollmentData = {
                studentId: user.uid,
                studentName: pendingData.studentName,
                mobileNumber: pendingData.mobileNumber,
                classId: pendingData.classId,
                teacherId: pendingData.teacherId,
                classTitle: pendingData.classTitle,
                teacherName: pendingData.teacherName,
                status: 'approved',
                createdAt: serverTimestamp(),
            };
            const enrollmentsColRef = collection(firestore, 'enrollments');
            addDocumentNonBlocking(enrollmentsColRef, enrollmentData);
            
            const pendingStudentRef = doc(firestore, 'pendingStudents', studentId.trim());
            await deleteDoc(pendingStudentRef);

            router.push('/dashboard');

        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
          <div className="w-full max-w-sm p-8 space-y-4">
            <div className="text-center">
                <School className="w-12 h-12 mx-auto text-primary" />
                <h1 className="text-3xl font-bold font-serif text-foreground mt-2">EduConnect Pro</h1>
                <p className="text-muted-foreground">
                  {step === 1 ? "Let's get you signed up for class." : "Final step! Create your account."}
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-serif">Student Signup</CardTitle>
                    <CardDescription>
                        {step === 1 
                            ? 'Enter the unique Student ID provided by your teacher.'
                            : `Welcome, ${pendingData?.studentName}! Let's create your account.`}
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
                             <div className="p-3 mb-4 rounded-md border bg-muted">
                                <h4 className="text-sm font-semibold">Registration Details</h4>
                                <p className="text-sm text-muted-foreground">
                                    You are registering for <span className="font-medium text-foreground">{pendingData.classTitle}</span> with <span className="font-medium text-foreground">{pendingData.teacherName}</span>.
                                </p>
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
                                Create Account & Join Class
                            </Button>
                        </form>
                    )}
                    
                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="underline">
                            Already have an account? Login
                        </Link>
                    </div>
                     <div className="mt-2 text-center text-sm">
                        <Link href="/signup" className="underline">
                            Are you a teacher? Sign up here
                        </Link>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
    );
}
