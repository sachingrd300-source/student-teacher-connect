'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, ShoppingCart } from 'lucide-react';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
}

export default function PlaceOrderPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
    
    const handleSendOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        const supportNumber = '919523496514';
        const orderMessage = `
--- New Material Order ---
Teacher Name: ${userProfile.name}
Material Required: ${material}
Quantity: ${quantity}
Description: ${description}
-----------------------
        `.trim();
        
        const whatsappUrl = `https://wa.me/${supportNumber}?text=${encodeURIComponent(orderMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <ShoppingCart className="h-16 w-16 animate-pulse text-primary" />
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
                            <CardDescription>Fill out the form below to request printed materials like DPPs, notes, or test papers. Your order will be sent via WhatsApp for confirmation.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSendOrder}>
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
                            <CardFooter>
                                 <Button type="submit" disabled={isSubmitting || !material || !quantity || !description}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Send Order via WhatsApp
                                 </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    )
}
