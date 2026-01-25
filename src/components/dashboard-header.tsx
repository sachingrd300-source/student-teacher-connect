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
import { School, UserCircle, LogOut, LayoutDashboard, BookOpen, FlaskConical, CalendarCheck, ClipboardList, Menu, X, ClipboardCheck as ResultsIcon, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface DashboardHeaderProps {
  userName: string | null | undefined;
  userRole: 'tutor' | 'student';
}

interface NavLink {
    href: string;
    label: string;
    icon: React.ReactNode;
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const auth = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const handleLinkClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const commonLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
  ];

  const tutorLinks: NavLink[] = [
        ...commonLinks,
        { href: '/dashboard/teacher/profile', label: 'Profile', icon: <UserCircle className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/materials', label: 'Study Materials', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/attendance', label: 'Take Attendance', icon: <CalendarCheck className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/attendance-reports', label: 'Attendance Reports', icon: <BarChart3 className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/test-generator', label: 'AI Test Generator', icon: <FlaskConical className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/tests', label: 'Manage Tests', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { href: '/dashboard/teacher/results', label: 'Test Results', icon: <ResultsIcon className="mr-2 h-4 w-4" /> },
  ];

  const studentLinks: NavLink[] = [
       ...commonLinks,
       { href: '/dashboard/student/materials', label: 'Study Materials', icon: <BookOpen className="mr-2 h-4 w-4" /> },
       { href: '/dashboard/student/attendance', label: 'Attendance', icon: <CalendarCheck className="mr-2 h-4 w-4" /> },
       { href: '/dashboard/student/tests', label: 'My Tests', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
  ];

  const navLinks = userRole === 'tutor' ? tutorLinks : studentLinks;

  return (
    <>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <Link className="flex items-center justify-center mr-auto" href="/dashboard">
                <School className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
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
                        {navLinks.map((link) => (
                             <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                                {link.icon}
                                <span>{link.label}</span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
                 <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
            <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in-20">
                <div className="fixed top-14 left-0 w-full h-full bg-background p-6">
                    <div className="flex flex-col space-y-2">
                        <p className="text-lg font-semibold">{userName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                    </div>
                    <div className="my-6 border-t"></div>
                     <nav className="flex flex-col space-y-1">
                        {navLinks.map((link) => (
                           <Button key={link.href} variant="ghost" className="w-full justify-start text-base py-6" onClick={() => handleLinkClick(link.href)}>
                                {link.icon}
                                <span>{link.label}</span>
                           </Button>
                        ))}
                        <div className="my-6 border-t"></div>
                        <Button variant="ghost" className="w-full justify-start text-base py-6" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </Button>
                    </nav>
                </div>
            </div>
        )}
    </>
  );
}
