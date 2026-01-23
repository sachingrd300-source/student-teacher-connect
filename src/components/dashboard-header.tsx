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
import { School, UserCircle, LogOut, LayoutDashboard } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string | null | undefined;
  userRole: 'tutor' | 'student';
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <Link className="flex items-center justify-center" href="/dashboard">
            <School className="h-6 w-6 mr-2 text-primary" />
            <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="overflow-hidden rounded-full"
                    >
                       <UserCircle className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        <p>My Account</p>
                        <p className="text-sm font-normal text-muted-foreground">{userName}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === 'tutor' && (
                         <DropdownMenuItem onClick={() => router.push('/dashboard/teacher/profile')}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                         </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
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
