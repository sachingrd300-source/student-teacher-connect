'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { BookUser, Search, MapPin, Clock, UserCheck, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface Connection {
    id: string;
    teacherId: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
}

interface TutorProfile {
    id: string;
    name: string;
    subjects?: string[];
    address?: string;
}

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    const [tutorSearch, setTutorSearch] = useState('');
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string}>(userProfileRef);

    const isStudent = userProfile?.role === 'student';

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && !isStudent) {
            router.replace('/dashboard/teacher');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isStudent, router]);

    // --- Data Fetching ---

    // 1. My connections to teachers
    const connectionsQuery = useMemoFirebase(() => {
        if (!isStudent || !firestore || !user) return null;
        return query(collection(firestore, 'connections'), where('studentId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user, isStudent]);
    const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

    const approvedConnections = useMemo(() => connections?.filter(c => c.status === 'approved') || [], [connections]);
    const pendingConnections = useMemo(() => connections?.filter(c => c.status === 'pending') || [], [connections]);

    // 2. All Tutors (for "Find a Teacher")
    const tutorsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'tutor'), where('status', '==', 'approved'));
    }, [firestore]);
    const { data: tutors, isLoading: tutorsLoading } = useCollection<TutorProfile>(tutorsQuery);

    const filteredTutors = useMemo(() => {
        if (!tutors) return [];
        if (!tutorSearch) return tutors.slice(0, 6); // Show first 6 by default

        const searchTerm = tutorSearch.toLowerCase();
        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(searchTerm) ||
            (tutor.address && tutor.address.toLowerCase().includes(searchTerm)) ||
            (tutor.subjects && tutor.subjects.join(', ').toLowerCase().includes(searchTerm))
        );
    }, [tutors, tutorSearch]);

    // --- Loading and Auth checks ---
    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading student dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isStudent) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile.name} userRole={userProfile.role} />
                <div className="flex-1 flex items-center justify-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="student" />
            <main className="flex-1 animate-fade-in-down">
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <h1 className="text-3xl font-bold">Student Dashboard</h1>
                    
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Find a Teacher</CardTitle>
                                    <CardDescription>Browse available tutors or search by name, subject, or location.</CardDescription>
                                    <div className="pt-4">
                                        <Label htmlFor="tutor-search" className="sr-only">Search Tutors</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="tutor-search"
                                                placeholder="Search by name, subject, location..."
                                                className="pl-10"
                                                value={tutorSearch}
                                                onChange={e => setTutorSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {tutorsLoading && <p>Loading tutors...</p>}
                                    {filteredTutors && filteredTutors.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {filteredTutors.map((tutor) => (
                                                <Card key={tutor.id} className="flex flex-col">
                                                    <CardHeader className="flex-1">
                                                        <CardTitle>{tutor.name}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3 text-sm flex-1">
                                                        {tutor.subjects && tutor.subjects.length > 0 && (
                                                            <div className="flex items-start gap-2">
                                                                <BookUser className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                <span>{tutor.subjects.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {tutor.address && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                <span>{tutor.address}</span>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                    <CardFooter>
                                                    <Link href={`/dashboard/profile/${tutor.id}`} className="w-full">
                                                        <Button className="w-full" variant="secondary">View Profile & Connect</Button>
                                                    </Link>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        !tutorsLoading && <p className="text-center text-muted-foreground py-8">No tutors found matching your search.</p>
                                    )}
                                    {!tutorSearch && tutors && tutors.length > 6 && (
                                        <div className="text-center mt-6">
                                            <Link href="/tutors"><Button>Browse All Tutors</Button></Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><UserCheck /> My Teachers</CardTitle>
                                    <CardDescription>Teachers you are connected with.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {connectionsLoading && <p>Loading...</p>}
                                    {!connectionsLoading && approvedConnections.length > 0 ? (
                                        <div className="space-y-3">
                                            {approvedConnections.map(conn => (
                                                <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <p className="font-semibold">{conn.teacherName}</p>
                                                    <Link href={`/dashboard/profile/${conn.teacherId}`}><Button variant="ghost" size="sm">View</Button></Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !connectionsLoading && <p className="text-sm text-center text-muted-foreground">You are not connected with any teachers yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Clock /> Pending Requests</CardTitle>
                                    <CardDescription>Connection requests you've sent.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {connectionsLoading && <p>Loading...</p>}
                                    {!connectionsLoading && pendingConnections.length > 0 ? (
                                        <div className="space-y-3">
                                            {pendingConnections.map(conn => (
                                                <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <p className="font-semibold">{conn.teacherName}</p>
                                                    <p className="text-sm text-muted-foreground">Pending</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !connectionsLoading && <p className="text-sm text-center text-muted-foreground">You have no pending requests.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
