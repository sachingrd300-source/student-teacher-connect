
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, Eye, BarChart2, Check, X, Star, TrendingDown, TrendingUp, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Test {
    id: string;
    title: string;
    subject: string;
    questions: { questionText: string }[];
    createdAt: Timestamp;
}

interface AnswerDetail {
    questionText: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
}

interface TestResult {
    id: string;
    testId: string;
    studentName: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
    answers: AnswerDetail[];
}

interface QuestionStat {
    questionText: string;
    correct: number;
    incorrect: number;
    total: number;
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
    const [viewingAnalyticsForTest, setViewingAnalyticsForTest] = useState<Test | null>(null);
    const [viewingSubmission, setViewingSubmission] = useState<TestResult | null>(null);

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

    const testAnalytics = useMemo(() => {
        if (!viewingAnalyticsForTest) return null;
        const testResults = resultsByTest.get(viewingAnalyticsForTest.id) || [];
        if (testResults.length === 0) return null;

        const totalMarks = testResults[0].totalMarks;
        let totalScore = 0;
        let highestScore = 0;
        let lowestScore = totalMarks;

        const questionStats: QuestionStat[] = viewingAnalyticsForTest.questions.map(q => ({
            questionText: q.questionText,
            correct: 0,
            incorrect: 0,
            total: 0,
        }));

        for (const result of testResults) {
            totalScore += result.marksObtained;
            if (result.marksObtained > highestScore) highestScore = result.marksObtained;
            if (result.marksObtained < lowestScore) lowestScore = result.marksObtained;

            result.answers.forEach((answer, index) => {
                if (questionStats[index]) {
                    if (answer.selectedAnswer === answer.correctAnswer) {
                        questionStats[index].correct += 1;
                    } else {
                        questionStats[index].incorrect += 1;
                    }
                    questionStats[index].total += 1;
                }
            });
        }
        
        const averageScore = Math.round(totalScore / testResults.length);
        const averagePercentage = Math.round((averageScore / totalMarks) * 100);

        return {
            averageScore,
            averagePercentage,
            highestScore,
            lowestScore,
            totalSubmissions: testResults.length,
            totalMarks,
            questionStats,
        };

    }, [viewingAnalyticsForTest, resultsByTest]);


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
                            <CardDescription>View the results and performance analytics for the tests you have created.</CardDescription>
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
                                                <CardFooter className="flex-col items-stretch gap-2">
                                                    <Button 
                                                        className="w-full" 
                                                        variant="outline"
                                                        onClick={() => setViewingResultsForTest(test)} 
                                                        disabled={submissions.length === 0}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" /> View Scores
                                                    </Button>
                                                     <Button 
                                                        className="w-full" 
                                                        onClick={() => setViewingAnalyticsForTest(test)} 
                                                        disabled={submissions.length === 0}
                                                    >
                                                        <BarChart2 className="h-4 w-4 mr-2" /> View Analytics
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
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Scores for: {viewingResultsForTest.title}</DialogTitle>
                            <DialogDescription>
                                Showing scores for all students who completed this test, sorted from highest to lowest.
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
                                            <th className="p-3 font-medium hidden sm:table-cell">Submitted At</th>
                                            <th className="p-3 font-medium text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedResults.map(result => (
                                            <tr key={result.id} className="border-b last:border-0">
                                                <td className="p-3 font-semibold">{result.studentName}</td>
                                                <td className="p-3 text-center">{result.marksObtained} / {result.totalMarks}</td>
                                                <td className="p-3 text-center font-bold">{Math.round((result.marksObtained / result.totalMarks) * 100)}%</td>
                                                <td className="p-3 text-xs hidden sm:table-cell">{result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                                                <td className="p-3 text-center">
                                                    <Button variant="outline" size="sm" onClick={() => setViewingSubmission(result)}>
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Answers
                                                    </Button>
                                                </td>
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

            {viewingAnalyticsForTest && testAnalytics && (
                 <Dialog open={!!viewingAnalyticsForTest} onOpenChange={(isOpen) => !isOpen && setViewingAnalyticsForTest(null)}>
                    <DialogContent className="max-w-3xl">
                         <DialogHeader>
                            <DialogTitle>Analytics for: {viewingAnalyticsForTest.title}</DialogTitle>
                            <DialogDescription>
                                Performance breakdown for the {testAnalytics.totalSubmissions} student(s) who completed this test.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-3 gap-4 my-4">
                            <Card className="text-center">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{testAnalytics.averagePercentage}%</p>
                                    <p className="text-xs text-muted-foreground">{testAnalytics.averageScore} / {testAnalytics.totalMarks}</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{testAnalytics.highestScore}</p>
                                    <p className="text-xs text-muted-foreground">out of {testAnalytics.totalMarks}</p>
                                </CardContent>
                            </Card>
                             <Card className="text-center">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{testAnalytics.lowestScore}</p>
                                    <p className="text-xs text-muted-foreground">out of {testAnalytics.totalMarks}</p>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-4">
                            <h3 className="font-semibold">Question Breakdown</h3>
                            {testAnalytics.questionStats.map((stat, index) => (
                                <div key={index} className="text-sm">
                                    <p className="mb-2 font-medium">Q{index + 1}: {stat.questionText}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center text-success w-6"><Check/></div>
                                            <p className="w-24 text-muted-foreground">Correct</p>
                                            <div className="flex-1 bg-muted rounded-full h-4">
                                                <div className="bg-success h-4 rounded-full" style={{ width: `${(stat.correct / stat.total) * 100}%`}}></div>
                                            </div>
                                            <p className="w-12 text-right font-bold">{stat.correct} <span className="font-normal text-muted-foreground">({Math.round((stat.correct / stat.total) * 100)}%)</span></p>
                                        </div>
                                         <div className="flex items-center gap-2">
                                             <div className="flex items-center justify-center text-destructive w-6"><X/></div>
                                            <p className="w-24 text-muted-foreground">Incorrect</p>
                                            <div className="flex-1 bg-muted rounded-full h-4">
                                                <div className="bg-destructive h-4 rounded-full" style={{ width: `${(stat.incorrect / stat.total) * 100}%`}}></div>
                                            </div>
                                             <p className="w-12 text-right font-bold">{stat.incorrect} <span className="font-normal text-muted-foreground">({Math.round((stat.incorrect / stat.total) * 100)}%)</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" onClick={() => setViewingAnalyticsForTest(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            )}

            {viewingSubmission && (
                <Dialog open={!!viewingSubmission} onOpenChange={(isOpen) => { if (!isOpen) setViewingSubmission(null) }}>
                    <DialogContent className="max-w-3xl">
                         <DialogHeader>
                            <DialogTitle>Reviewing Submission: {viewingSubmission.studentName}</DialogTitle>
                            <DialogDescription>
                                Here is a breakdown of the student's answers. Correct answers are marked in green.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-4 p-4 rounded-lg bg-muted text-center">
                            <p className="text-lg font-medium">Final Score</p>
                            <p className="text-4xl font-bold text-primary">{viewingSubmission.marksObtained} <span className="text-2xl text-muted-foreground">/ {viewingSubmission.totalMarks}</span></p>
                        </div>

                        <div className="space-y-6 py-4 max-h-[50vh] overflow-y-auto pr-4">
                            {viewingSubmission.answers.map((ans, index) => (
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
                                            <span className="font-semibold">Student's Answer: </span> {ans.selectedAnswer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => setViewingSubmission(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

