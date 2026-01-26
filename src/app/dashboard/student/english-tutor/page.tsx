'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Languages, Wand2, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { helpWithEnglish } from '@/ai/flows/english-tutor';

export default function EnglishTutorPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'hindi-to-english' | 'english-correction'>('hindi-to-english');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        setIsLoading(true);
        setResult('');
        setExplanation('');
        setError(null);

        try {
            const response = await helpWithEnglish({ text: inputText, mode: activeTab });
            setResult(response.result);
            setExplanation(response.explanation);
        } catch (err) {
            console.error(err);
            setError('An error occurred while getting help from the AI. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const placeholders = {
        'hindi-to-english': 'यहाँ हिंदी में एक वाक्य लिखें, जैसे: मैं स्कूल जा रहा हूँ।',
        'english-correction': 'Write an English sentence here to be corrected, e.g., He go to school.'
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Languages className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">AI English Tutor</h1>
                    </div>

                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle>English Learning Assistant</CardTitle>
                            <CardDescription>Your personal AI tutor to help you learn English. Select a mode below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="hindi-to-english">Hindi to English</TabsTrigger>
                                    <TabsTrigger value="english-correction">Correct my English</TabsTrigger>
                                </TabsList>
                                <TabsContent value="hindi-to-english" />
                                <TabsContent value="english-correction" />
                            </Tabs>

                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <Textarea
                                    placeholder={placeholders[activeTab]}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    rows={4}
                                    className="text-base"
                                />
                                <Button type="submit" disabled={isLoading || !inputText.trim()} className="w-full">
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    {isLoading ? 'Thinking...' : 'Get Help'}
                                </Button>
                            </form>

                            {(isLoading || result || error) && (
                                <div className="mt-6 border-t pt-6">
                                    {isLoading && <p className="text-center text-muted-foreground">The AI is working on it...</p>}
                                    {error && <p className="text-center text-destructive">{error}</p>}
                                    {result && (
                                        <div className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Result</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-xl font-semibold text-primary">{result}</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Explanation</CardTitle>
                                                     <CardDescription>A simple breakdown from your AI tutor.</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-muted-foreground whitespace-pre-wrap">{explanation}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
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
