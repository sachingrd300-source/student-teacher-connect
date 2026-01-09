'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  status: 'pending_verification' | 'approved';
  subjects?: string[];
  classLevels?: string[];
  avatarUrl?: string;
} | null;

type CreateClassDialogProps = {
  userProfile: UserProfile;
};

export function CreateClassDialog({ userProfile }: CreateClassDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isCreateClassOpen, setCreateClassOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    subject: '',
    classLevel: '',
  });

  const handleCreateClass = () => {
    if (!newClassData.subject || !newClassData.classLevel || !firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a subject and class level.',
      });
      return;
    }

    const classCode = `${newClassData.subject
      .substring(0, 4)
      .toUpperCase()}${newClassData.classLevel.replace(/\s/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const classData = {
      ...newClassData,
      teacherId: user.uid,
      classCode,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'classes'), classData);

    toast({
      title: 'Class Created!',
      description: `Your new class code is ${classCode}. Share it with your students.`,
    });
    setCreateClassOpen(false);
    setNewClassData({ subject: '', classLevel: '' });
  };

  return (
    <Dialog open={isCreateClassOpen} onOpenChange={setCreateClassOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a New Class</DialogTitle>
          <DialogDescription>
            Select a subject and level to generate a unique class code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              onValueChange={(value) =>
                setNewClassData((p) => ({ ...p, subject: value }))
              }
              value={newClassData.subject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {userProfile?.subjects?.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classLevel">Class/Level</Label>
            <Select
              onValueChange={(value) =>
                setNewClassData((p) => ({ ...p, classLevel: value }))
              }
              value={newClassData.classLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class level" />
              </SelectTrigger>
              <SelectContent>
                {userProfile?.classLevels?.map((cl) => (
                  <SelectItem key={cl} value={cl}>
                    {cl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateClass}>Generate Code</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
