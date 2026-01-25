'use client';

import { useState } from 'react';
import { generateTest, Question } from '@/ai/flows/test-generator';
import { DashboardHeader } from '@/components/dashboard-header';
import { useUser, useDoc, useMemoFirebase, useFirestore, useCollection, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { FlaskConical, AlertTriangle, CheckCircle, Wand2, Save } from 'lucide-react';

interface Class {
    id: string;
    title: string;
}

export default function TestGeneratorPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    // Form state
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [classLevel, setClassLevel] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

    // Save Dialog State
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testTitle, setTestTitle] = useState('');
    const [totalMarks, setTotalMarks] = useState(0);
    const [selectedClassId, setSelectedClassId] = useState('');


    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: classes } = useCollection<Class>(classesQuery);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !subject || !classLevel) {
            setError('Please fill in all required fields.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedQuestions([]);

        try {
            const result = await generateTest({
                topic,
                subject,
                classLevel,
                numQuestions,
                difficulty,
            });
            setGeneratedQuestions(result.questions);
            setTestTitle(topic); // Pre-fill test title
            setTotalMarks(numQuestions * 5); // Default marks
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred while generating the test. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !selectedClassId || generatedQuestions.length === 0) {
            alert("Please select a class and generate questions first.");
            return;
        }
        setIsSaving(true);
        try {
            const testsColRef = collection(firestore, 'tests');
            await addDocumentNonBlocking(testsColRef, {
                teacherId: user.uid,
                classId: selectedClassId,
                title: testTitle,
                subject: subject,
                totalMarks: totalMarks,
                questions: generatedQuestions,
                createdAt: serverTimestamp(),
            });
            setIsSaveDialogOpen(false);
            setGeneratedQuestions([]);
            setTopic('');
        } catch (error) {
            console.error("Error saving test:", error);
            alert("Failed to save the test.");
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                         <FlaskConical className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">AI Test Generator</h1>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Test Details</CardTitle>
                                    <CardDescription>Provide the details for the test you want to generate.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleGenerate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="topic">Topic / Chapter</Label>
                                            <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Biology" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class-level">Class Level</Label>
                                            <Input id="class-level" value={classLevel} onChange={e => setClassLevel(e.target.value)} placeholder="e.g., Class 10" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="num-questions">Number of Questions</Label>
                                            <Input id="num-questions" type="number" min="1" max="20" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="difficulty">Difficulty</Label>
                                            <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setDifficulty(value)} value={difficulty}>
                                                <SelectTrigger id="difficulty">
                                                    <SelectValue placeholder="Select difficulty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Easy">Easy</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Hard">Hard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isGenerating}>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            {isGenerating ? 'Generating...' : 'Generate Test'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Generated Questions</CardTitle>
                                    <CardDescription>Review the questions generated by the AI. You can copy them or save the test.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isGenerating && <p className="text-center text-muted-foreground py-8">Generating your test, please wait...</p>}
                                    {error && (
                                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertTriangle className="h-6 w-6 text-destructive" />
                                            <div>
                                                <p className="font-bold text-destructive">Generation Failed</p>
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    {generatedQuestions.length > 0 ? (
                                        <div className="space-y-6">
                                            {generatedQuestions.map((q, index) => (
                                                <div key={index} className="border p-4 rounded-lg bg-background">
                                                    <p className="font-semibold mb-3">Q{index + 1}: {q.questionText}</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className={`flex items-center gap-2 p-2 rounded-md ${opt === q.correctAnswer ? 'bg-green-100 text-green-900' : 'bg-muted'}`}>
                                                                {opt === q.correctAnswer ? <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" /> : <div className="h-4 w-4" />}
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <Button className="w-full" onClick={() => setIsSaveDialogOpen(true)}>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Test
                                            </Button>
                                        </div>
                                    ) : (
                                        !isGenerating && <p className="text-center text-muted-foreground py-8">Your generated questions will appear here.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Test</DialogTitle>
                        <DialogDescription>
                            Provide a title, total marks, and assign this test to a class.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTest} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="test-title">Test Title</Label>
                            <Input id="test-title" value={testTitle} onChange={e => setTestTitle(e.target.value)} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="total-marks">Total Marks</Label>
                            <Input id="total-marks" type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="class-select">Assign to Class</Label>
                             <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                                <SelectTrigger id="class-select">
                                    <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving || !selectedClassId}>
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
