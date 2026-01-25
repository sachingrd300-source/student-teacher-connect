
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, Eye } from 'lucide-react';

interface Test {
    id: string;
    title: string;
    subject: string;
    createdAt: Timestamp;
}

interface TestResult {
    id: string;
    testId: string;
    studentName: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
}

export default function TeacherResultsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [viewingResultsForTest, setViewingResultsForTest] = useState<Test | null>(null);

    // 1. Fetch all tests created by the teacher
    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'tests'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: tests, isLoading: testsLoading } = useCollection<Test>(testsQuery);

    // 2. Fetch all test results submitted to this teacher
    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'testResults'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: results, isLoading: resultsLoading } = useCollection<TestResult>(resultsQuery);

    // 3. Group results by testId for easy lookup
    const resultsByTest = useMemo(() => {
        if (!results) return new Map<string, TestResult[]>();
        return results.reduce((acc, result) => {
            if (!acc.has(result.testId)) {
                acc.set(result.testId, []);
            }
            acc.get(result.testId)!.push(result);
            return acc;
        }, new Map<string, TestResult[]>());
    }, [results]);

    const sortedResults = viewingResultsForTest ? [...(resultsByTest.get(viewingResultsForTest.id) || [])].sort((a, b) => b.marksObtained - a.marksObtained) : [];

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <ClipboardCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Test Results</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Submissions</CardTitle>
                            <CardDescription>View the results for the tests you have created.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(testsLoading || resultsLoading) && <p>Loading test data...</p>}
                            {tests && tests.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {tests.map(test => {
                                        const submissions = resultsByTest.get(test.id) || [];
                                        return (
                                            <Card key={test.id} className="flex flex-col">
                                                <CardHeader className="flex-1">
                                                    <CardTitle className="text-lg">{test.title}</CardTitle>
                                                    <CardDescription>{test.subject}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-1">
                                                    <div className="text-sm font-semibold p-3 bg-muted rounded-md text-center">
                                                        {submissions.length} Student(s) Submitted
                                                    </div>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button 
                                                        className="w-full" 
                                                        variant="outline"
                                                        onClick={() => setViewingResultsForTest(test)} 
                                                        disabled={submissions.length === 0}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" /> View Results
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                !testsLoading && <p className="text-center text-muted-foreground py-8">No tests found. Create a test using the AI Test Generator.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {viewingResultsForTest && (
                <Dialog open={!!viewingResultsForTest} onOpenChange={(isOpen) => !isOpen && setViewingResultsForTest(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Results for: {viewingResultsForTest.title}</DialogTitle>
                            <DialogDescription>
                                Showing results for all students who completed this test.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 max-h-[60vh] overflow-y-auto">
                            <div className="border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="text-left bg-muted">
                                        <tr className="border-b">
                                            <th className="p-3 font-medium">Student Name</th>
                                            <th className="p-3 font-medium text-center">Score</th>
                                            <th className="p-3 font-medium text-center">Percentage</th>
                                            <th className="p-3 font-medium">Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedResults.map(result => (
                                            <tr key={result.id} className="border-b last:border-0">
                                                <td className="p-3 font-semibold">{result.studentName}</td>
                                                <td className="p-3 text-center">{result.marksObtained} / {result.totalMarks}</td>
                                                <td className="p-3 text-center font-bold">{Math.round((result.marksObtained / result.totalMarks) * 100)}%</td>
                                                <td className="p-3 text-xs">{result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => setViewingResultsForTest(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
