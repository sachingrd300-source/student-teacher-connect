
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp, orderBy } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

interface Enrollment {
    id: string;
    classId: string;
}

interface Announcement {
    id: string;
    classId: string;
    teacherName: string;
    classTitle: string;
    content: string;
    createdAt: Timestamp;
}


export default function StudentAnnouncementsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
    
    const enrolledClassIds = useMemo(() => {
        return enrollments?.map(e => e.classId) || [];
    }, [enrollments]);

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore || enrolledClassIds.length === 0) return null;
        // Firestore 'in' queries are limited to 30 items. For more, you'd need a different data model.
        return query(collection(firestore, 'announcements'), where('classId', 'in', enrolledClassIds), orderBy('createdAt', 'desc'));
    }, [firestore, enrolledClassIds]);

    const { data: announcements, isLoading: announcementsLoading } = useCollection<Announcement>(announcementsQuery);

    const isLoading = enrollmentsLoading || announcementsLoading;

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="flex items-center gap-4 mb-6">
                        <Megaphone className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Announcements</h1>
                    </div>
                     <Card>
                         <CardHeader>
                            <CardTitle>Recent Updates</CardTitle>
                            <CardDescription>Here are the latest announcements from all your classes.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             {isLoading && <p>Loading announcements...</p>}
                             {!isLoading && announcements && announcements.length > 0 ? (
                                <div className="space-y-6">
                                   {announcements.map(announcement => (
                                        <div key={announcement.id} className="border-b last:border-0 pb-6">
                                            <p className="font-semibold text-primary">{announcement.classTitle}</p>
                                            <p className="text-sm text-muted-foreground mb-2">by {announcement.teacherName}</p>
                                            <p className="text-foreground/90">{announcement.content}</p>
                                            <p className="text-xs text-muted-foreground mt-3">
                                                {new Date(announcement.createdAt.seconds * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                   ))}
                                </div>
                             ) : (
                                !isLoading && (
                                    <p className="p-8 text-center text-muted-foreground">
                                        You have no announcements right now.
                                    </p>
                                )
                             )}
                         </CardContent>
                     </Card>
                </div>
            </main>
        </div>
    );
}
