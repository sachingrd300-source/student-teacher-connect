
"use client";

import { useState, useMemo } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { createClass } from '@/firebase/class';
import { Home, PlusCircle, Copy, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, orderBy } from 'firebase/firestore';

type ClassInfo = {
  id: string;
  subject: string;
  classLevel: string;
  classCode: string;
};

const classLevels = ["9-10", "11-12", "Undergraduate", "Postgraduate"];


export default function TeacherDashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isCreateClassOpen, setCreateClassOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');

  const classesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'classes'), 
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: classes, isLoading: isLoadingClasses } = useCollection<ClassInfo>(classesQuery);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateClass = async () => {
    if (!subject || !classLevel) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a subject and class level.' });
        return;
    }
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not logged in.' });
        return;
    }
    try {
        await createClass(firestore, user.uid, subject, classLevel);
        toast({ title: 'Class Created!', description: `${subject} - ${classLevel} has been created.` });
        setSubject('');
        setClassLevel('');
        setCreateClassOpen(false);
    } catch (error) {
        console.error("Error creating class:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create class.' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Class code copied to clipboard.' });
  }

  const isLoading = isUserLoading || isLoadingClasses;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `${getGreeting()}, ${user.displayName || 'Teacher'}!` : 'Teacher Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your classes. Create a new one to get started.
        </p>
      </div>

        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">My Classes</h2>
            <Dialog open={isCreateClassOpen} onOpenChange={setCreateClassOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Class</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Class</DialogTitle>
                        <DialogDescription>
                            This will create a new class (or batch) that students can join using a unique code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classLevel">Class Level</Label>
                            <Select onValueChange={setClassLevel} value={classLevel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateClass}>Create Class</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      
        {classes && classes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {classes.map(cls => (
                    <Card key={cls.id} className="shadow-soft-shadow">
                        <CardHeader>
                            <CardTitle>{cls.subject}</CardTitle>
                            <CardDescription>{cls.classLevel}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Share this code with your students to let them join:</p>
                            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
                                <span className="font-mono text-lg">{cls.classCode}</span>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(cls.classCode)}>
                                    <Copy className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full" disabled>
                                <Users className="mr-2 h-4 w-4"/>
                                View Students (Coming soon)
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Classes Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Click "Create New Class" to set up your first class.</p>
            </div>
        )}
    </div>
  );
}
