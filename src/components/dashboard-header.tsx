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
import { School, UserCircle, LogOut, LayoutDashboard, User } from 'lucide-react';


interface DashboardHeaderProps {
  userName: string | null | undefined;
  userRole?: 'student' | 'tutor' | 'admin';
}

const navItems = {
    tutor: [
        { href: '/dashboard/teacher', label: 'Dashboard' },
        { href: '/dashboard/teacher/profile', label: 'My Profile' },
    ],
    student: [
        { href: '/dashboard/student', label: 'Dashboard' },
        { href: '/dashboard/student/profile', label: 'My Profile' },
    ],
    admin: [
        { href: '/dashboard/admin', label: 'Dashboard' },
    ]
}


export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const auth = useAuth();
  const router = useRouter();

  const currentNavItems = userRole ? navItems[userRole] : [];

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
        
        <nav className="hidden md:flex md:items-center md:gap-5 lg:gap-6 text-sm font-medium mx-auto">
             {currentNavItems.map(item => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground text-muted-foreground">
                    {item.label}
                </Link>
             ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
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
                        <p className="text-sm font-normal text-muted-foreground">{userName}</p>
                    </DropdownMenuLabel>
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
