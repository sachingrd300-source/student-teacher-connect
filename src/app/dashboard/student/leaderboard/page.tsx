'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Medal, Award as AwardIcon, Users, Shield, Gem, Rocket, Star, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Types and Interfaces ---
type BadgeIconType = 'award' | 'shield' | 'gem' | 'rocket' | 'star';

interface LeaderboardUser {
    id: string;
    name: string;
    coins: number;
    role: 'student';
    equippedBadgeIcon?: BadgeIconType;
}

// --- Helper Components ---
const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const badgeIcons: Record<BadgeIconType, React.ReactNode> = {
    award: <AwardIcon className="h-4 w-4 text-yellow-500" />,
    shield: <Shield className="h-4 w-4 text-blue-500" />,
    gem: <Gem className="h-4 w-4 text-emerald-500" />,
    rocket: <Rocket className="h-4 w-4 text-rose-500" />,
    star: <Star className="h-4 w-4 text-amber-500" />,
};

const BadgeIcon = ({ iconName }: { iconName?: BadgeIconType }) => {
    if (!iconName || !badgeIcons[iconName]) return null;
    return <div className="ml-1.5" title={iconName}>{badgeIcons[iconName]}</div>;
};

// --- Main Component ---
export default function LeaderboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch top 10 students for the leaderboard
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

    const isLoading = leaderboardLoading;

    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <Trophy className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Leaderboard...</p>
            </div>
        );
    }

    const topThree = leaderboard?.slice(0, 3) || [];
    const others = leaderboard?.slice(3) || [];

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
            },
        }),
    };

    const RankPodium = ({ student, rank }: { student: LeaderboardUser; rank: number }) => {
        const rankInfo = {
            1: { icon: <Trophy className="h-8 w-8 text-yellow-400" />, color: "bg-yellow-400/10 border-yellow-500", shadow: "shadow-yellow-500/20" },
            2: { icon: <Medal className="h-8 w-8 text-gray-400" />, color: "bg-gray-400/10 border-gray-500", shadow: "shadow-gray-500/20" },
            3: { icon: <AwardIcon className="h-8 w-8 text-amber-600" />, color: "bg-amber-600/10 border-amber-700", shadow: "shadow-amber-600/20" },
        }[rank] || {};

        return (
            <motion.div
                variants={cardVariants}
                custom={rank}
                className={cn(
                    "flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-300",
                    rankInfo.color,
                    rank === 1 ? 'lg:mt-0 mt-8' : 'lg:mt-8',
                    `hover:shadow-2xl hover:-translate-y-2 ${rankInfo.shadow}`
                )}
            >
                <div className="relative">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-background">
                        <AvatarFallback className="text-3xl">{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                     <div className="absolute -top-2 -right-2 p-2 bg-background rounded-full shadow-md">
                        {rankInfo.icon}
                    </div>
                </div>
                <p className="font-bold text-lg flex items-center">
                    {student.name}
                    <BadgeIcon iconName={student.equippedBadgeIcon} />
                </p>
                <p className="text-2xl font-bold text-primary flex items-center gap-2 mt-2">
                    <span role="img" aria-label="Coins">🪙</span>
                    {student.coins || 0}
                </p>
            </motion.div>
        );
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="max-w-4xl mx-auto grid gap-8"
        >
            <motion.div variants={cardVariants}>
                <Card className="rounded-2xl shadow-lg border-none bg-transparent">
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-bold tracking-tighter sm:text-5xl font-serif flex items-center justify-center">
                            <Trophy className="mr-4 h-10 w-10 text-primary"/> Student Leaderboard
                        </CardTitle>
                        <CardDescription className="mt-3 text-muted-foreground md:text-lg">
                            See who's at the top based on coins earned!
                        </CardDescription>
                    </CardHeader>
                </Card>
            </motion.div>

            {leaderboard && leaderboard.length > 0 ? (
                <>
                    {/* Top 3 Podium */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                        {topThree[1] && <RankPodium student={topThree[1]} rank={2} />}
                        {topThree[0] && <RankPodium student={topThree[0]} rank={1} />}
                        {topThree[2] && <RankPodium student={topThree[2]} rank={3} />}
                    </div>
                    
                    {/* Ranks 4-10 */}
                    {others.length > 0 && (
                        <motion.div variants={cardVariants}>
                            <Card className="rounded-2xl shadow-lg">
                                <CardContent className="p-4">
                                     <div className="grid gap-2">
                                        {others.map((student, index) => (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                                className={cn(
                                                    "flex items-center p-3 rounded-lg transition-colors hover:bg-muted/50",
                                                    user?.uid === student.id && "bg-primary/10 border-l-4 border-primary"
                                                )}
                                            >
                                                <div className="w-12 text-center font-bold text-muted-foreground text-lg">{index + 4}</div>
                                                <Avatar className="h-10 w-10 mx-4">
                                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-semibold flex-grow flex items-center">
                                                    {student.name}
                                                    <BadgeIcon iconName={student.equippedBadgeIcon} />
                                                </p>
                                                <div className="flex items-center gap-2 font-bold text-lg text-primary">
                                                    <span role="img" aria-label="Coins">🪙</span>
                                                    <span>{student.coins || 0}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </>
            ) : (
                <motion.div variants={cardVariants}>
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="text-center py-24">
                            <Users className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h3 className="mt-6 text-xl font-semibold">Leaderboard is Empty</h3>
                            <p className="mt-2 text-muted-foreground">
                                Start earning coins to get on the board!
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
