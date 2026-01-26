'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { School, UserCircle, LogOut, LayoutDashboard, User, BookOpen, CalendarCheck, ClipboardCheck, FlaskConical, BarChart3, Settings, BookMarked, Wand2, Languages, MessageSquare, Briefcase, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';


interface DashboardHeaderProps {
  userName: string | null | undefined;
  userRole?: 'student' | 'tutor' | 'admin';
}

const teacherNavItems = [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/dashboard/teacher/materials', label: 'Materials', icon: <BookOpen className="h-4 w-4" /> },
    { href: '/dashboard/teacher/attendance', label: 'Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
    { href: '/dashboard/teacher/tests', label: 'Manage Tests', icon: <ClipboardCheck className="h-4 w-4" /> },
    { href: '/dashboard/teacher/results', label: 'Results', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/dashboard/teacher/test-generator', label: 'AI Test Generator', icon: <FlaskConical className="h-4 w-4" /> },
    { href: '/dashboard/teacher/lesson-planner', label: 'AI Lesson Planner', icon: <Briefcase className="h-4 w-4" /> },
    { href: '/dashboard/teacher/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

const studentNavItems = [
    { href: '/dashboard/student', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/dashboard/student/connections', label: 'Connections', icon: <Users className="h-4 w-4" /> },
    { href: '/dashboard/student/materials', label: 'Materials', icon: <BookOpen className="h-4 w-4" /> },
    { href: '/dashboard/student/attendance', label: 'Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
    { href: '/dashboard/student/tests', label: 'My Tests', icon: <FileText className="h-4 w-4" /> },
    { href: '/dashboard/student/results', label: 'My Results', icon: <ClipboardCheck className="h-4 w-4" /> },
    { href: '/dashboard/student/performance', label: 'Performance', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/dashboard/student/study-guide', label: 'AI Study Guide', icon: <BookMarked className="h-4 w-4" /> },
    { href: '/dashboard/student/ai-solver', label: 'AI Solver', icon: <Wand2 className="h-4 w-4" /> },
    { href: '/dashboard/student/english-tutor', label: 'AI English Tutor', icon: <Languages className="h-4 w-4" /> },
    { href: '/dashboard/student/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

const adminNavItems = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
];


export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  let navItems = [];
  let profileLink = "/";

  if (userRole === 'tutor') {
      navItems = teacherNavItems;
      profileLink = '/dashboard/teacher/profile';
  } else if (userRole === 'student') {
      navItems = studentNavItems;
      profileLink = '/dashboard/student/profile';
  } else if (userRole === 'admin') {
      navItems = adminNavItems;
      profileLink = '/dashboard/admin';
  }

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
             {navItems.map(item => (
                <Link key={item.href} href={item.href} className={cn("transition-colors hover:text-foreground", pathname === item.href ? "text-foreground" : "text-muted-foreground")}>
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
                    <Link href={profileLink}>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
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
