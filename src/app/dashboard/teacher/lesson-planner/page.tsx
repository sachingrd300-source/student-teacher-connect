'use client';

import { useState } from 'react';
import { generateLessonPlan, LessonPlannerOutput } from '@/ai/flows/lesson-planner';
import { DashboardHeader } from '@/components/dashboard-header';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardEdit, AlertTriangle, Wand2, ListChecks, CheckSquare, Puzzle } from 'lucide-react';

export default function LessonPlannerPage() {
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
    const [duration, setDuration] = useState(45);

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPlan, setGeneratedPlan] = useState<LessonPlannerOutput | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !subject || !classLevel || !duration) {
            setError('Please fill in all required fields.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedPlan(null);

        try {
            const result = await generateLessonPlan({
                topic,
                subject,
                classLevel,
                duration,
            });
            setGeneratedPlan(result);
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred while generating the lesson plan. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                         <ClipboardEdit className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">AI Lesson Planner</h1>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lesson Details</CardTitle>
                                    <CardDescription>Provide the details for the lesson you want to create.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleGenerate} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="topic">Topic / Chapter</Label>
                                            <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., The Solar System" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Science" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="class-level">Class Level</Label>
                                            <Input id="class-level" value={classLevel} onChange={e => setClassLevel(e.target.value)} placeholder="e.g., Class 6" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Lesson Duration (in minutes)</Label>
                                            <Input id="duration" type="number" min="5" value={duration} onChange={e => setDuration(Number(e.target.value))} required />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isGenerating}>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            {isGenerating ? 'Generating...' : 'Generate Lesson Plan'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="lg:col-span-2 space-y-8">
                            <Card className="min-h-[400px]">
                                <CardHeader>
                                    <CardTitle>Generated Lesson Plan</CardTitle>
                                    <CardDescription>Review the AI-generated plan. You can copy the text to use elsewhere.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isGenerating && <p className="text-center text-muted-foreground py-8">Generating your lesson plan, please wait...</p>}
                                    {error && (
                                        <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                            <AlertTriangle className="h-6 w-6 text-destructive" />
                                            <div>
                                                <p className="font-bold text-destructive">Generation Failed</p>
                                                <p className="text-sm text-destructive/80">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    {generatedPlan ? (
                                        <div className="space-y-6">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                                                    <ListChecks className="h-6 w-6 text-primary"/>
                                                    <CardTitle className="text-lg">Learning Objectives</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                                        {generatedPlan.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                             <Card>
                                                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                                                    <CheckSquare className="h-6 w-6 text-primary"/>
                                                    <CardTitle className="text-lg">Materials Needed</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                                        {generatedPlan.materialsNeeded.map((mat, i) => <li key={i}>{mat}</li>)}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                                                    <Puzzle className="h-6 w-6 text-primary"/>
                                                    <CardTitle className="text-lg">Lesson Activities</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                     <div
                                                        className="prose prose-sm dark:prose-invert max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: generatedPlan.lessonActivities }}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ) : (
                                        !isGenerating && <p className="text-center text-muted-foreground py-8">Your generated lesson plan will appear here.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
