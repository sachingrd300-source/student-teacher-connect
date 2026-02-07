
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

interface UserProfile {
    name: string;
    email: string;
    mobileNumber?: string;
    fatherName?: string;
    class?: string;
    homeAddress?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

export default function BookHomeTeacherPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

    // Form state
    const [studentName, setStudentName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [subject, setSubject] = useState('');
    const [studentAddress, setStudentAddress] = useState('');
    const [tuitionType, setTuitionType] = useState<'single_student' | 'siblings'>('single_student');

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);
    
    useEffect(() => {
        if (userProfile) {
            setStudentName(userProfile.name || '');
            setFatherName(userProfile.fatherName || '');
            setMobileNumber(userProfile.mobileNumber || '');
            setStudentClass(userProfile.class || '');
            setStudentAddress(userProfile.homeAddress || '');
        }
    }, [userProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user) return;
        
        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            await addDoc(collection(firestore, 'homeBookings'), {
                studentId: user.uid,
                studentName: studentName.trim(),
                fatherName: fatherName.trim(),
                mobileNumber: mobileNumber.trim(),
                studentClass: studentClass.trim(),
                subject: subject.trim(),
                studentAddress: studentAddress.trim(),
                status: 'Pending',
                createdAt: new Date().toISOString(),
                bookingType: 'homeTutor',
                tuitionType: tuitionType,
            });
            setSubmitStatus({ type: 'success', message: 'Your request has been sent successfully! The admin will contact you soon.' });
            setTimeout(() => router.push('/dashboard/student'), 3000);
        } catch (error) {
            console.error("Error creating home booking:", error);
            setSubmitStatus({ type: 'error', message: 'Failed to send request. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Image src="/logo.png" alt="Achiever's Community Logo" width={80} height={80} className="animate-pulse rounded-full" />
                <p className="text-muted-foreground">Loading Booking Form...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
             <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Book a Home Teacher</CardTitle>
                    <CardDescription>Fill out the details below to request a personalized home teacher. Our team will review your request and assign a suitable teacher.</CardDescription>
                    <CardDescription className="!mt-4 text-info font-semibold border-l-4 border-info pl-4">
                        एक विशेष ऑफर उपलब्ध है! यदि आपके पास 10 से अधिक छात्र हैं, तो प्रति छात्र शुल्क ₹300 लगेगा।
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-6">
                       <div className="grid sm:grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="studentName">Student Name</Label>
                                <Input id="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="fatherName">Father's Name</Label>
                                <Input id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                            </div>
                       </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="studentClass">Class</Label>
                                <Input id="studentClass" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} placeholder="e.g., 10th Grade" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Mathematics" required />
                            </div>
                       </div>
                        <div className="grid gap-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="student-address">Full Address</Label>
                            <Textarea id="student-address" value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} placeholder="Enter your complete address for the teacher" required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tuition For</Label>
                            <RadioGroup value={tuitionType} onValueChange={(value) => setTuitionType(value as 'single_student' | 'siblings')} className="flex gap-4 pt-1">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single_student" id="single_student" />
                                    <Label htmlFor="single_student" className="font-normal">Only one student</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="siblings" id="siblings" />
                                    <Label htmlFor="siblings" className="font-normal">Brother/Sister</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4">
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Request
                         </Button>
                         {submitStatus.message && (
                            <p className={`text-sm font-medium ${
                                submitStatus.type === 'error' ? 'text-destructive' : 'text-green-600'
                            }`}>
                                {submitStatus.message}
                            </p>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
