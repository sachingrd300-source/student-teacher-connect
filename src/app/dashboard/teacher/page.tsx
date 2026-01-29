'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card } from '@/components/ui/card';
import { School, Briefcase, Building2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';


interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
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


    const isLoading = isUserLoading || profileLoading;
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
