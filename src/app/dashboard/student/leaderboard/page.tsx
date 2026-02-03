
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award as AwardIcon, School, Users, Shield, Gem, Rocket, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

type BadgeIconType = 'award' | 'shield' | 'gem' | 'rocket' | 'star';

// Interfaces
interface LeaderboardUser {
    id: string;
    name: string;
    coins: number;
    role: 'student';
    equippedBadgeIcon?: BadgeIconType;
}

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400 fill-gray-300" />;
    if (rank === 3) return <AwardIcon className="h-6 w-6 text-amber-700 fill-amber-600" />;
    return <span className="font-bold text-lg w-6 text-center">{rank}</span>;
};

const badgeIcons: Record<BadgeIconType, React.ReactNode> = {
    award: <AwardIcon className="h-5 w-5 text-yellow-500" />,
    shield: <Shield className="h-5 w-5 text-blue-500" />,
    gem: <Gem className="h-5 w-5 text-emerald-500" />,
    rocket: <Rocket className="h-5 w-5 text-rose-500" />,
    star: <Star className="h-5 w-5 text-amber-500" />,
};

const BadgeIcon = ({ iconName }: { iconName?: BadgeIconType }) => {
    if (!iconName || !badgeIcons[iconName]) return null;
    return <div className="ml-2" title={iconName}>{badgeIcons[iconName]}</div>;
};

export default function LeaderboardPage() {
    const firestore = useFirestore();

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

    if (leaderboardLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
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
        <div className="max-w-4xl mx-auto grid gap-8">
            <Card className="rounded-lg shadow-lg">
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
                                    className="flex items-center p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                                >
                                    <div className="flex items-center gap-4 w-1/6">
                                        <RankIcon rank={index + 1} />
                                    </div>
                                    <div className="flex items-center gap-4 flex-1">
                                         <Avatar className="h-10 w-10">
                                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-semibold flex items-center">
                                            {student.name}
                                            <BadgeIcon iconName={student.equippedBadgeIcon} />
                                        </p>
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
    );
}
