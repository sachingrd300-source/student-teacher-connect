
'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Lightbulb } from 'lucide-react';
import { solveQuestion } from '@/ai/flows/question-solver';

export default function AiSolverPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsLoading(true);
        setAnswer('');
        setError(null);

        try {
            const result = await solveQuestion({ question });
            setAnswer(result.answer);
        } catch (err) {
            console.error(err);
            setError('An error occurred while getting the answer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Wand2 className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">AI Question Solver</h1>
                    </div>

                    <Card className="max-w-3xl mx-auto">
                        <CardHeader>
                            <CardTitle>Ask Anything!</CardTitle>
                            <CardDescription>Have a doubt? Stuck on a problem? Type your question below and let our AI assistant help you out.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                    placeholder="For example: What is Newton's second law of motion? or Solve for x in 2x + 5 = 15"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    rows={4}
                                    className="text-base"
                                />
                                <Button type="submit" disabled={isLoading || !question.trim()} className="w-full">
                                    {isLoading ? 'Thinking...' : 'Get Answer'}
                                </Button>
                            </form>

                            {(isLoading || answer || error) && (
                                <div className="mt-6 border-t pt-6">
                                    {isLoading && <p className="text-center text-muted-foreground">The AI is generating your answer...</p>}
                                    {error && <p className="text-center text-destructive">{error}</p>}
                                    {answer && (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center gap-3">
                                                <Lightbulb className="h-6 w-6 text-primary" />
                                                <CardTitle>AI Generated Answer</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: answer }}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
