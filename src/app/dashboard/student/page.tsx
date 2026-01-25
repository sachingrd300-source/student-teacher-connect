'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { BookUser, MapPin, CalendarCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Interfaces for Data Models ---
interface Enrollment {
    id: string;
    classId: string;
    classTitle: string;
    classSubject: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
}

interface TutorProfile {
    id: string;
    name: string;
    subjects?: string[];
    address?: string;
    coachingName?: string;
}

interface Attendance {
    id: string;
    classId: string;
    records: {
        [studentId: string]: boolean;
    };
}

interface Test {
    id: string;
    classId: string;
}

interface TestResult {
    id: string;
    testId: string;
}

// --- StatCard Component ---
const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();
    
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

    // --- Data Fetching for Dashboard ---

    // 1. Enrollments
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!isStudent || !firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user, isStudent]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
    
    const enrolledClassIds = useMemo(() => enrollments?.map(e => e.classId) || [], [enrollments]);

    // 2. Attendance
    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || enrolledClassIds.length === 0) return null;
        return query(collection(firestore, 'attendance'), where('classId', 'in', enrolledClassIds));
    }, [firestore, enrolledClassIds]);
    const { data: attendanceRecords, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);

    // 3. Tests & Results
    const testsQuery = useMemoFirebase(() => {
        if (!firestore || enrolledClassIds.length === 0) return null;
        return query(collection(firestore, 'tests'), where('classId', 'in', enrolledClassIds));
    }, [firestore, enrolledClassIds]);
    const { data: tests, isLoading: testsLoading } = useCollection<Test>(testsQuery);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'testResults'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: results, isLoading: resultsLoading } = useCollection<TestResult>(resultsQuery);

    // 4. Tutors (for "Find a Teacher")
    const tutorsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'tutor'));
    }, [firestore, user]);
    const { data: tutors, isLoading: tutorsLoading } = useCollection<TutorProfile>(tutorsQuery);

    // --- Stat Calculations ---
    const overallAttendance = useMemo(() => {
        if (!attendanceRecords || !user || attendanceRecords.length === 0) return { percentage: 0 };
        let present = 0;
        let absent = 0;
        attendanceRecords.forEach(record => {
            if (record.records && typeof record.records === 'object' && record.records.hasOwnProperty(user.uid)) {
                if (record.records[user.uid]) {
                    present++;
                } else {
                    absent++;
                }
            }
        });
        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { percentage };
    }, [attendanceRecords, user]);

    const pendingTests = useMemo(() => {
        if (!tests || !results) return 0;
        const takenTestIds = new Set(results.map(r => r.testId));
        return tests.filter(test => !takenTestIds.has(test.id)).length;
    }, [tests, results]);


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
                <DashboardHeader userName={userProfile.name} userRole="tutor" />
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
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
                    
                    {/* --- Stats Section --- */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <StatCard
                            title="Enrolled Classes"
                            value={enrollments?.length ?? 0}
                            icon={<BookUser className="h-4 w-4" />}
                            isLoading={enrollmentsLoading}
                        />
                        <StatCard
                            title="Overall Attendance"
                            value={`${overallAttendance.percentage}%`}
                            icon={<CalendarCheck className="h-4 w-4" />}
                            isLoading={attendanceLoading}
                        />
                        <StatCard
                            title="Pending Tests"
                            value={pendingTests}
                            icon={<ClipboardList className="h-4 w-4" />}
                            isLoading={testsLoading || resultsLoading}
                        />
                    </div>
                    
                    {/* --- My Classes Section --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Classes</CardTitle>
                            <CardDescription>Here are the classes you are enrolled in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollmentsLoading && <p>Loading your classes...</p>}
                            {enrollments && enrollments.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {enrollments.map((enrollment) => (
                                        <Card key={enrollment.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{enrollment.classTitle}</CardTitle>
                                                <CardDescription>Taught by {enrollment.teacherName}</CardDescription>
                                            </CardHeader>
                                            <CardFooter>
                                                <div className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${
                                                    enrollment.status === 'approved' ? 'bg-success/10 text-success' :
                                                    enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-destructive/10 text-destructive'
                                                }`}>
                                                    {enrollment.status}
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !enrollmentsLoading && <p className="text-center text-muted-foreground py-8">You haven't been enrolled in any classes yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- Find a Teacher Section --- */}
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Find a Teacher</CardTitle>
                            <CardDescription>Browse available tutors on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tutorsLoading && <p>Loading tutors...</p>}
                            {tutors && tutors.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {tutors.map((tutor) => (
                                        <Card key={tutor.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle>{tutor.name}</CardTitle>
                                                {tutor.coachingName && <CardDescription>{tutor.coachingName}</CardDescription>}
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
                                               <Button className="w-full" variant="secondary" disabled>View Profile</Button> 
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !tutorsLoading && <p className="text-center text-muted-foreground py-8">No tutors are currently listed.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
