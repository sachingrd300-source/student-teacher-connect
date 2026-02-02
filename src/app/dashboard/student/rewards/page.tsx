
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gift, Sparkles, School } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
}

// Define the daily reward progression
const dailyRewards = [5, 10, 15, 20, 25, 30, 50]; // Day 1 to Day 7 (bonus)

export default function RewardsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
                <School className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Rewards...</p>
            </div>
        );
    }
    
    const currentStreak = userProfile?.streak || 0;
    const totalDaysInJourney = 7;
    const dayInCycle = currentStreak > 0 ? ((currentStreak - 1) % totalDaysInJourney) + 1 : 1;

    const days = Array.from({ length: totalDaysInJourney }, (_, i) => {
        const day = i + 1;
        const reward = dailyRewards[i];
        let status: 'completed' | 'today' | 'locked' = 'locked';
        
        if (day < dayInCycle) {
            status = 'completed';
        } else if (day === dayInCycle) {
            status = 'today';
        }
        
        return { day, status, reward };
    });
    
    return (
        <div className="max-w-4xl mx-auto grid gap-8">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">Daily Rewards</CardTitle>
                    <CardDescription>Log in daily to build your streak and earn coins! You are currently on a <span className="font-bold text-primary">{currentStreak}-day</span> streak. 🔥</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="flex items-center pb-2 overflow-x-auto custom-scrollbar">
                        <div className="inline-flex items-start gap-4 py-2 px-2">
                            {days.map((day, index) => {
                                const isCompleted = day.status === 'completed';
                                const isToday = day.status === 'today';
                                const isBonus = day.day === 7;
                                
                                const isLineFilled = day.status === 'completed' || day.status === 'today';
                                const showLine = index < days.length - 1;

                                return (
                                    <div key={day.day} className="flex items-center">
                                        <div className="flex flex-col items-center gap-2 text-center w-20 flex-shrink-0">
                                            <div
                                                className={cn(
                                                    "relative flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold text-xs transition-all duration-300",
                                                    isCompleted && "bg-green-100 border-green-500 text-green-700",
                                                    isToday && "bg-primary/10 border-primary text-primary scale-110 shadow-lg shadow-primary/20 w-16 h-16",
                                                    !isCompleted && !isToday && "bg-muted border-border text-muted-foreground"
                                                )}
                                            >
                                                {isCompleted ? <Check className="w-6 h-6" /> : 
                                                isToday ? <Sparkles className="w-7 h-7" /> :
                                                (isBonus ? <Gift className="w-6 h-6" /> : `Day ${day.day}`)}
                                            </div>
                                            <p className={cn(
                                                "text-xs font-bold",
                                                isToday ? "text-primary" : "text-muted-foreground"
                                            )}>+ {day.reward} Coins</p>
                                        </div>
                                        {showLine && <div className={cn("w-6 h-1 mx-2 rounded-full", isLineFilled ? 'bg-primary/50' : 'bg-border')} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
