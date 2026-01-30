'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trophy, Medal, Award, School, Users } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

// Interfaces
interface LeaderboardUser {
    id: string;
    name: string;
    coins: number;
    role: 'student';
}

interface UserProfile {
    name?: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400 fill-gray-300" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-700 fill-amber-600" />;
    return <span className="font-bold text-lg w-6 text-center">{rank}</span>;
};

export default function LeaderboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Fetch current user's profile for header
    const currentUserProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: currentUserProfile, isLoading: profileLoading } = useDoc<UserProfile>(currentUserProfileRef);

    // Fetch top 10 students by coins
    const leaderboardQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'student'),
            orderBy('coins', 'desc'),
            limit(10)
        );
    }, [firestore]);
    const { data: leaderboard, isLoading: leaderboardLoading } = useCollection<LeaderboardUser>(leaderboardQuery);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
        } else if (currentUserProfile && currentUserProfile.role !== 'student') {
            router.replace('/dashboard');
        }
    }, [user, currentUserProfile, isUserLoading, profileLoading, router]);

    const isLoading = isUserLoading || profileLoading || leaderboardLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Leaderboard...</p>
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
            <DashboardHeader userProfile={currentUserProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-4xl mx-auto grid gap-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Card className="rounded-2xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center text-2xl font-serif">
                                    <Trophy className="mr-3 h-6 w-6 text-primary"/> Student Leaderboard
                                </CardTitle>
                                <p className="text-muted-foreground">See who's at the top based on coins earned!</p>
                            </CardHeader>
                            <CardContent>
                                {leaderboard && leaderboard.length > 0 ? (
                                    <motion.div 
                                        className="grid gap-3"
                                        initial="hidden"
                                        animate="visible"
                                        variants={{
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.1
                                                }
                                            }
                                        }}
                                    >
                                        {leaderboard.map((student, index) => (
                                            <motion.div 
                                                key={student.id} 
                                                variants={cardVariants} 
                                                custom={index}
                                                className="flex items-center p-3 rounded-lg border bg-background transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-4 w-1/6">
                                                    <RankIcon rank={index + 1} />
                                                </div>
                                                <div className="flex items-center gap-4 flex-1">
                                                     <Avatar className="h-10 w-10">
                                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold">{student.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 font-bold text-lg text-primary">
                                                    <span role="img" aria-label="Coins">🪙</span>
                                                    <span>{student.coins || 0}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-semibold">Leaderboard is Empty</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Start earning coins to get on the board!
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
