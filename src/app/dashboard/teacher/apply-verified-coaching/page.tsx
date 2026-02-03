
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, addDoc, collection, query, where, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
}

interface CommunityAssociateApplication {
    id: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function ApplyCommunityAssociatePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const applicationQuery = useMemoFirebase(() => 
        (firestore && user) ? query(collection(firestore, 'verifiedCoachingApplications'), where('teacherId', '==', user.uid), limit(1)) : null,
    [firestore, user]);
    const { data: applications, isLoading: applicationLoading } = useCollection<CommunityAssociateApplication>(applicationQuery);
    const existingApplication = applications?.[0];
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        } else if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router, userProfile]);

    const handleSubmitApplication = async () => {
        if (!firestore || !user || !userProfile || existingApplication) return;
        
        setIsSubmitting(true);
        const applicationData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
        };
        try {
            await addDoc(collection(firestore, 'verifiedCoachingApplications'), applicationData);
        } catch (error) {
            console.error("Error submitting application:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                operation: 'create',
                path: 'verifiedCoachingApplications',
                requestResourceData: applicationData,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading || applicationLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Award className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Application...</p>
            </div>
        );
    }
    
    const renderStatusCard = () => {
        if (!existingApplication) {
            return (
                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle>Apply to be an Achievers Community Associate</CardTitle>
                        <CardDescription>Get a verified badge on your profile and join our community of educators. Submit your application for review by our admin team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSubmitApplication} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Application
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        let statusIcon, statusText, statusDescription;
        switch (existingApplication.status) {
            case 'approved':
                statusIcon = <CheckCircle className="h-16 w-16 text-green-500" />;
                statusText = "Application Approved!";
                statusDescription = "Congratulations! You are now a verified community associate.";
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
                    Applied on {formatDate(existingApplication.createdAt)}
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

    
