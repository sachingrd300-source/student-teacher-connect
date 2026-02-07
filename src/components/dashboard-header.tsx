'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { 
    Award, LogOut, User as UserIcon, Home, Menu, Sun, Moon,
    // Student Icons
    LayoutDashboard, Search, BookOpen, BookCheck, Bookmark, ShoppingBag,
    // Teacher Icons
    CalendarCheck, ShoppingCart,
    // Admin Icons
    Users, Briefcase, MessageSquare, FileText, Gift, History
} from 'lucide-react';
import { useTheme } from 'next-themes';


interface UserProfile {
  name?: string | null;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  coins?: number;
  streak?: number;
}

interface DashboardHeaderProps {
  userProfile: UserProfile | null | undefined;
}

export function DashboardHeader({ userProfile }: DashboardHeaderProps) {
  const auth = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const dashboardHomeLink = userProfile?.role === 'teacher' ? '/dashboard/teacher/coaching' : userProfile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/student';

  const studentNavItems = [
    { href: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/student/find-teachers', label: 'Find Teachers', icon: Search },
    { href: '/dashboard/student/book-coaching-seat', label: 'Book Coaching Seat', icon: BookCheck },
    { href: '/dashboard/student/book-home-teacher', label: 'Book Home Teacher', icon: Home },
    { href: '/dashboard/student/free-materials', label: 'Free Materials', icon: BookOpen },
    { href: '/dashboard/student/saved-materials', label: 'Saved Materials', icon: Bookmark },
    { href: '/dashboard/student/shop', label: 'Shop', icon: ShoppingBag },
  ];

  const teacherNavItems = [
    { href: '/dashboard/teacher/coaching', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/dashboard/teacher/apply-home-teacher', label: 'Home Teacher Program', icon: Home },
    { href: '/dashboard/teacher/apply-verified-coaching', label: 'Achiever\'s Community', icon: Award },
    { href: '/dashboard/teacher/place-order', label: 'Place Order', icon: ShoppingCart },
  ];

  const adminNavItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'users', label: 'Users', icon: Users },
    { view: 'programs', label: 'Programs', icon: Briefcase },
    { view: 'applications', label: 'Applications', icon: Briefcase }, // Re-using icon
    { view: 'bookings', label: 'Bookings', icon: Home },
    { view: 'orders', label: 'Orders', icon: ShoppingCart },
    { view: 'support', label: 'Support', icon: MessageSquare },
    { view: 'materials', label: 'Materials', icon: FileText },
    { view: 'shop', label: 'Shop', icon: Gift },
    { view: 'activity', label: 'Activity', icon: History },
  ];

  const renderNavItems = () => {
      let items = [];
      switch(userProfile?.role) {
          case 'student':
              items = studentNavItems;
              break;
          case 'teacher':
              items = teacherNavItems;
              break;
          case 'admin':
              // Admin uses a different structure with 'view'
              return adminNavItems.map(item => (
                <DropdownMenuItem key={item.view} asChild>
                    <Link href={`/dashboard/admin?view=${item.view}`}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                    </Link>
                </DropdownMenuItem>
              ));
          default:
              return null;
      }
      return items.map(item => (
        <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
            </Link>
        </DropdownMenuItem>
      ));
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-semibold" href={dashboardHomeLink}>
            <Image src="/logo.png" alt="Achiever's Community Logo" width={32} height={32} className="rounded-full" />
            <span className="text-lg font-semibold font-serif hidden sm:inline">Achiever's Community</span>
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                    {renderNavItems()}
                    <DropdownMenuSeparator />
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                System
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
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
