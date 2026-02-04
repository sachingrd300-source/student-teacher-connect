'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { School, UserCircle, LogOut, User as UserIcon, Trophy, Home, Menu } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';


interface UserProfile {
  name?: string | null;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  coins?: number;
  streak?: number;
}

interface DashboardHeaderProps {
  userProfile: UserProfile | null | undefined;
  onMenuButtonClick?: () => void;
}

export function DashboardHeader({ userProfile, onMenuButtonClick }: DashboardHeaderProps) {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const dashboardHomeLink = userProfile?.role === 'teacher' ? (userProfile as any).teacherType === 'school' ? '/dashboard/teacher/school' : '/dashboard/teacher/coaching' : '/dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        {onMenuButtonClick && (
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={onMenuButtonClick}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
            </Button>
        )}
        <Link className="flex items-center gap-2 font-semibold" href={dashboardHomeLink}>
            <School className="h-6 w-6 mr-1 text-primary" />
            <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
        </Link>
        
        <div className="flex items-center gap-4 ml-auto">
             {userProfile?.role === 'student' && (
                <div className="flex items-center sm:border-r sm:pr-4">
                    <Link href="/dashboard/student/rewards" className="flex items-center gap-2 sm:gap-4 p-2 -m-2 rounded-md hover:bg-muted transition-colors" title="View Daily Rewards">
                        <div className="flex items-center gap-1 sm:gap-2 font-semibold text-sm">
                            <span role="img" aria-label="Coins">🪙</span>
                            {userProfile?.coins ?? 0}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 font-semibold text-sm">
                            <span role="img" aria-label="Streak">🔥</span>
                            {userProfile?.streak ?? 0}
                        </div>
                    </Link>
                </div>
            )}
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                    <UserCircle className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        <p>My Account</p>
                        <p className="text-sm font-normal text-muted-foreground">{userProfile?.name}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {userProfile?.role === 'student' && (
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard/student/leaderboard">
                                <Trophy className="mr-2 h-4 w-4" />
                                <span>Leaderboard</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                     {userProfile?.role === 'teacher' && (
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard/teacher/apply-home-tutor">
                                <Home className="mr-2 h-4 w-4" />
                                <span>Home Tutor Program</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
