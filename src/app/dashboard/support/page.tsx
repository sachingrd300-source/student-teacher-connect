'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, LifeBuoy, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserProfile {
    name: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
}

interface Complaint {
    id: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

export default function SupportPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const complaintsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'complaints'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: complaints, isLoading: complaintsLoading } = useCollection<Complaint>(complaintsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile) return;

        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            await addDoc(collection(firestore, 'complaints'), {
                userId: user.uid,
                userName: userProfile.name,
                userRole: userProfile.role,
                subject: subject.trim(),
                message: message.trim(),
                status: 'open',
                createdAt: new Date().toISOString(),
            });
            setSubject('');
            setMessage('');
            setSubmitStatus({ type: 'success', message: 'Your complaint has been submitted successfully. Our team will review it shortly.' });
        } catch (error) {
            console.error("Error submitting complaint:", error);
            setSubmitStatus({ type: 'error', message: 'Failed to submit your complaint. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <LifeBuoy className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Support Center...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold font-serif">Support Center</h1>
                        <p className="text-muted-foreground mt-1">Have an issue or a question? Let us know.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Submit a New Complaint</CardTitle>
                                    <CardDescription>Fill out the form below to report an issue.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Issue with fee payment" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Please describe your issue in detail..." required rows={5} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex-col items-start gap-4">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            Submit Complaint
                                        </Button>
                                        {submitStatus.message && (
                                            <p className={`text-sm font-medium ${submitStatus.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                                                {submitStatus.message}
                                            </p>
                                        )}
                                    </CardFooter>
                                </form>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>My Complaint History</CardTitle>
                                    <CardDescription>Track the status of your submitted complaints.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {complaintsLoading ? (
                                        <div className="flex justify-center items-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : complaints && complaints.length > 0 ? (
                                        <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                                            {complaints.map(c => (
                                                <div key={c.id} className="p-4 rounded-xl border bg-background/50">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-semibold">{c.subject}</p>
                                                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${c.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                            {c.status === 'open' ? <Clock className="h-3 w-3"/> : <CheckCircle className="h-3 w-3"/>}
                                                            <span className="capitalize">{c.status}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-2">{c.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-3">Submitted: {formatDate(c.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 flex flex-col items-center">
                                            <LifeBuoy className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No Complaints Found</h3>
                                            <p className="text-muted-foreground mt-1">Your submitted complaints will appear here.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
