'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, orderBy, query, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Check, X, ArrowLeft } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface UserProfileForHeader { name: string; role: 'admin'; }

interface HomeTutorApplication {
    id: string;
    teacherId: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'rejected';
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

export default function AdminApplicationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfileForHeader>(userProfileRef);

    const homeTutorApplicationsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'homeTutorApplications'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
    const { data: homeTutorApplications, isLoading: applicationsLoading } = useCollection<HomeTutorApplication>(homeTutorApplicationsQuery);
    
    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user || userProfile?.role !== 'admin') {
            router.replace('/login');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    const handleApplication = async (application: HomeTutorApplication, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
    
        const batch = writeBatch(firestore);
    
        const applicationRef = doc(firestore, 'homeTutorApplications', application.id);
        batch.update(applicationRef, { status: newStatus, processedAt: new Date().toISOString() });
    
        const teacherRef = doc(firestore, 'users', application.teacherId);
        if (newStatus === 'approved') {
            batch.update(teacherRef, { isHomeTutor: true });
        } else { // on rejected
            batch.update(teacherRef, { isHomeTutor: false });
        }
        
        try {
            await batch.commit();
        } catch (error) {
            console.error(`Error ${newStatus === 'approved' ? 'approving' : 'rejecting'} application:`, error);
        }
    };

    const filteredApplications = useMemo(() => {
        if (!homeTutorApplications) return { pending: [], approved: [], rejected: [] };
        return {
            pending: homeTutorApplications.filter(a => a.status === 'pending'),
            approved: homeTutorApplications.filter(a => a.status === 'approved'),
            rejected: homeTutorApplications.filter(a => a.status === 'rejected'),
        }
    }, [homeTutorApplications]);


    const isLoading = isUserLoading || profileLoading || applicationsLoading;

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <Briefcase className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Applications...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <Button variant="ghost" onClick={() => router.push('/dashboard/admin')} className="justify-self-start">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Admin Dashboard
                    </Button>
                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Briefcase className="mr-3 h-6 w-6 text-primary"/> Home Tutor Applications</CardTitle>
                            <CardDescription>Review and manage applications from teachers wanting to become home tutors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="pending">Pending ({filteredApplications.pending.length})</TabsTrigger>
                                    <TabsTrigger value="approved">Approved ({filteredApplications.approved.length})</TabsTrigger>
                                    <TabsTrigger value="rejected">Rejected ({filteredApplications.rejected.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pending" className="mt-4">
                                     {filteredApplications.pending.length > 0 ? (
                                        <div className="grid gap-4">
                                            {filteredApplications.pending.map(app => (
                                                <div key={app.id} className="flex flex-col sm:flex-row items-start justify-between gap-3 p-3 rounded-lg border bg-background">
                                                    <div>
                                                        <p className="font-semibold">{app.teacherName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Applied: {formatDate(app.createdAt)}</p>
                                                    </div>
                                                    <div className="flex gap-2 self-end sm:self-center">
                                                        <Button size="sm" variant="outline" onClick={() => handleApplication(app, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleApplication(app, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                         <p className="text-center text-muted-foreground py-8">No pending applications.</p>
                                     )}
                                </TabsContent>
                                <TabsContent value="approved" className="mt-4">
                                    {filteredApplications.approved.length > 0 ? (
                                        <div className="grid gap-4">
                                            {filteredApplications.approved.map(app => (
                                                <div key={app.id} className="p-3 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center">
                                                    <div>
                                                        <p className="font-semibold">{app.teacherName}</p>
                                                        {app.processedAt && <p className="text-xs text-muted-foreground">Approved: {formatDate(app.processedAt)}</p>}
                                                    </div>
                                                    <span className="text-sm font-medium text-green-600 self-end sm:self-center">Approved</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">No approved applications.</p>
                                    )}
                                </TabsContent>
                                <TabsContent value="rejected" className="mt-4">
                                     {filteredApplications.rejected.length > 0 ? (
                                        <div className="grid gap-4">
                                            {filteredApplications.rejected.map(app => (
                                                 <div key={app.id} className="p-3 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center">
                                                    <div>
                                                        <p className="font-semibold">{app.teacherName}</p>
                                                        {app.processedAt && <p className="text-xs text-muted-foreground">Rejected: {formatDate(app.processedAt)}</p>}
                                                    </div>
                                                    <span className="text-sm font-medium text-destructive self-end sm:self-center">Rejected</span>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                         <p className="text-center text-muted-foreground py-8">No rejected applications.</p>
                                     )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
