'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, query, where } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { School, Briefcase, Building2, Users, BookCopy, UserCheck, Award } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

interface Batch {
    id: string;
}

interface Enrollment {
    status: 'pending' | 'approved';
}


const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

export default function TeacherDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: batches, isLoading: batchesLoading } = useCollection<Batch>(batchesQuery);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const stats = useMemo(() => {
        if (!batches || !enrollments) return { totalBatches: 0, totalStudents: 0, pendingRequests: 0 };
        return {
            totalBatches: batches.length,
            totalStudents: enrollments.filter(e => e.status === 'approved').length,
            pendingRequests: enrollments.filter(e => e.status === 'pending').length,
        };
    }, [batches, enrollments]);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);


    const isLoading = isUserLoading || profileLoading || batchesLoading || enrollmentsLoading;
    const greeting = getGreeting();

    if (isLoading || !userProfile) {
        return (
             <div className="flex h-screen items-center justify-center flex-col gap-4">
                <School className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Preparing your dashboard...</p>
            </div>
        );
    }
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
            },
        }),
    };

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif">{greeting}, {userProfile?.name}! ☀️</h1>
                        <p className="text-muted-foreground mt-2">Manage your coaching, students, and more.</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
                        <p className="text-muted-foreground">A quick summary of your coaching activity.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                                <BookCopy className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalBatches}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                                {stats.pendingRequests > 0 && <p className="text-xs text-muted-foreground">Go to Coaching Management to review.</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="mb-8"
                    >
                        <Card className="rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Award className="h-6 w-6"/>
                                    Empower Students, Generate Income
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/90 pt-2">
                                    As a member of the Achievers Community, you can now connect with students to provide education and generate income. Create your batches and complete your profile to get started.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-primary-foreground/80">Thank you for joining our mission to make quality education accessible.</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Management</h2>
                        <p className="text-muted-foreground">Access your management portals.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            custom={0}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            whileHover={{ y: -5, scale: 1.05, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                            className="h-full"
                        >
                             <Link href="/dashboard/teacher/coaching" className="block h-full">
                                <Card className="flex flex-col items-center justify-start text-center p-4 h-full rounded-2xl shadow-lg hover:shadow-primary/10 transition-all duration-300">
                                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                                        <Briefcase className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-base">Coaching Management</h3>
                                    <p className="text-xs text-muted-foreground mt-1 flex-grow">Manage your batches and student enrollment requests.</p>
                                </Card>
                            </Link>
                        </motion.div>
                        <motion.div
                            custom={1}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            whileHover={{ y: -5, scale: 1.05, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                            className="h-full"
                        >
                            <Link href="/dashboard/teacher/school" className="block h-full">
                                <Card className="flex flex-col items-center justify-start text-center p-4 h-full rounded-2xl shadow-lg hover:shadow-primary/10 transition-all duration-300">
                                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-base">School Management</h3>
                                    <p className="text-xs text-muted-foreground mt-1 flex-grow">Integrate and manage school-related activities and data.</p>
                                </Card>
                            </Link>
                        </motion.div>
                    </div>
                    
                </div>
            </main>
        </div>
    );
}
