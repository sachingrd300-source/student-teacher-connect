
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Download, ListCollapse, Wallet, CreditCard, ClipboardCheck, Brain, Notebook, BookOpen, BarChart3, Trophy, TrendingDown, ArrowRight, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PaymentDialog } from '@/components/payment-dialog';
import { cn } from '@/lib/utils';


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
    
    const [feeToPay, setFeeToPay] = useState<{ month: number, year: number } | null>(null);

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId]);
    const { data: batch, isLoading: isBatchLoading } = useDoc<Batch>(batchRef);

    const enrollmentQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !batchId) return null;
        return query(
            collection(firestore, 'enrollments'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId),
            where('status', '==', 'approved')
        );
    }, [firestore, user?.uid, batchId]);
    const { data: enrollments, isLoading: isEnrollmentLoading } = useCollection<Enrollment>(enrollmentQuery);

    const enrollment = useMemo(() => (enrollments && enrollments.length > 0 ? enrollments[0] : null), [enrollments]);

    const studyMaterialsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(
            collection(firestore, 'batches', batchId, 'materials'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, batchId]);
    const { data: studyMaterials, isLoading: isStudyMaterialsLoading } = useCollection<StudyMaterial>(studyMaterialsQuery);

    const activitiesQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(
            collection(firestore, 'batches', batchId, 'activity'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, batchId]);
    const { data: activities, isLoading: isActivitiesLoading } = useCollection<Activity>(activitiesQuery);

    const feesQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        return query(
            collection(firestore, 'fees'),
            where('studentId', '==', user.uid),
            where('batchId', '==', batchId)
        );
    }, [firestore, batchId, user?.uid]);
    const { data: feesData, isLoading: isFeesLoading } = useCollection<Fee>(feesQuery);

    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'tests'), orderBy('testDate', 'desc'));
    }, [firestore, batchId]);
    const { data: tests, isLoading: isTestsLoading } = useCollection<Test>(testsQuery);

    const testResultsQuery = useMemoFirebase(() => {
        if (!firestore || !batchId || !user?.uid) return null;
        const testIds = (tests && tests.length > 0) ? tests.map(t => t.id) : [];
        if (testIds.length === 0) return null; // No need to query if there are no tests
        return query(
            collection(firestore, 'testResults'),
            where('studentId', '==', user.uid),
            where('testId', 'in', testIds)
        );
    }, [firestore, batchId, user?.uid, tests]);
    const { data: testResults, isLoading: isTestResultsLoading } = useCollection<TestResult>(testResultsQuery);
    

    const performanceData = useMemo(() => {
        if (!tests || tests.length === 0 || !testResults || testResults.length === 0) {
            return null;
        }

        const testMap = new Map(tests.map(t => [t.id, t]));
        
        const resultsWithPercentage = testResults.map(result => {
            const test = testMap.get(result.testId);
            if (!test || test.maxMarks <= 0) return null;
            return {
                ...result,
                testTitle: test.title,
                testDate: test.testDate,
                maxMarks: test.maxMarks,
                percentage: (result.marksObtained / test.maxMarks) * 100,
            };
        }).filter(Boolean) as (TestResult & { testTitle: string, testDate: string, maxMarks: number, percentage: number })[];

        if (resultsWithPercentage.length === 0) return null;

        const totalPercentage = resultsWithPercentage.reduce((sum, r) => sum + r.percentage, 0);
        const averageScore = totalPercentage / resultsWithPercentage.length;

        const highestScoreTest = [...resultsWithPercentage].sort((a, b) => b.percentage - a.percentage)[0];
        const lowestScoreTest = [...resultsWithPercentage].sort((a, b) => a.percentage - b.percentage)[0];

        const chartData = resultsWithPercentage.map(r => ({
            name: r.testTitle,
            'Score (%)': parseFloat(r.percentage.toFixed(2)),
            'Your Marks': r.marksObtained,
            'Max Marks': r.maxMarks,
        })).reverse();

        return {
            averageScore,
            highestScoreTest,
            lowestScoreTest,
            chartData,
            resultsTable: resultsWithPercentage.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()),
        };

    }, [tests, testResults]);

    const allFeeMonths = useMemo(() => {
        if (!enrollment?.approvedAt) return [];
        const startDate = new Date(enrollment.approvedAt);
        const endDate = new Date();
        return getMonthsInRange(startDate, endDate);
    }, [enrollment?.approvedAt]);

    const feeStatusByMonth = useMemo(() => {
        const statusMap = new Map<string, { status: 'paid' | 'unpaid', paidOn?: string }>();
        feesData?.forEach(fee => {
            const key = `${fee.feeYear}-${fee.feeMonth}`;
            statusMap.set(key, { status: fee.status, paidOn: fee.paidOn });
        });
        return statusMap;
    }, [feesData]);


    const isLoading = isUserLoading || isProfileLoading || isBatchLoading || isEnrollmentLoading || isStudyMaterialsLoading || isActivitiesLoading || isFeesLoading || isTestsLoading || isTestResultsLoading;

    // The check for enrollment status
    const isEnrolledAndApproved = useMemo(() => enrollments?.length > 0, [enrollments]);

    // This effect is ONLY for auth check, not for content logic.
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Brain className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Batch Details...</p>
            </div>
        );
    }
    
    // After loading, check if user is approved.
    if (!isEnrolledAndApproved) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4 text-center p-4">
                 <XCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground max-w-sm">You are not enrolled in this batch or your request is still pending. If you believe this is an error, please contact your teacher.</p>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/student">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Link>
                </Button>
            </div>
        );
    }

    if (!currentUserProfile || !batch) {
         // This is a fallback, should ideally not be hit if logic is correct
         return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Brain className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Finalizing details...</p>
            </div>
        );
    }

    const getTestResult = (testId: string) => {
        if (!testResults) return 'N/A';
        const result = testResults.find(res => res.testId === testId);
        return result ? result.marksObtained : 'N/A';
    };
    
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-5xl mx-auto grid gap-8">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/student">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold font-serif">{batch?.name}</h1>
                            <p className="text-muted-foreground mt-2">Welcome to your batch page. Here you can access study materials, announcements, fee details, and test results.</p>
                        </div>
                        <Button asChild size="lg" className="w-full sm:w-auto">
                           <Link href={`/dashboard/student/batch/${batchId}/study`}>
                                <Brain className="mr-2 h-5 w-5"/> Start Study Session
                            </Link>
                        </Button>
                    </div>

                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                            <TabsTrigger value="announcements">Announcements</TabsTrigger>
                            <TabsTrigger value="study-materials">Study Materials</TabsTrigger>
                            <TabsTrigger value="fees">Fees</TabsTrigger>
                            <TabsTrigger value="tests">Tests</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                        </TabsList>
                        <TabsContent value="announcements" className="mt-4">
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center"><ListCollapse className="mr-3 h-5 w-5 text-primary"/> Latest Announcements</CardTitle>
                                    <CardDescription>Stay up-to-date with important batch announcements.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {activities && activities.length > 0 ? (
                                        <div className="grid gap-4">
                                            {activities.map(activity => (
                                                <div key={activity.id} className="p-4 rounded-lg border bg-background transition-colors hover:bg-accent">
                                                    <p className="text-sm text-muted-foreground">{activity.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">Posted: {formatDate(activity.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <ListCollapse className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Announcements Yet</h3>
                                            <p className="text-muted-foreground mt-1">Check back later for updates from your teacher.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="study-materials" className="mt-4">
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center"><FileText className="mr-3 h-5 w-5 text-primary"/> Study Materials</CardTitle>
                                    <CardDescription>Access all the materials uploaded by your teacher.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {studyMaterials && studyMaterials.length > 0 ? (
                                        <div className="grid gap-4">
                                            {studyMaterials.map(material => (
                                                <div key={material.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-background transition-colors hover:bg-accent">
                                                    <div className="flex items-center gap-4">
                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-semibold">{material.title}</p>
                                                            <p className="text-sm text-muted-foreground">{material.description}</p>
                                                        </div>
                                                    </div>
                                                    <a href={material.fileURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                                                        View
                                                        {material.fileType === 'link' ? <ArrowRight className="ml-2 h-4 w-4" /> : <Download className="ml-2 h-4 w-4" />}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Study Materials Yet</h3>
                                            <p className="text-muted-foreground mt-1">Your teacher will upload materials here soon.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="fees" className="mt-4">
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center"><Wallet className="mr-3 h-5 w-5 text-primary"/> Fee History</CardTitle>
                                    <CardDescription>Your complete fee payment history for this batch.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {allFeeMonths.length > 0 ? (
                                        <div className="grid gap-4">
                                            {allFeeMonths.slice().reverse().map(({ month, year }) => {
                                                const key = `${year}-${month}`;
                                                const feeInfo = feeStatusByMonth.get(key);
                                                const status = feeInfo?.status || 'unpaid';
                                                const paidOn = feeInfo?.paidOn;

                                                return (
                                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-background transition-colors hover:bg-accent">
                                                        <div>
                                                            <p className="font-semibold">{monthFormatter.format(new Date(year, month - 1))} {year}</p>
                                                            <p className="text-sm text-muted-foreground">Status: <span className={status === 'paid' ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>{status}</span></p>
                                                            {status === 'paid' && paidOn && (
                                                                <p className="text-xs text-muted-foreground">Paid On: {new Date(paidOn).toLocaleDateString()}</p>
                                                            )}
                                                        </div>
                                                        {status === 'unpaid' && (
                                                            <Button variant="outline" className="self-end sm:self-center" onClick={() => setFeeToPay({ month, year })}>
                                                                Pay Now <CreditCard className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Fee Records Found</h3>
                                            <p className="text-muted-foreground mt-1">Your fee payment history will appear here once you are approved.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="tests" className="mt-4">
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center"><ClipboardCheck className="mr-3 h-5 w-5 text-primary"/> Tests &amp; Results</CardTitle>
                                    <CardDescription>View your test schedule and past results.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {tests && tests.length > 0 ? (
                                        <div className="grid gap-4">
                                            {tests.map(test => (
                                                <div key={test.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-background transition-colors hover:bg-accent">
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{test.title} ({test.subject})</p>
                                                        <p className="text-sm text-muted-foreground">Date: {new Date(test.testDate).toLocaleDateString()}</p>
                                                        <p className="text-sm text-muted-foreground">Max Marks: {test.maxMarks}</p>
                                                    </div>
                                                    <div className="font-semibold text-lg self-end sm:self-center">
                                                         Marks: {getTestResult(test.id)} / {test.maxMarks}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Tests Available</h3>
                                            <p className="text-muted-foreground mt-1">Check back later for upcoming tests and results.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="performance" className="mt-4">
                            {performanceData ? (
                                <div className="grid gap-6">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{performanceData.averageScore.toFixed(1)}%</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{performanceData.highestScoreTest.percentage.toFixed(1)}%</div>
                                                <p className="text-xs text-muted-foreground">in {performanceData.highestScoreTest.testTitle}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Area for Improvement</CardTitle>
                                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{performanceData.lowestScoreTest.percentage.toFixed(1)}%</div>
                                                <p className="text-xs text-muted-foreground">in {performanceData.lowestScoreTest.testTitle}</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Performance Over Time</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                           <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                Charts are temporarily unavailable.
                                           </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="text-center py-16 flex flex-col items-center">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold">No Performance Data Yet</h3>
                                    <p className="text-muted-foreground mt-1">Your performance analytics will appear here once your test results are uploaded.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            
            {feeToPay && user && batch && currentUserProfile && (
                 <PaymentDialog 
                    isOpen={!!feeToPay}
                    onClose={() => setFeeToPay(null)}
                    studentId={user.uid}
                    studentName={currentUserProfile.name}
                    teacherId={batch.teacherId}
                    batchId={batchId}
                    batchName={batch.name}
                    feeDetails={feeToPay}
                    onPaymentSuccess={() => {
                        // The real-time listener will auto-update the UI.
                    }}
                />
            )}
        </div>
    );
}

    