
'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { BookUser, CalendarCheck, ClipboardList, PlusCircle, Briefcase, Search, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// --- Interfaces for Data Models ---
interface Enrollment {
    id: string;
    classId: string;
    classTitle: string;
    classSubject: string;
    teacherId: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
    batchTime?: string;
}

interface ClassData {
    id: string;
    teacherId: string;
    teacherName: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
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

const EnrolledClassCard = ({ enrollment }: { enrollment: Enrollment }) => {
    const firestore = useFirestore();

    const teacherProfileRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', enrollment.teacherId);
    }, [firestore, enrollment.teacherId]);

    const { data: teacherProfile } = useDoc<{ mobileNumber?: string }>(teacherProfileRef);

    return (
        <Card key={enrollment.id}>
            <CardHeader>
                <CardTitle className="text-lg">{enrollment.classTitle}</CardTitle>
                <CardDescription>Taught by {enrollment.teacherName}</CardDescription>
                {teacherProfile?.mobileNumber && (
                    <CardDescription className="flex items-center gap-2 pt-2 text-foreground/90">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {teacherProfile.mobileNumber}
                    </CardDescription>
                )}
                 {enrollment.batchTime && (
                    <CardDescription className="pt-2 font-semibold text-foreground/90">{enrollment.batchTime}</CardDescription>
                )}
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
    );
};

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();

    const [classCode, setClassCode] = useState('');
    const [joinMessage, setJoinMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [tutorSearch, setTutorSearch] = useState('');
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string, mobileNumber?: string}>(userProfileRef);

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
        if (!firestore) return null;
        return query(collection(firestore, 'publicTutors'));
    }, [firestore]);
    const { data: tutors, isLoading: tutorsLoading } = useCollection<TutorProfile>(tutorsQuery);

    const filteredTutors = useMemo(() => {
        if (!tutors) return [];
        if (!tutorSearch) return tutors;

        const searchTerm = tutorSearch.toLowerCase();
        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(searchTerm) ||
            (tutor.address && tutor.address.toLowerCase().includes(searchTerm)) ||
            (tutor.coachingName && tutor.coachingName.toLowerCase().includes(searchTerm)) ||
            (tutor.subjects && tutor.subjects.join(', ').toLowerCase().includes(searchTerm))
        );
    }, [tutors, tutorSearch]);

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


    const handleJoinClass = async () => {
        if (!classCode.trim() || !firestore || !user || !userProfile) return;

        setIsJoining(true);
        setJoinMessage(null);

        const classesRef = collection(firestore, 'classes');
        const q = query(classesRef, where('classCode', '==', classCode.trim().toUpperCase()), limit(1));
        const classSnapshot = await getDocs(q);

        if (classSnapshot.empty) {
            setJoinMessage({ type: 'error', text: 'Invalid Class Code. Please check the code and try again.' });
            setIsJoining(false);
            return;
        }

        const classDoc = classSnapshot.docs[0];
        const classData = classDoc.data() as ClassData;

        const enrollmentsRef = collection(firestore, 'enrollments');
        const enrollQuery = query(enrollmentsRef, where('studentId', '==', user.uid), where('classId', '==', classDoc.id));
        const enrollSnapshot = await getDocs(enrollQuery);

        if (!enrollSnapshot.empty) {
            setJoinMessage({ type: 'error', text: 'You have already sent a request or are enrolled in this class.' });
            setIsJoining(false);
            return;
        }
        
        const enrollmentData = {
            studentId: user.uid,
            studentName: userProfile.name,
            mobileNumber: userProfile.mobileNumber ?? '',
            classId: classDoc.id,
            teacherId: classData.teacherId,
            classTitle: classData.title,
            classSubject: classData.subject,
            teacherName: classData.teacherName,
            batchTime: classData.batchTime,
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: serverTimestamp(),
        };
        
        addDocumentNonBlocking(enrollmentsRef, enrollmentData);
        
        setJoinMessage({ type: 'success', text: `Enrollment request sent for ${classData.title}!` });
        setClassCode('');
        setIsJoining(false);
    };

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

                    {/* --- Join a Class Section --- */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Join a New Class</CardTitle>
                            <CardDescription>Enter the class code provided by your teacher to request enrollment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                                <Input
                                    placeholder="Enter Class Code"
                                    value={classCode}
                                    onChange={(e) => setClassCode(e.target.value)}
                                    className="uppercase"
                                />
                                <Button onClick={handleJoinClass} disabled={isJoining || !classCode.trim()} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> 
                                    {isJoining ? 'Sending...' : 'Send Request'}
                                </Button>
                            </div>
                            {joinMessage && (
                                <p className={`text-sm mt-3 font-semibold ${joinMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                                    {joinMessage.text}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* --- My Classes Section --- */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>My Classes</CardTitle>
                            <CardDescription>Here are the classes you are enrolled in or have requested to join.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollmentsLoading && <p>Loading your classes...</p>}
                            {enrollments && enrollments.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {enrollments.map((enrollment) => (
                                        <EnrolledClassCard key={enrollment.id} enrollment={enrollment} />
                                    ))}
                                </div>
                            ) : (
                                !enrollmentsLoading && <p className="text-center text-muted-foreground py-8">You haven't been enrolled in any classes yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- Find a Teacher Section --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Find a Teacher</CardTitle>
                            <CardDescription>Browse available tutors on the platform or search by name, subject, or location.</CardDescription>
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
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredTutors.map((tutor) => (
                                        <Card key={tutor.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle>{tutor.name}</CardTitle>
                                                {tutor.coachingName && 
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        <CardDescription>{tutor.coachingName}</CardDescription>
                                                    </div>
                                                }
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
                                                  <Button className="w-full" variant="secondary">View Profile</Button>
                                               </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !tutorsLoading && <p className="text-center text-muted-foreground py-8">No tutors found matching your search.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

    

    

    