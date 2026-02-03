
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
import { Loader2, Send, School } from 'lucide-react';

interface UserProfile {
    name: string;
    email: string;
    mobileNumber?: string;
    fatherName?: string;
    class?: string;
    address?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

export default function BookCoachingSeatPage() {
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
    const [address, setAddress] = useState('');

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (userProfile) {
            setStudentName(userProfile.name || '');
            setFatherName(userProfile.fatherName || '');
            setMobileNumber(userProfile.mobileNumber || '');
            setStudentClass(userProfile.class || '');
            setAddress(userProfile.address || '');
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
                address: address.trim(),
                status: 'Pending',
                createdAt: new Date().toISOString(),
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
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Booking Form...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto">
             <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Book a Coaching Center Seat</CardTitle>
                    <CardDescription>Fill out the details below to request a seat at one of our partner coaching centers. Our team will review your request and assign you to a suitable local center.</CardDescription>
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
                                <Label htmlFor="mobileNumber">Mobile Number</Label>
                                <Input id="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="studentClass">Class</Label>
                                <Input id="studentClass" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} placeholder="e.g., 10th Grade" required />
                            </div>
                       </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Full Address</Label>
                            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your complete address to help us find the nearest center" required />
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
