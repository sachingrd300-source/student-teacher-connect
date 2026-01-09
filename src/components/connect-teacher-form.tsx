
'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type ConnectTeacherFormProps = {
    onConnectionSuccess: () => void;
};

export function ConnectTeacherForm({ onConnectionSuccess }: ConnectTeacherFormProps) {
    const [classCode, setClassCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classCode) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a class code.',
            });
            return;
        }

        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to join a class.',
            });
            return;
        }

        setIsLoading(true);

        try {
            const classesRef = collection(firestore, 'classes');
            const q = query(classesRef, where('classCode', '==', classCode.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Code',
                    description: 'No class found with that code. Please check the code and try again.',
                });
                setIsLoading(false);
                return;
            }
            
            const classDoc = querySnapshot.docs[0];
            const classId = classDoc.id;
            
            const enrollmentsRef = collection(firestore, 'enrollments');
            const existingEnrollmentQuery = query(enrollmentsRef, where('studentId', '==', user.uid), where('classId', '==', classId));
            const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

            if (!existingEnrollmentSnapshot.empty) {
                toast({
                    variant: 'default',
                    title: 'Already Enrolled',
                    description: 'You have already sent a request to join this class.',
                });
                setIsLoading(false);
                return;
            }

            const enrollmentData = {
                studentId: user.uid,
                classId: classId,
                status: 'pending',
                studentName: user.displayName || 'New Student',
                studentAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
            };
            
            addDocumentNonBlocking(enrollmentsRef, enrollmentData);

            toast({
                title: 'Request Sent!',
                description: `Your request to join the class has been sent for approval.`,
            });
            onConnectionSuccess();
            setClassCode('');

        } catch (error) {
            console.error("Error joining class:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not send join request. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                     <Label htmlFor="class-code" className="sr-only">Class Code</Label>
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="class-code"
                        placeholder="Enter class code"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        className="pl-10 text-base"
                        required
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? 'Sending Request...' : 'Join Class'}
                </Button>
            </div>
        </form>
    );
}
