
'use client';

import { useState } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ClipboardList, Trash2, Eye, CheckCircle } from 'lucide-react';
import { Question } from '@/ai/flows/test-generator';

interface Test {
    id: string;
    title: string;
    subject: string;
    totalMarks: number;
    classId: string;
    questions: Question[];
    createdAt: Timestamp;
}

export default function TeacherTestsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [viewingTest, setViewingTest] = useState<Test | null>(null);

    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'tests'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: tests, isLoading } = useCollection<Test>(testsQuery);

    const handleDelete = (testId: string) => {
        if (!firestore) return;
        if (window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
            deleteDocumentNonBlocking(doc(firestore, 'tests', testId));
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Manage Tests</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Created Tests</CardTitle>
                            <CardDescription>Here is a list of all the tests you have created.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoading && <p>Loading your tests...</p>}
                            {tests && tests.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {tests.map(test => (
                                        <Card key={test.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle className="text-lg">{test.title}</CardTitle>
                                                <CardDescription>{test.subject}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 text-sm space-y-2">
                                                <p>Total Marks: <span className="font-semibold">{test.totalMarks}</span></p>
                                                <p>Questions: <span className="font-semibold">{test.questions.length}</span></p>
                                                 <p className="text-xs text-muted-foreground pt-2">
                                                    Created: {test.createdAt ? new Date(test.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="justify-end gap-2">
                                                 <Button variant="outline" size="sm" onClick={() => setViewingTest(test)}>
                                                    <Eye className="h-4 w-4 mr-2" /> View
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(test.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-center text-muted-foreground py-8">You haven't created any tests yet. Go to the AI Test Generator to create one.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {viewingTest && (
                <Dialog open={!!viewingTest} onOpenChange={(isOpen) => !isOpen && setViewingTest(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{viewingTest.title}</DialogTitle>
                            <DialogDescription>
                                {viewingTest.subject} - {viewingTest.totalMarks} Marks
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            {viewingTest.questions.map((q, index) => (
                                <div key={index} className="border-b pb-4 last:border-0">
                                    <p className="font-semibold mb-3">Q{index + 1}: {q.questionText}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`flex items-center gap-2 p-2 rounded-md ${opt === q.correctAnswer ? 'bg-success/10 text-success font-semibold' : 'bg-muted'}`}>
                                                {opt === q.correctAnswer ? <CheckCircle className="h-4 w-4 text-success flex-shrink-0" /> : <div className="h-4 w-4" />}
                                                <span>{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <DialogFooter>
                            <Button type="button" onClick={() => setViewingTest(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
