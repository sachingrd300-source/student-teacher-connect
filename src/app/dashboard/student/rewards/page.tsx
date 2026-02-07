
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Gift, Sparkles, School, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLevelInfo } from '@/lib/rewards';
import { Progress } from '@/components/ui/progress';

interface UserProfile {
    name: string;
    role?: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
    lastLoginDate?: string;
}


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
    
    const totalStreak = userProfile?.streak || 0;
    const { level, name, rewards, dayInLevel, totalDaysInLevel } = getLevelInfo(totalStreak);
    const progressPercentage = (dayInLevel / totalDaysInLevel) * 100;

    const days = Array.from({ length: rewards.length }, (_, i) => {
        const day = i + 1;
        const reward = rewards[i];
        let status: 'completed' | 'today' | 'locked' = 'locked';
        
        if (day < dayInLevel) {
            status = 'completed';
        } else if (day === dayInLevel) {
            status = 'today';
        }
        
        return { day, status, reward };
    });
    
    return (
        <div className="max-w-2xl mx-auto grid gap-8">
            <Card className="rounded-2xl shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/40 p-6">
                    <CardTitle className="text-2xl font-serif flex items-center gap-3">
                        <Trophy className="h-7 w-7 text-amber-500" />
                        Level {level}: {name}
                    </CardTitle>
                    <CardDescription>
                        You are on day {dayInLevel} of your {totalDaysInLevel}-day journey for this level. Keep it up!
                    </CardDescription>
                     <div className="pt-2">
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid gap-3">
                        {days.map((day, index) => {
                            const isCompleted = day.status === 'completed';
                            const isToday = day.status === 'today';
                            
                            return (
                                <div 
                                    key={day.day}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300",
                                        isCompleted && "bg-green-100/50 dark:bg-green-900/20 border-green-500/50",
                                        isToday && "border-primary ring-2 ring-primary/50 shadow-lg",
                                        !isCompleted && !isToday && "bg-muted/30 border-transparent opacity-70"
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
                                            (day.reward > 70 ? <Gift className="w-6 h-6" /> : day.day)}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-bold text-lg",
                                                isToday && "text-primary"
                                            )}>
                                                Day {day.day}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isToday ? "Today's Reward" : (isCompleted ? "Collected" : "Locked")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xl font-bold text-amber-500">
                                        <span>+{day.reward}</span>
                                        <span role="img" aria-label="Coin">🪙</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/40 p-4 text-center">
                     <p className="text-xs text-muted-foreground w-full">Your total streak is <span className="font-bold text-primary">{totalStreak} days</span>. Keep logging in daily!</p>
                </CardFooter>
            </Card>
        </div>
    );
}
