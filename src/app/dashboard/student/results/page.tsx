'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AnswerDetail {
    questionText: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
}

interface TestResult {
    id: string;
    testId: string;
    testTitle: string;
    testSubject: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
    answers: AnswerDetail[];
}


export default function StudentResultsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc<{name: string, role: 'student' | 'tutor'}>(userProfileRef);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'testResults'), where('studentId', '==', user.uid));
    }, [firestore, user]);

    const { data: results, isLoading } = useCollection<TestResult>(resultsQuery);
    
    const sortedResults = useMemo(() => {
        if (!results) return [];
        return results.sort((a,b) => b.submittedAt.seconds - a.submittedAt.seconds);
    }, [results]);

    const [viewingResult, setViewingResult] = useState<TestResult | null>(null);

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <ClipboardCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">My Test Results</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Submission History</CardTitle>
                            <CardDescription>Here are all the tests you have completed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading && <p className="text-center py-8">Loading your results...</p>}
                             {!isLoading && sortedResults && sortedResults.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {sortedResults.map(result => (
                                        <Card key={result.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle className="text-lg">{result.testTitle}</CardTitle>
                                                <CardDescription>{result.testSubject}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 text-sm space-y-2">
                                                 <div className="w-full text-center p-3 rounded-md bg-muted font-semibold">
                                                    Score: <span className="text-xl font-bold text-primary">{result.marksObtained}</span> / {result.totalMarks}
                                                </div>
                                                <p className="text-xs text-muted-foreground pt-2">
                                                    Submitted: {result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
                                                </p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full" variant="outline" onClick={() => setViewingResult(result)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                             ) : (
                                 !isLoading && <p className="text-center text-muted-foreground py-8">You have not submitted any tests yet.</p>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Test Review Dialog */}
            {viewingResult && (
                <Dialog open={!!viewingResult} onOpenChange={(isOpen) => { if (!isOpen) setViewingResult(null) }}>
                    <DialogContent className="max-w-3xl">
                         <DialogHeader>
                            <DialogTitle>Test Review: {viewingResult.testTitle}</DialogTitle>
                            <DialogDescription>
                                Here is a breakdown of your answers. Correct answers are marked in green.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-4 p-4 rounded-lg bg-muted text-center">
                            <p className="text-lg font-medium">Final Score</p>
                            <p className="text-4xl font-bold text-primary">{viewingResult.marksObtained} <span className="text-2xl text-muted-foreground">/ {viewingResult.totalMarks}</span></p>
                        </div>

                        <div className="space-y-6 py-4 max-h-[50vh] overflow-y-auto pr-4">
                            {viewingResult.answers.map((ans, index) => (
                                <div key={index} className="border-b pb-4 last:border-b-0">
                                    <p className="font-semibold mb-3">Q{index + 1}: {ans.questionText}</p>
                                    <div className="space-y-2 text-sm">
                                        {ans.options.map((opt, i) => {
                                            const isCorrect = opt === ans.correctAnswer;
                                            const isSelected = opt === ans.selectedAnswer;
                                            
                                            let indicator = <div className="h-4 w-4" />;
                                            if (isCorrect) {
                                                indicator = <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />;
                                            } else if (isSelected) {
                                                indicator = <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
                                            }

                                            return (
                                                <div key={i} className={`flex items-center gap-2 p-2 rounded-md ${
                                                    isCorrect ? 'bg-success/10 font-semibold' : 
                                                    isSelected ? 'bg-destructive/10' : 'bg-muted/50'
                                                }`}>
                                                    {indicator}
                                                    <span>{opt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {ans.selectedAnswer !== ans.correctAnswer && (
                                        <div className="mt-2 text-xs p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                                            <span className="font-semibold">Your Answer: </span> {ans.selectedAnswer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => setViewingResult(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}
