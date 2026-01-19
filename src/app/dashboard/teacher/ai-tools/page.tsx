'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTestPaper, type GenerateTestPaperOutput } from '@/ai/flows/generate-test-paper-flow';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AiToolsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [numQuestions, setNumQuestions] = useState<number | ''>(5);

  const [generatedTest, setGeneratedTest] = useState<GenerateTestPaperOutput | null>(null);

  const handleGenerate = async () => {
    if (!topic || !subject || !classLevel || numQuestions === '') {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in all the details to generate a test.'});
        return;
    }

    setIsLoading(true);
    setGeneratedTest(null);

    try {
        const result = await generateTestPaper({
            topic,
            subject,
            classLevel,
            numQuestions: Number(numQuestions),
        });
        setGeneratedTest(result);
         toast({ title: 'Test Paper Generated!', description: 'Your test paper is ready below.'});
    } catch (error) {
        console.error('Error generating test paper:', error);
        toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate the test paper. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Tools
        </h1>
        <p className="text-muted-foreground">
          Leverage the power of AI to create educational content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-soft-shadow h-fit">
          <CardHeader>
            <CardTitle>Test Paper Generator</CardTitle>
            <CardDescription>
              Create a practice test paper in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Newton's Laws of Motion" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Input id="classLevel" value={classLevel} onChange={e => setClassLevel(e.target.value)} placeholder="e.g. Class 11" />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input id="numQuestions" type="number" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} min={1} max={20} />
            </div>
            <Button onClick={handleGenerate} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> Generate Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {isLoading && (
            <Card className="shadow-soft-shadow p-6 flex items-center justify-center min-h-[300px]">
                <div className='text-center space-y-2'>
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="font-semibold">Generating your test paper...</p>
                    <p className="text-sm text-muted-foreground">This can take up to 30 seconds.</p>
                </div>
            </Card>
          )}

          {generatedTest && (
            <Card className="shadow-soft-shadow">
                <CardHeader>
                    <CardTitle>Generated Test Paper</CardTitle>
                    <CardDescription>Topic: {topic} | Subject: {subject} | Class: {classLevel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {generatedTest.questions.map((q, index) => (
                        <div key={index}>
                             <div className="flex items-start gap-4">
                                <div className="font-bold">{index + 1}.</div>
                                <div className="flex-1">
                                    <p className="font-semibold">{q.questionText}</p>
                                    {q.questionType === 'mcq' && q.options && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`p-2 rounded-md ${opt === q.correctAnswer ? 'bg-green-500/10 text-green-700' : 'bg-muted/50'}`}>
                                                    ({String.fromCharCode(97 + i)}) {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                     <p className="text-sm mt-3">
                                        <span className="font-semibold">Answer: </span>
                                        <span className="text-muted-foreground">{q.correctAnswer}</span>
                                    </p>
                                </div>
                                <Badge variant="outline">{q.questionType.toUpperCase()}</Badge>
                            </div>
                            {index < generatedTest.questions.length - 1 && <Separator className="mt-6"/>}
                        </div>
                    ))}
                </CardContent>
            </Card>
          )}

          {!generatedTest && !isLoading && (
              <Card className="shadow-soft-shadow p-6 flex items-center justify-center min-h-[300px] border-dashed">
                <div className='text-center space-y-2 text-muted-foreground'>
                    <Wand2 className="h-8 w-8 mx-auto" />
                    <p className="font-semibold">Your generated test will appear here.</p>
                    <p className="text-sm">Fill out the form to get started.</p>
                </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
