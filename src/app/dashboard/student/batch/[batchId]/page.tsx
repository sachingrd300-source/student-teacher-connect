'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Download, Clock, Calendar, ListCollapse } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { useEffect } from 'react';

interface UserProfile {
    name: string;
}

interface Batch {
    id: string;
    name: string;
    teacherId: string;
    teacherName: string;
    approvedStudents: string[];
}

interface StudyMaterial {
    id: string;
    title: string;
    fileURL: string;
    fileName: string;
    createdAt: string;
}

interface ClassSchedule {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    status?: 'scheduled' | 'cancelled';
}

interface Activity {
    id: string;
    message: string;
    createdAt: string;
}


const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};


export default function StudentBatchPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const batchId = params.batchId as string;

    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    const batchRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return doc(firestore, 'batches', batchId);
    }, [firestore, batchId]);
    const { data: batch, isLoading: batchLoading } = useDoc<Batch>(batchRef);
    
    const materialsRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return collection(firestore, 'batches', batchId, 'materials');
    }, [firestore, batchId]);
    const { data: materials, isLoading: materialsLoading } = useCollection<StudyMaterial>(materialsRef);

    const classesRef = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return collection(firestore, 'batches', batchId, 'classes');
    }, [firestore, batchId]);
    const { data: classes, isLoading: classesLoading } = useCollection<ClassSchedule>(classesRef);
    
    const activityQuery = useMemoFirebase(() => {
        if (!firestore || !batchId) return null;
        return query(collection(firestore, 'batches', batchId, 'activity'), orderBy('createdAt', 'desc'));
    }, [firestore, batchId]);
    const { data: activities, isLoading: activitiesLoading } = useCollection<Activity>(activityQuery);


    // Security check
    const isEnrolled = batch?.approvedStudents?.includes(user?.uid ?? '');
    const isLoading = isUserLoading || batchLoading || materialsLoading || classesLoading || activitiesLoading;

    useEffect(() => {
        // If done loading and not enrolled, or no batch found, redirect
        if (!isLoading && (!batch || !isEnrolled)) {
            router.replace('/dashboard/student');
        }
    }, [isLoading, batch, isEnrolled, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // If done loading and not enrolled, or no batch found, show redirecting message
    if (!batch || !isEnrolled) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>Access Denied. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={currentUserProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                     <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card className="mb-8">
                             <CardHeader>
                                <CardTitle className="text-2xl font-serif">{batch?.name}</CardTitle>
                                <CardDescription>Taught by <Link href={`/teachers/${batch?.teacherId}`} className="text-primary hover:underline">{batch?.teacherName}</Link></CardDescription>
                            </CardHeader>
                        </Card>

                         <Tabs defaultValue="materials" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="materials">Study Materials ({materials?.length || 0})</TabsTrigger>
                                <TabsTrigger value="schedules">Class Schedules ({classes?.length || 0})</TabsTrigger>
                                <TabsTrigger value="activity">Recent Activity ({activities?.length || 0})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="materials" className="mt-6">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <FileText className="mr-2 h-5 w-5 text-primary"/> Study Materials
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {materials && materials.length > 0 ? (
                                            materials.map(material => (
                                                <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                    <div>
                                                        <p className="font-semibold">{material.title}</p>
                                                        <p className="text-xs text-muted-foreground">Uploaded: {formatDate(material.createdAt)}</p>
                                                    </div>
                                                    <Button asChild size="sm">
                                                        <a href={material.fileURL} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" /> Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">No study materials uploaded yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="schedules" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="mr-2 h-5 w-5 text-primary" /> Class Schedules
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {classes && classes.length > 0 ? (
                                            classes.map(c => (
                                                <div key={c.id} className="p-3 rounded-lg border bg-background relative overflow-hidden">
                                                    {c.status === 'cancelled' && (
                                                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                                                            CANCELLED
                                                        </div>
                                                    )}
                                                    <p className={`font-semibold ${c.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>{c.title}</p>
                                                    {c.description && <p className="text-sm text-muted-foreground my-1">{c.description}</p>}
                                                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatDate(c.startTime)}</span>
                                                        </div>
                                                        <span>-</span>
                                                        <div className="flex items-center gap-1">
                                                            <span>{formatDate(c.endTime)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">No classes scheduled yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="activity" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <ListCollapse className="mr-2 h-5 w-5 text-primary"/> Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {activities && activities.length > 0 ? (
                                            activities.map(activity => (
                                                <div key={activity.id} className="p-3 rounded-lg border bg-background">
                                                    <p className="font-medium">{activity.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">No recent activity in this batch.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
