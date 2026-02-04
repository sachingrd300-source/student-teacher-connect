'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, addDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
}

interface TeacherOrder {
    id: string;
    teacherId: string;
    items: string;
    status: 'pending' | 'confirmed' | 'declined';
    notes?: string;
    createdAt: string;
    processedAt?: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function PlaceOrderPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderItems, setOrderItems] = useState('');
    const [submitMessage, setSubmitMessage] = useState('');

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const ordersQuery = useMemoFirebase(() => 
        (firestore && user) ? query(collection(firestore, 'teacherOrders'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [firestore, user]);
    const { data: pastOrders, isLoading: ordersLoading } = useCollection<TeacherOrder>(ordersQuery);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        } else if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router, userProfile]);

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !userProfile || !orderItems.trim()) return;
        
        setIsSubmitting(true);
        setSubmitMessage('');

        const orderData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            items: orderItems.trim(),
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
        };
        
        try {
            await addDoc(collection(firestore, 'teacherOrders'), orderData);
            setSubmitMessage('Order placed successfully!');
            setOrderItems('');
        } catch (error) {
            console.error("Error placing order:", error);
            setSubmitMessage('Failed to place order. Please try again.');
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                operation: 'create',
                path: 'teacherOrders',
                requestResourceData: orderData
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isUserLoading || profileLoading || ordersLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <ShoppingCart className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Order Page...</p>
            </div>
        );
    }
    
    const getStatusInfo = (status: TeacherOrder['status']) => {
        switch (status) {
            case 'confirmed':
                return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: "Confirmed", color: "text-green-600" };
            case 'declined':
                return { icon: <XCircle className="h-5 w-5 text-destructive" />, text: "Declined", color: "text-destructive" };
            default:
                return { icon: <Clock className="h-5 w-5 text-yellow-500" />, text: "Pending", color: "text-yellow-600" };
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/teacher/coaching')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold font-serif">Place an Order</h1>
                        <p className="text-muted-foreground mt-1">Request materials or view your past order history.</p>
                    </div>

                    <Tabs defaultValue="place_order" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="place_order">Place New Order</TabsTrigger>
                            <TabsTrigger value="order_history">Order History ({pastOrders?.length || 0})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="place_order" className="mt-6">
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>New Order Request</CardTitle>
                                    <CardDescription>Please list the items you need, being as specific as possible.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmitOrder}>
                                    <CardContent>
                                        <Textarea 
                                            value={orderItems} 
                                            onChange={(e) => setOrderItems(e.target.value)}
                                            placeholder="e.g., 'Class 10 Math Test Papers (Set of 5)', 'Physics Module for JEE'" 
                                            rows={5}
                                            required
                                        />
                                    </CardContent>
                                    <CardFooter className="flex-col items-start gap-4">
                                        <Button type="submit" disabled={isSubmitting || !orderItems.trim()}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            Place Order
                                        </Button>
                                        {submitMessage && <p className="text-sm font-medium">{submitMessage}</p>}
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                        <TabsContent value="order_history" className="mt-6">
                             <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>My Order History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {pastOrders && pastOrders.length > 0 ? (
                                        <div className="grid gap-4">
                                            {pastOrders.map(order => {
                                                const statusInfo = getStatusInfo(order.status);
                                                return (
                                                    <div key={order.id} className="p-4 rounded-lg border transition-colors hover:bg-accent">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-semibold flex-1 pr-4">{order.items}</p>
                                                            <div className={`flex items-center gap-2 text-sm font-semibold ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                                <span className="capitalize">{statusInfo.text}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2">Ordered on: {formatDate(order.createdAt)}</p>
                                                        {order.notes && (
                                                            <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                                                                <strong>Admin Note:</strong> {order.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">You have not placed any orders yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
