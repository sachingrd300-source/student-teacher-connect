'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
}

export default function PlaceOrderPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

    // Form state
    const [material, setMaterial] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        } else if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router, userProfile]);
    
    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile) return;

        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            await addDoc(collection(firestore, 'orders'), {
                teacherId: user.uid,
                teacherName: userProfile.name,
                material: material.trim(),
                quantity: quantity.trim(),
                description: description.trim(),
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            setSubmitStatus({ type: 'success', message: 'Your order has been placed! The admin will review it shortly.' });
            setMaterial('');
            setQuantity('');
            setDescription('');

        } catch (error) {
            console.error("Error placing order:", error);
            setSubmitStatus({ type: 'error', message: 'Failed to place order. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Image src="/logo.png" alt="Achiever's Community Logo" width={80} height={80} className="animate-pulse rounded-full" />
                <p className="text-muted-foreground">Loading Order Form...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => router.push('/dashboard/teacher/coaching')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                     <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle>Place a Material Order</CardTitle>
                            <CardDescription>Fill out the form below to request printed materials like DPPs, notes, or test papers. The admin will review your order.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handlePlaceOrder}>
                            <CardContent className="grid gap-6">
                               <div className="grid gap-2">
                                    <Label htmlFor="material">Material Required</Label>
                                    <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g., DPP Sheets, Test Papers" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 50 copies" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Brief Description</Label>
                                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide any other details, like subject, topic, or specific instructions." required />
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4">
                                 <Button type="submit" disabled={isSubmitting || !material || !quantity || !description}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Place Order
                                 </Button>
                                {submitStatus.message && (
                                    <p className={`text-sm font-medium ${submitStatus.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                                        {submitStatus.message}
                                    </p>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    )
}
