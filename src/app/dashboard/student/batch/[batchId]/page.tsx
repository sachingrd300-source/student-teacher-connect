'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Download, ListCollapse, Wallet, CreditCard, ClipboardCheck, Brain, Notebook, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
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
    studentId: string;
    batchId: string;
    status: 'pending' | 'approved';
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

interface Test {
    id: string;
    title: string;
    subject: string;
    testDate: string;
    maxMarks: number;
}

interface TestResult {
    id: string;
    testId: string;
    marksObtained: number;
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
    const defaultTab = searchParams.get('tab') || 'announcements';

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
    
    const materialsRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'materials'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);
    
    const activityQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'activity'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId]);
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
    const isEnrolledAndApproved = !!enrollment;

    const feesQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'fees'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId)
        );
    }, [firestore, batchId, user?.uid]);
    const { data: feesData, isLoading: feesLoading } = useCollection<Fee>(feesQuery);

    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'tests'), orderBy('testDate', 'desc'));
    }, [firestore, batchId]);
    const { data: tests, isLoading: testsLoading } = useCollection<Test>(testsQuery);
    
    const testResultsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'testResults'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId)
        );
    }, [firestore, batchId, user?.uid]);
    const { data: testResults, isLoading: testResultsLoading } = useCollection<TestResult>(testResultsQuery);

    const resultsByTestId = useMemo(() => {
        const map = new Map<string, TestResult>();
        testResults?.forEach(result => map.set(result.testId, result));
        return map;
    }, [testResults]);


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
    const isSecurityLoading = isUserLoading || batchLoading || enrollmentLoading;
    useEffect(() => {
        if (!isSecurityLoading && (!batch || !isEnrolledAndApproved)) {
            router.replace('/dashboard/student');
        }
    }, [isSecurityLoading, batch, isEnrolledAndApproved, router]);
    
    const handlePayNow = () => {
        alert('Payment gateway integration is pending. Please contact your teacher to complete the payment.');
    };

    const isPageLoading = isUserLoading || batchLoading || materialsLoading || activitiesLoading || enrollmentLoading || feesLoading || testsLoading || testResultsLoading;

    if (isPageLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!batch || !isEnrolledAndApproved) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>Access Denied. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card className="mb-8 rounded-2xl shadow-lg">
                             <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-2xl font-serif">{batch?.name}</CardTitle>
                                        <CardDescription>Taught by <Link href={`/teachers/${batch?.teacherId}`} className="text-primary hover:underline">{batch?.teacherName}</Link></CardDescription>
                                    </div>
                                    <Button asChild>
                                        <Link href={`/dashboard/student/batch/${batchId}/study`}>
                                            <Brain className="mr-2 h-4 w-4" /> Go to Study Mode
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>

                         <Tabs defaultValue={defaultTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                                <TabsTrigger value="materials">Materials</TabsTrigger>
                                <TabsTrigger value="tests">Tests</TabsTrigger>
                                <TabsTrigger value="fees">Fees</TabsTrigger>
                            </TabsList>
                            
                             <TabsContent value="announcements" className="mt-6">
                                <Card className="rounded-2xl shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <ListCollapse className="mr-2 h-5 w-5 text-primary"/> Announcements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {activities && activities.length > 0 ? (
                                            <div className="grid gap-4">
                                                {activities.map(activity => (
                                                    <div key={activity.id} className="p-3 rounded-lg border bg-background">
                                                        <p className="font-medium">{activity.message}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <ListCollapse className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-semibold">No Announcements Yet</h3>
                                                <p className="text-muted-foreground mt-1">Your teacher hasn't posted any updates for this batch.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="materials" className="mt-6">
                                 <Card className="rounded-2xl shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <FileText className="mr-2 h-5 w-5 text-primary"/> Study Materials
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {materials && materials.length > 0 ? (
                                            <div className="grid gap-4">
                                                {materials.map(material => (
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
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-semibold">No Study Materials</h3>
                                                <p className="text-muted-foreground mt-1">Your teacher hasn't uploaded any materials yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="tests" className="mt-6">
                                <Card className="rounded-2xl shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <ClipboardCheck className="mr-2 h-5 w-5 text-primary"/> Test Results
                                        </CardTitle>
                                        <CardDescription>View your performance in all tests conducted in this batch.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {tests && tests.length > 0 ? (
                                            <div className="grid gap-4">
                                                {tests.map((test) => {
                                                    const result = resultsByTestId.get(test.id);
                                                    return (
                                                        <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                            <div>
                                                                <p className="font-semibold">{test.title}</p>
                                                                <p className="text-sm text-muted-foreground mt-1">{test.subject}</p>
                                                                <p className="text-xs text-muted-foreground mt-2">Date: {new Date(test.testDate).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                {result ? (
                                                                    <>
                                                                        <p className="text-xl font-bold text-primary">{result.marksObtained} <span className="text-sm font-normal text-muted-foreground">/ {test.maxMarks}</span></p>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">Not graded</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <Notebook className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-semibold">No Tests Conducted</h3>
                                                <p className="text-muted-foreground mt-1">No tests have been scheduled for this batch yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="fees" className="mt-6">
                                <Card className="rounded-2xl shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Wallet className="mr-2 h-5 w-5 text-primary"/> My Fee Status
                                        </CardTitle>
                                        <CardDescription>View your monthly fee payment history for this batch.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {allMonths.length > 0 ? (
                                            <div className="grid gap-4">
                                                {allMonths.reverse().map(({ month, year }) => {
                                                    const key = `${year}-${month}`;
                                                    const feeInfo = feeStatusByMonth.get(key);
                                                    const isPaid = feeInfo?.status === 'paid';
                                                    
                                                    return (
                                                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                            <div>
                                                                <p className="font-medium">
                                                                    {monthFormatter.format(new Date(year, month - 1))}
                                                                </p>
                                                                {isPaid && feeInfo?.paidOn ? (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Paid on: {new Date(feeInfo.paidOn).toLocaleDateString()}
                                                                    </p>
                                                                ) : null}
                                                            </div>

                                                            {isPaid ? (
                                                                <div className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                                    PAID
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-4">
                                                                    <div className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                                        DUE
                                                                    </div>
                                                                    <Button size="sm" variant="outline" onClick={handlePayNow}>
                                                                        <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-semibold">No Fee Information</h3>
                                                <p className="text-muted-foreground mt-1">Fee information will be available here once you are approved.</p>
                                            </div>
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
