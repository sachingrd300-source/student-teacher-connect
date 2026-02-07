
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
    lastLoginDate?: string;
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
        <div className="max-w-2xl mx-auto grid gap-8">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-serif">Daily Rewards</CardTitle>
                    <CardDescription>Log in daily to build your streak and earn coins! You are currently on a <span className="font-bold text-primary">{currentStreak}-day</span> streak. 🔥</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid gap-3">
                        {days.map((day) => {
                            const isCompleted = day.status === 'completed';
                            const isToday = day.status === 'today';
                            const isBonus = day.day === 7;
                            
                            return (
                                <div 
                                    key={day.day}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300",
                                        isCompleted && "bg-green-100/50 dark:bg-green-900/20 border-green-500/50",
                                        isToday && "border-primary ring-2 ring-primary/50 shadow-lg",
                                        !isCompleted && !isToday && "bg-muted/50 border-transparent opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-12 h-12 rounded-full font-semibold text-lg",
                                                isCompleted && "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200",
                                                isToday && "bg-primary/10 text-primary",
                                                !isCompleted && !isToday && "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-7 h-7" /> : 
                                            isToday ? <Sparkles className="w-7 h-7" /> :
                                            (isBonus ? <Gift className="w-6 h-6" /> : day.day)}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-bold text-lg",
                                                isToday && "text-primary"
                                            )}>
                                                {isBonus ? "Bonus Reward" : `Day ${day.day}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isToday ? "Next reward to unlock!" : (isCompleted ? "Collected" : "Locked")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                        <span>+{day.reward}</span>
                                        <span role="img" aria-label="Coin">🪙</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
