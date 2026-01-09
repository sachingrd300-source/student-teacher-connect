
'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type ConnectTeacherFormProps = {
    onConnectionSuccess: () => void;
};

export function ConnectTeacherForm({ onConnectionSuccess }: ConnectTeacherFormProps) {
    const [teacherCode, setTeacherCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherCode) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter your teacher\'s verification code.',
            });
            return;
        }

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to connect with a teacher.',
            });
            return;
        }

        if (!firestore) return;

        setIsLoading(true);

        try {
            // Find the teacher by their verification code (which is their user ID in this design)
            const teachersRef = collection(firestore, 'users');
            // In our schema, the teacher's public-facing ID is their user document ID.
            // We assume the teacher gives the student their user.id
            const q = query(teachersRef, where('id', '==', teacherCode), where('role', '==', 'teacher'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Code',
                    description: 'No teacher found with that verification code. Please try again.',
                });
                setIsLoading(false);
                return;
            }
            
            const teacherDoc = querySnapshot.docs[0];
            const teacherId = teacherDoc.id;
            const teacherData = teacherDoc.data();

            // Check if an enrollment already exists
            const enrollmentsRef = collection(firestore, 'enrollments');
            const existingEnrollmentQuery = query(enrollmentsRef, where('studentId', '==', user.uid), where('teacherId', '==', teacherId));
            const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

            if (!existingEnrollmentSnapshot.empty) {
                toast({
                    variant: 'default',
                    title: 'Already Connected',
                    description: 'You already have a pending or approved connection with this teacher.',
                });
                setIsLoading(false);
                return;
            }


            // Create a new enrollment request document
            const enrollmentData = {
                studentId: user.uid,
                studentName: user.displayName || 'New Student',
                studentAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
                teacherId: teacherId,
                teacherName: teacherData.name || 'Teacher',
                status: 'pending'
            };
            
            addDocumentNonBlocking(collection(firestore, "enrollments"), enrollmentData);

            toast({
                title: 'Request Sent!',
                description: `Your connection request has been sent to the teacher.`,
            });
            onConnectionSuccess();
            setTeacherCode('');

        } catch (error) {
            console.error("Error connecting with teacher:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not send connection request. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                     <Label htmlFor="teacher-code" className="sr-only">Teacher's Verification Code</Label>
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="teacher-code"
                        placeholder="Enter teacher's code"
                        value={teacherCode}
                        onChange={(e) => setTeacherCode(e.target.value)}
                        className="pl-10 text-base"
                        required
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? 'Sending Request...' : 'Send Request'}
                </Button>
            </div>
        </form>
    );
}
