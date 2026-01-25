
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
import { FlaskConical, AlertTriangle, Wand2, Save, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

    const handleQuestionChange = (qIndex: number, field: 'questionText' | 'option' | 'correctAnswer', value: string, optionIndex?: number) => {
        setGeneratedQuestions(prevQuestions => {
            return prevQuestions.map((q, index) => {
                if (index !== qIndex) return q;

                const updatedQ = { ...q };
                if (field === 'questionText') {
                    updatedQ.questionText = value;
                } else if (field === 'correctAnswer') {
                    updatedQ.correctAnswer = value;
                } else if (field === 'option' && optionIndex !== undefined) {
                    const oldOptionValue = updatedQ.options[optionIndex];
                    const newOptions = [...updatedQ.options];
                    newOptions[optionIndex] = value;
                    updatedQ.options = newOptions;

                    if (updatedQ.correctAnswer === oldOptionValue) {
                        updatedQ.correctAnswer = value;
                    }
                }
                return updatedQ;
            });
        });
    };
    
    const handleDeleteQuestion = (qIndex: number) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            const newQuestions = generatedQuestions.filter((_, index) => index !== qIndex);
            setGeneratedQuestions(newQuestions);
        }
    };


    const handleSaveTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !selectedClassId || generatedQuestions.length === 0) {
            alert("Please select a class and generate questions first.");
            return;
        }
        setIsSaving(true);

        const testsColRef = collection(firestore, 'tests');
        addDocumentNonBlocking(testsColRef, {
            teacherId: user.uid,
            classId: selectedClassId,
            title: testTitle,
            subject: subject,
            totalMarks: totalMarks,
            questions: generatedQuestions,
            createdAt: serverTimestamp(),
        })
        .then(() => {
            setIsSaveDialogOpen(false);
            setGeneratedQuestions([]);
            setTopic('');
            setSubject('');
            setClassLevel('');
        })
        .catch((error) => {
             console.error("Error saving test:", error);
             alert("Failed to save the test.");
        })
        .finally(() => {
            setIsSaving(false);
        });
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
                                    <CardDescription>Review and edit the questions generated by the AI before saving.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isGenerating && <p className="text-center text-muted-foreground py-8">Generating your test, please wait...</p>}
                                    {error && (
                                        <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                            <AlertTriangle className="h-6 w-6 text-destructive" />
                                            <div>
                                                <p className="font-bold text-destructive">Generation Failed</p>
                                                <p className="text-sm text-destructive/80">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    {generatedQuestions.length > 0 ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-end">
                                                <Button className="w-auto" onClick={() => setIsSaveDialogOpen(true)}>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Test
                                                </Button>
                                            </div>
                                            {generatedQuestions.map((q, qIndex) => (
                                                <div key={qIndex} className="border p-4 rounded-lg bg-background relative">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`q-text-${qIndex}`}>Question {qIndex + 1}</Label>
                                                        <Textarea
                                                            id={`q-text-${qIndex}`}
                                                            value={q.questionText}
                                                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                                            className="text-base"
                                                        />
                                                    </div>
                                                    <div className="mt-4 space-y-3">
                                                        <Label>Options &amp; Correct Answer</Label>
                                                        <RadioGroup
                                                            value={q.correctAnswer}
                                                            onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', value)}
                                                        >
                                                            {q.options.map((opt, optIndex) => (
                                                                <div key={optIndex} className="flex items-center gap-2">
                                                                    <RadioGroupItem value={opt} id={`q${qIndex}-opt${optIndex}`} />
                                                                    <Input
                                                                        id={`q${qIndex}-opt${optIndex}-input`}
                                                                        value={opt}
                                                                        onChange={(e) => handleQuestionChange(qIndex, 'option', e.target.value, optIndex)}
                                                                        className="flex-1"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteQuestion(qIndex)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
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
