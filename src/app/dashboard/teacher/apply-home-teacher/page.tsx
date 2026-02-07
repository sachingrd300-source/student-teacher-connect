'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, addDoc, collection, query, where, limit, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    whatsappNumber?: string;
    subject?: string;
    homeAddress?: string;
    bio?: string;
}

interface HomeTutorApplication {
    id: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const formatDate = (dateString?: string, withTime: boolean = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    if (withTime) {
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = true;
    }
    return new Intl.DateTimeFormat('en-IN', options).format(date);
};

export default function ApplyHomeTeacherPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [subject, setSubject] = useState('');
    const [houseAddress, setHouseAddress] = useState('');
    const [bio, setBio] = useState('');

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const applicationQuery = useMemoFirebase(() => 
        (firestore && user) ? query(collection(firestore, 'homeTutorApplications'), where('teacherId', '==', user.uid), limit(1)) : null,
    [firestore, user]);
    const { data: applications, isLoading: applicationLoading } = useCollection<HomeTutorApplication>(applicationQuery);
    const existingApplication = applications?.[0];
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        } else if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router, userProfile]);

    useEffect(() => {
        if (userProfile) {
            setWhatsappNumber(userProfile.whatsappNumber || '');
            setSubject(userProfile.subject || '');
            setHouseAddress(userProfile.homeAddress || '');
            setBio(userProfile.bio || '');
        }
    }, [userProfile]);

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile || !userProfileRef || existingApplication) return;
        
        setIsSubmitting(true);
        
        const profileUpdateData = {
            whatsappNumber: whatsappNumber.trim(),
            subject: subject.trim(),
            homeAddress: houseAddress.trim(),
            bio: bio.trim(),
        };

        try {
            // First, update the teacher's profile with the new details
            await updateDoc(userProfileRef, profileUpdateData);

            // Then, create the application document
            const applicationData = {
                teacherId: user.uid,
                teacherName: userProfile.name,
                status: 'pending' as const,
                createdAt: new Date().toISOString(),
            };
            await addDoc(collection(firestore, 'homeTutorApplications'), applicationData);
        } catch (error) {
            console.error("Error submitting application:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                operation: 'update',
                path: userProfileRef.path,
                requestResourceData: profileUpdateData
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading || applicationLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Image src="/logo.png" alt="Achiever's Community Logo" width={80} height={80} className="animate-pulse rounded-full" />
                <p className="text-muted-foreground">Loading Application...</p>
            </div>
        );
    }
    
    const renderStatusCard = () => {
        if (!existingApplication) {
            return (
                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle>Apply to be a Home Teacher</CardTitle>
                        <CardDescription>Please fill out your details below. Your address is used for verification and will not be public. Other details will be on your profile.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmitApplication}>
                        <CardContent className="grid gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="subject">Subject(s)</Label>
                                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Physics, Mathematics" required />
                                <CardDescription className="text-xs">The main subjects you teach.</CardDescription>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                                <Input id="whatsapp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g., +91..." required />
                                <CardDescription className="text-xs">Your contact number for students.</CardDescription>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">House Address</Label>
                                <Textarea id="address" value={houseAddress} onChange={(e) => setHouseAddress(e.target.value)} placeholder="Your full house address for verification" required />
                                <CardDescription className="text-xs">This address is used for verification and will not be shared publicly.</CardDescription>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students a little about your teaching style." required />
                                <CardDescription className="text-xs">A short introduction about yourself.</CardDescription>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Submit Application
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            );
        }

        let statusIcon, statusText, statusDescription;
        switch (existingApplication.status) {
            case 'approved':
                statusIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
                statusText = "Application Approved!";
                statusDescription = "Congratulations! You are now listed as a verified home teacher.";
                break;
            case 'rejected':
                statusIcon = <XCircle className="h-16 w-16 text-destructive" />;
                statusText = "Application Rejected";
                statusDescription = "We're sorry, but your application was not approved at this time. Please contact support for more details.";
                break;
            default: // pending
                statusIcon = <Clock className="h-16 w-16 text-yellow-500" />;
                statusText = "Application Pending";
                statusDescription = "Your application has been submitted and is currently under review. We'll notify you once a decision has been made.";
                break;
        }

        return (
            <Card className="rounded-2xl shadow-lg">
                <CardHeader className="items-center text-center">
                    {statusIcon}
                    <CardTitle className="text-2xl mt-4">{statusText}</CardTitle>
                    <CardDescription className="max-w-md mx-auto">{statusDescription}</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    Applied on {formatDate(existingApplication.createdAt, true)}
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => router.push('/dashboard/teacher/coaching')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {renderStatusCard()}
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
