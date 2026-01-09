
'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon } from 'lucide-react';
import { teacherData } from '@/lib/data';
import { useUser } from '@/firebase';

type ConnectTeacherFormProps = {
    onConnectionSuccess: () => void;
};

export function ConnectTeacherForm({ onConnectionSuccess }: ConnectTeacherFormProps) {
    const [teacherCode, setTeacherCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    const handleSubmit = (e: React.FormEvent) => {
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

        setIsLoading(true);

        // Simulate API call to create an enrollment request
        setTimeout(() => {
            // In a real app, you would check if the teacher code exists
            // and then create a new document in the 'enrollments' collection
            // with studentId, teacherId (from code), and status: 'pending'.
            
            // For now, we'll just check against the mock teacher's ID
            if (teacherCode === teacherData.id) {
                toast({
                    title: 'Request Sent!',
                    description: `Your connection request has been sent to the teacher.`,
                });
                onConnectionSuccess();
                setTeacherCode('');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Code',
                    description: 'The teacher code is incorrect. Please try again.',
                });
            }
            setIsLoading(false);
        }, 1500);
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
