
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ClipboardList, CheckCircle, Percent, FileText, XCircle } from 'lucide-react';

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
    teacherId: string;
    questions: Question[];
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
    testTitle: string;
    testSubject: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
    answers: AnswerDetail[];
}

export default function StudentTestsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc<{name: string}>(userProfileRef);
    
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: enrollments } = useCollection<Enrollment>(enrollmentsQuery);

    const enrolledClassIds = useMemo(() => {
        if (!enrollments) return [];
        return enrollments.map(e => e.classId);
    }, [enrollments]);

    const [tests, setTests] = useState<Test[]>([]);
    const [testsLoading, setTestsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !enrolledClassIds || enrolledClassIds.length === 0) {
            setTestsLoading(false);
            setTests([]);
            return;
        }
    
        const fetchTests = async () => {
            setTestsLoading(true);
            const allTests: Test[] = [];
            try {
                for (const classId of enrolledClassIds) {
                    const q = query(collection(firestore, 'tests'), where('classId', '==', classId));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        allTests.push({ id: doc.id, ...doc.data() } as Test);
                    });
                }
                setTests(allTests.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds));
            } catch (error) {
                console.error("Error fetching tests:", error);
            } finally {
                setTestsLoading(false);
            }
        };
    
        fetchTests();
    }, [firestore, enrolledClassIds]);

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

    // Test review state
    const [viewingResult, setViewingResult] = useState<TestResult | null>(null);

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
        if (!user || !firestore || !takingTest || !userProfile) return;

        setIsSubmitting(true);
        
        let score = 0;
        const marksPerQuestion = takingTest.totalMarks / takingTest.questions.length;
        
        takingTest.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                score += marksPerQuestion;
            }
        });

        const finalScore = Math.round(score);

        const answersPayload: AnswerDetail[] = takingTest.questions.map((q, index) => ({
            questionText: q.questionText,
            options: q.options,
            selectedAnswer: answers[index] || "Not Answered",
            correctAnswer: q.correctAnswer,
        }));

        const resultData = {
            studentId: user.uid,
            studentName: userProfile.name,
            teacherId: takingTest.teacherId,
            testId: takingTest.id,
            classId: takingTest.classId,
            testTitle: takingTest.title,
            testSubject: takingTest.subject,
            marksObtained: finalScore,
            totalMarks: takingTest.totalMarks,
            answers: answersPayload,
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
                                            <Card key={test.id} className="flex flex-col">
                                                <CardHeader className="flex-1">
                                                    <CardTitle className="text-lg">{test.title}</CardTitle>
                                                    <CardDescription>{test.subject}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-1 text-sm space-y-1">
                                                    <p>Total Marks: <span className="font-semibold">{test.totalMarks}</span></p>
                                                    <p>Questions: <span className="font-semibold">{test.questions.length}</span></p>
                                                </CardContent>
                                                <CardFooter>
                                                    {result ? (
                                                        <div className='w-full space-y-2'>
                                                            <div className="w-full text-center p-2 rounded-md bg-success/10 text-success font-semibold">
                                                                Score: {result.marksObtained} / {result.totalMarks}
                                                            </div>
                                                            <Button className="w-full" variant="outline" onClick={() => setViewingResult(result)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                View Result
                                                            </Button>
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

            {/* Test Taking Dialog */}
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
                                <p className="text-muted-foreground">You can now close this window and review your results.</p>
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

            {/* Test Review Dialog */}
            {viewingResult && (
                <Dialog open={!!viewingResult} onOpenChange={(isOpen) => { if (!isOpen) setViewingResult(null) }}>
                    <DialogContent className="max-w-3xl">
                         <DialogHeader>
                            <DialogTitle>Test Review</DialogTitle>
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
