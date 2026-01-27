'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    name: string;
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    approvedStudents: string[];
}

export default function StudentBatchPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const batchId = params.batchId as string;

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId]);
    const { data: batch, isLoading: batchLoading } = useDoc<Batch>(batchRef);

    // Security check
    const isEnrolled = batch?.approvedStudents?.includes(user?.uid ?? '');
    const isLoading = isUserLoading || batchLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // If done loading and not enrolled, or no batch found, redirect
    if (!isLoading && (!batch || !isEnrolled)) {
        router.replace('/dashboard/student');
        return (
             <div className="flex h-screen items-center justify-center">
                <p>Access Denied. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={currentUserProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-2xl font-serif">{batch?.name}</CardTitle>
                                <CardDescription>Taught by <Link href={`/teachers/${batch?.teacherId}`} className="text-primary hover:underline">{batch?.teacherName}</Link></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Study materials and class schedules will appear here soon.</p>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Placeholder for Study Materials and Classes */}
                </div>
            </main>
        </div>
    );
}
