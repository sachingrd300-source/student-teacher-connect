'use client';

import { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash, Home, ArrowLeft, School } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

// --- Interfaces ---
interface UserProfileForHeader { name: string; role: 'admin'; }
interface HomeBooking { id: string; studentName: string; fatherName?: string; mobileNumber: string; address: string; studentClass: string; status: 'Pending' | 'Assigned' | 'Completed' | 'Cancelled'; createdAt: string; assignedTeacherId?: string; }

// --- Helper Functions ---
const formatDate = (dateString: string, withTime: boolean = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleString('en-US', options);
};

// --- Main Component ---
export default function AdminBookingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const homeBookingsQuery = useMemoFirebase(() => (firestore && userProfile?.role === 'admin') ? query(collection(firestore, 'homeBookings'), orderBy('createdAt', 'desc')) : null, [firestore, userProfile?.role]);
    const { data: homeBookings, isLoading: bookingsLoading } = useCollection<HomeBooking>(homeBookingsQuery);
    
    const userRole = userProfile?.role;
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userRole !== 'admin') {
            router.replace('/login');
        }
    }, [user, userRole, isUserLoading, profileLoading, router]);

    const handleDeleteBooking = (bookingId: string) => {
        if (!firestore) return;
        const bookingDocRef = doc(firestore, 'homeBookings', bookingId);
        deleteDoc(bookingDocRef).catch(error => errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'delete', path: bookingDocRef.path })));
    };

    const isLoading = isUserLoading || profileLoading || bookingsLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Booking Management...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                 <div className="max-w-4xl mx-auto grid gap-8">
                     <Button asChild variant="ghost" className="justify-self-start">
                        <Link href="/dashboard/admin">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Admin Dashboard
                        </Link>
                    </Button>
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Home className="mr-3 h-6 w-6 text-primary"/> Home Teacher Bookings</CardTitle>
                            <CardDescription>Review and manage home teacher requests from students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {homeBookings && homeBookings.length > 0 ? (
                                    homeBookings.map(booking => (
                                        <div key={booking.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-lg border bg-background">
                                            <div className="grid gap-2 w-full"><p className="font-semibold">{booking.studentName} - <span className="font-normal text-muted-foreground">{booking.studentClass}</span></p><p className="text-sm text-muted-foreground">Father: {booking.fatherName || 'N/A'}</p><p className="text-sm text-muted-foreground">Contact: {booking.mobileNumber}</p><p className="text-sm text-muted-foreground">Address: {booking.address}</p><div className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><span>Status:</span><span className={`font-semibold ${booking.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>{booking.status}</span><span>|</span><span>Created: {formatDate(booking.createdAt, true)}</span></div></div>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteBooking(booking.id)} className="self-end sm:self-center flex-shrink-0 mt-2 sm:mt-0"><Trash className="mr-2 h-4 w-4" />Delete</Button>
                                        </div>
                                    ))
                                ) : (<div className="text-center py-12 flex flex-col items-center"><Home className="h-12 w-12 text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">No Home Teacher Bookings</h3><p className="text-muted-foreground mt-1">New student requests will appear here.</p></div>)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
