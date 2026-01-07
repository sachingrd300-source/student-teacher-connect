'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon } from 'lucide-react';
import { teacherData } from '@/lib/data';

type ConnectTeacherFormProps = {
    onConnectionSuccess: () => void;
};

export function ConnectTeacherForm({ onConnectionSuccess }: ConnectTeacherFormProps) {
    const [teacherCode, setTeacherCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

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

        setIsLoading(true);

        // Simulate API call to verify code and connect
        setTimeout(() => {
            if (teacherCode === teacherData.id) {
                toast({
                    title: 'Success!',
                    description: `You are now connected with ${teacherData.name}.`,
                });
                onConnectionSuccess();
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
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Connect with Your Teacher</CardTitle>
                <CardDescription>Enter the verification code provided by your teacher to get started.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="teacher-code">Teacher's Verification Code</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="teacher-code"
                                placeholder="e.g. TID-84321"
                                value={teacherCode}
                                onChange={(e) => setTeacherCode(e.target.value)}
                                className="pl-10 text-lg font-mono tracking-wider"
                                required
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect and View Dashboard'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
