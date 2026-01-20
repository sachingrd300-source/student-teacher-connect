'use client';

import { useState, useMemo } from 'react';
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
import { Sparkles, Loader2, Wand2, FilePlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTestPaper, type GenerateTestPaperOutput } from '@/ai/flows/generate-test-paper-flow';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type Batch = {
    id: string;
    subject: string;
    classLevel: string;
    title: string;
}

const classLevelOptions = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate"];

export default function AiToolsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [numQuestions, setNumQuestions] = useState<number | ''>(5);
  const [generatedTest, setGeneratedTest] = useState<GenerateTestPaperOutput | null>(null);

  // State for the "Save Material" dialog
  const [isSaveOpen, setSaveOpen] = useState(false);
  const [saveForm, setSaveForm] = useState({
    title: '',
    visibility: 'public',
    isFree: true,
    price: '' as number | '',
    batchId: null as string | null,
    targetClassLevel: null as string | null,
  });

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<any>(userProfileQuery);

  const batchesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
  }, [firestore, user]);
  const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);


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
        setSaveForm(prev => ({ ...prev, title: `Practice Test: ${topic}`, targetClassLevel: classLevel }));
         toast({ title: 'Test Paper Generated!', description: 'Your test paper is ready below.'});
    } catch (error) {
        console.error('Error generating test paper:', error);
        toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate the test paper. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveAsMaterial = async () => {
    if (!generatedTest || !user || !userProfile || !saveForm.title) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title for the material.' });
      return;
    }
    
    const newMaterial = {
        title: saveForm.title,
        subject: subject, // From generator form
        classLevel: saveForm.visibility === 'public' ? saveForm.targetClassLevel : null,
        type: 'Test Paper',
        teacherId: user.uid,
        teacherName: userProfile.name,
        isFree: saveForm.visibility === 'private' ? true : saveForm.isFree,
        price: saveForm.visibility === 'public' && !saveForm.isFree ? Number(saveForm.price) : 0,
        classId: saveForm.visibility === 'private' ? saveForm.batchId : null,
        createdAt: serverTimestamp(),
        questions: generatedTest.questions,
        fileUrl: null, // No file for generated tests
    };

    const materialsCollection = collection(firestore, 'studyMaterials');
    addDoc(materialsCollection, newMaterial)
        .then(() => {
            toast({ title: 'Test Saved!', description: 'The test paper has been added to your Study Materials.' });
            setSaveOpen(false);
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: materialsCollection.path,
                    operation: 'create',
                    requestResourceData: newMaterial,
                })
            );
        });
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
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Generated Test Paper</CardTitle>
                        <CardDescription>Topic: {topic} | Subject: {subject} | Class: {classLevel}</CardDescription>
                    </div>
                     <Dialog open={isSaveOpen} onOpenChange={setSaveOpen}>
                        <DialogTrigger asChild>
                            <Button><FilePlus2 className="mr-2" />Save as Material</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save Test as Study Material</DialogTitle>
                                <DialogDescription>Provide the details to save this test for your students.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="space-y-2">
                                    <Label htmlFor="save-title">Title*</Label>
                                    <Input id="save-title" value={saveForm.title} onChange={e => setSaveForm(prev => ({ ...prev, title: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Visibility</Label>
                                    <RadioGroup value={saveForm.visibility} onValueChange={(v) => setSaveForm(prev => ({...prev, visibility: v}))} className="flex space-x-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="public" id="public" /><Label htmlFor="public">Public</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="private" id="private" /><Label htmlFor="private">Private</Label></div>
                                    </RadioGroup>
                                </div>

                                {saveForm.visibility === 'public' && (
                                    <div className="space-y-4 pt-2 pl-4 border-l">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="isFree">Free for Everyone</Label>
                                            <Switch id="isFree" checked={saveForm.isFree} onCheckedChange={(c) => setSaveForm(prev => ({...prev, isFree: c}))} />
                                        </div>
                                        {!saveForm.isFree && (
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Price (INR)*</Label>
                                                <Input id="price" type="number" value={saveForm.price} onChange={e => setSaveForm(prev => ({...prev, price: Number(e.target.value)}))} placeholder="e.g. 50" />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="classLevel">Target Class Level (Optional)</Label>
                                            <Select onValueChange={(val) => setSaveForm(prev => ({...prev, targetClassLevel: val === 'none' ? null : val}))} value={saveForm.targetClassLevel || 'none'}>
                                                <SelectTrigger><SelectValue placeholder="For filtering..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {classLevelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {saveForm.visibility === 'private' && (
                                    <div className="space-y-2 pt-2 pl-4 border-l">
                                        <Label htmlFor="class">Assign to Batch*</Label>
                                        <Select onValueChange={(val) => setSaveForm(prev => ({...prev, batchId: val === 'none' ? null : val}))} value={saveForm.batchId || 'none'} disabled={isLoadingBatches}>
                                            <SelectTrigger><SelectValue placeholder="Select a private batch..." /></SelectTrigger>
                                            <SelectContent>
                                                {isLoadingBatches ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                                    <>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {batches?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                                                    </>
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveAsMaterial} disabled={isUserLoading || isLoadingProfile || isLoadingBatches}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
