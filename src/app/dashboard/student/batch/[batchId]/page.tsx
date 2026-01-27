'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Download, ListCollapse, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

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

interface Enrollment {
    id: string;
    approvedAt?: string;
}

interface StudyMaterial {
    id: string;
    title: string;
    description?: string;
    fileURL: string;
    fileType: string;
    createdAt: string;
}

interface Activity {
    id: string;
    message: string;
    createdAt: string;
}

interface Fee {
    id: string;
    feeMonth: number;
    feeYear: number;
    status: 'paid' | 'unpaid';
    paidOn?: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const getMonthsInRange = (startDate: Date, endDate: Date) => {
    const months = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
        months.push({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
};


export default function StudentBatchPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const batchId = params.batchId as string;
    const defaultTab = searchParams.get('tab') || 'activity';

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId, user]);
    const { data: batch, isLoading: batchLoading } = useDoc<Batch>(batchRef);
    
    const materialsRef = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return collection(firestore, 'batches', batchId, 'materials');
    }, [firestore, batchId, user]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);
    
    const activityQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user) return null;
        return query(collection(firestore, 'batches', batchId, 'activity'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId, user]);
    const { data: activities, isLoading: activitiesLoading } = useCollection<Activity>(activityQuery);

    const enrollmentQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId),
            where('status', '==', 'approved')
        );
    }, [firestore, batchId, user?.uid]);
    const { data: enrollments, isLoading: enrollmentLoading } = useCollection<Enrollment>(enrollmentQuery);
    const enrollment = enrollments?.[0];

    const feesQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'fees'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId)
        );
    }, [firestore, batchId, user?.uid]);
    const { data: feesData, isLoading: feesLoading } = useCollection<Fee>(feesQuery);

    const feeStatusByMonth = useMemo(() => {
        const statusMap = new Map<string, { status: 'paid' | 'unpaid', paidOn?: string }>();
        feesData?.forEach(fee => {
            const key = `${fee.feeYear}-${fee.feeMonth}`;
            statusMap.set(key, { status: fee.status, paidOn: fee.paidOn });
        });
        return statusMap;
    }, [feesData]);

    const allMonths = useMemo(() => {
        if (!enrollment?.approvedAt) return [];
        const startDate = new Date(enrollment.approvedAt);
        const endDate = new Date(); // today
        return getMonthsInRange(startDate, endDate);
    }, [enrollment?.approvedAt]);

    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });


    // Security check
    const isEnrolled = batch?.approvedStudents?.includes(user?.uid ?? '');
    const isLoading = isUserLoading || batchLoading || materialsLoading || activitiesLoading || enrollmentLoading || feesLoading;

    useEffect(() => {
        // If done loading and not enrolled, or no batch found, redirect
        if (!isLoading && (!batch || !isEnrolled)) {
            router.replace('/dashboard/student');
        }
    }, [isLoading, batch, isEnrolled, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // If done loading and not enrolled, or no batch found, show redirecting message
    if (!batch || !isEnrolled) {
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
                        <Card className="mb-8">
                             <CardHeader>
                                <CardTitle className="text-2xl font-serif">{batch?.name}</CardTitle>
                                <CardDescription>Taught by <Link href={`/teachers/${batch?.teacherId}`} className="text-primary hover:underline">{batch?.teacherName}</Link></CardDescription>
                            </CardHeader>
                        </Card>

                         <Tabs defaultValue={defaultTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="activity">Recent Activity ({activities?.length || 0})</TabsTrigger>
                                <TabsTrigger value="materials">Study Materials ({materials?.length || 0})</TabsTrigger>
                                <TabsTrigger value="fees">Fee Status</TabsTrigger>
                            </TabsList>
                            
                             <TabsContent value="activity" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <ListCollapse className="mr-2 h-5 w-5 text-primary"/> Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {activities && activities.length > 0 ? (
                                            activities.map(activity => (
                                                <div key={activity.id} className="p-3 rounded-lg border bg-background">
                                                    <p className="font-medium">{activity.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">The teacher has not posted any updates for this batch yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="materials" className="mt-6">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <FileText className="mr-2 h-5 w-5 text-primary"/> Study Materials
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {materials && materials.length > 0 ? (
                                            materials.map(material => (
                                                <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                    <div>
                                                        <p className="font-semibold">{material.title}</p>
                                                         <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-2">Uploaded: {formatDate(material.createdAt)}</p>
                                                    </div>
                                                    <Button asChild size="sm">
                                                        <a href={material.fileURL} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" /> Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">The teacher has not uploaded any study materials yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="fees" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Wallet className="mr-2 h-5 w-5 text-primary"/> My Fee Status
                                        </CardTitle>
                                        <CardDescription>View your monthly fee payment history for this batch.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {allMonths.length > 0 ? (
                                            allMonths.reverse().map(({ month, year }) => {
                                                const key = `${year}-${month}`;
                                                const feeInfo = feeStatusByMonth.get(key);
                                                const isPaid = feeInfo?.status === 'paid';
                                                
                                                return (
                                                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                        <p className="font-medium">
                                                            {monthFormatter.format(new Date(year, month - 1))}
                                                        </p>
                                                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${isPaid ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                            {isPaid ? 'PAID' : 'DUE'}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">Fee information will be available here once you are approved for the batch.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
