
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ClipboardList, CheckCircle, Percent } from 'lucide-react';

interface Enrollment {
    id: string;
    classId: string;
}

interface Question {
    questionText: string;
    options: string[];
    correctAnswer: string;
}

interface Test {
    id: string;
    title: string;
    subject: string;
    totalMarks: number;
    classId: string;
    questions: Question[];
    createdAt: Timestamp;
}

interface TestResult {
    id: string;
    testId: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
}

export default function StudentTestsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);
    
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: enrollments } = useCollection<Enrollment>(enrollmentsQuery);

    const enrolledClassIds = useMemo(() => {
        if (!enrollments) return [];
        return enrollments.map(e => e.classId);
    }, [enrollments]);

    const testsQuery = useMemoFirebase(() => {
        if (!firestore || enrolledClassIds.length === 0) return null;
        return query(collection(firestore, 'tests'), where('classId', 'in', enrolledClassIds));
    }, [firestore, enrolledClassIds]);
    const { data: tests, isLoading: testsLoading } = useCollection<Test>(testsQuery);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'testResults'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: results, isLoading: resultsLoading } = useCollection<TestResult>(resultsQuery);

    // Test taking state
    const [takingTest, setTakingTest] = useState<Test | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState<{ marksObtained: number, totalMarks: number } | null>(null);

    const handleAnswerChange = (questionIndex: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };
    
    const startTest = (test: Test) => {
        setTakingTest(test);
        setAnswers({});
        setLastResult(null);
        setIsSubmitting(false);
    };

    const handleSubmitTest = () => {
        if (!user || !firestore || !takingTest) return;

        setIsSubmitting(true);
        
        let score = 0;
        const marksPerQuestion = takingTest.totalMarks / takingTest.questions.length;
        
        takingTest.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                score += marksPerQuestion;
            }
        });

        const finalScore = Math.round(score);

        const resultData = {
            studentId: user.uid,
            teacherId: 'teacherId' in takingTest ? (takingTest as any).teacherId : 'unknown', // teacherId should be on test doc
            testId: takingTest.id,
            classId: takingTest.classId,
            marksObtained: finalScore,
            totalMarks: takingTest.totalMarks,
            submittedAt: serverTimestamp(),
        };

        const resultsColRef = collection(firestore, 'testResults');
        addDocumentNonBlocking(resultsColRef, resultData)
            .finally(() => {
                 setLastResult({ marksObtained: finalScore, totalMarks: takingTest.totalMarks });
                 setIsSubmitting(false);
            });
    };
    
    const getResultForTest = (testId: string) => {
        return results?.find(r => r.testId === testId);
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="flex items-center gap-4 mb-6">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">My Tests</h1>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Available Tests</CardTitle>
                            <CardDescription>Here are the tests assigned to your classes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {(testsLoading || resultsLoading) && <p>Loading tests and results...</p>}
                             {!(testsLoading || resultsLoading) && tests && tests.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {tests.map(test => {
                                        const result = getResultForTest(test.id);
                                        return (
                                            <Card key={test.id}>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{test.title}</CardTitle>
                                                    <CardDescription>{test.subject}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="text-sm">
                                                    <p>Total Marks: <span className="font-semibold">{test.totalMarks}</span></p>
                                                    <p>Questions: <span className="font-semibold">{test.questions.length}</span></p>
                                                </CardContent>
                                                <CardFooter>
                                                    {result ? (
                                                        <div className="w-full text-center p-2 rounded-md bg-success/10 text-success font-semibold">
                                                            Score: {result.marksObtained} / {result.totalMarks}
                                                        </div>
                                                    ) : (
                                                        <Button className="w-full" onClick={() => startTest(test)}>
                                                            Take Test
                                                        </Button>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                             ) : (
                                 !testsLoading && <p className="text-center text-muted-foreground py-8">No tests have been assigned to your classes yet.</p>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {takingTest && (
                <Dialog open={!!takingTest} onOpenChange={(isOpen) => { if (!isOpen) setTakingTest(null) }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{takingTest.title}</DialogTitle>
                             <DialogDescription>{takingTest.subject} - {takingTest.totalMarks} Marks</DialogDescription>
                        </DialogHeader>
                        
                        {lastResult ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center">
                                <CheckCircle className="h-16 w-16 text-success mb-4" />
                                <h2 className="text-2xl font-bold">Test Submitted!</h2>
                                <p className="text-muted-foreground">You can now close this window.</p>
                                <div className="mt-6 p-6 rounded-lg bg-muted w-full">
                                    <p className="text-lg font-medium">Your Score</p>
                                    <p className="text-5xl font-bold text-primary">{lastResult.marksObtained} <span className="text-3xl text-muted-foreground">/ {lastResult.totalMarks}</span></p>
                                    <div className="flex items-center justify-center gap-2 mt-2 text-lg">
                                        <Percent className="h-5 w-5" />
                                        <span>{Math.round((lastResult.marksObtained / lastResult.totalMarks) * 100)}%</span>
                                    </div>
                                </div>
                                <Button onClick={() => setTakingTest(null)} className="mt-6 w-full">Close</Button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
                                    {takingTest.questions.map((q, index) => (
                                        <div key={index} className="border-b pb-4 last:border-b-0">
                                            <p className="font-semibold mb-3">Q{index + 1}: {q.questionText}</p>
                                            <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)} className="space-y-2">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={opt} id={`q${index}-opt${i}`} />
                                                        <Label htmlFor={`q${index}-opt${i}`} className="font-normal">{opt}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="secondary" onClick={() => setTakingTest(null)}>Cancel</Button>
                                    <Button onClick={handleSubmitTest} disabled={isSubmitting || Object.keys(answers).length !== takingTest.questions.length}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}
