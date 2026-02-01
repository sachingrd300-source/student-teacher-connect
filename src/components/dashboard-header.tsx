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
import { School, UserCircle, LogOut, User as UserIcon, LifeBuoy } from 'lucide-react';


interface UserProfileForHeader {
  name?: string | null;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  coins?: number;
  streak?: number;
}

interface DashboardHeaderProps {
  userProfile: UserProfileForHeader | null | undefined;
}

export function DashboardHeader({ userProfile }: DashboardHeaderProps) {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
            <School className="h-6 w-6 mr-1 text-primary" />
            <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
        </Link>
        
        <div className="flex items-center gap-2 ml-auto">
             {userProfile?.role === 'student' && (
                <div className="flex items-center sm:border-r sm:pr-4 sm:mr-2">
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
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    {userProfile?.role !== 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/support">
                                <LifeBuoy className="mr-2 h-4 w-4" />
                                <span>Support</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
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
