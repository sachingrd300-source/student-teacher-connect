'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Search, BookOpen, Home, Trophy, ShoppingBag, Gift, School } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  name: string;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  coins?: number;
  streak?: number;
}

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || profileLoading) return;
    if (!user) {
        router.replace('/login');
        return;
    }
    if (userProfile && userProfile.role !== 'student') {
        router.replace('/dashboard');
    }
  }, [user, userProfile, isUserLoading, profileLoading, router]);

  const navItems = [
    { href: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/student/find-teachers', label: 'Find Teachers', icon: Search },
    { href: '/dashboard/student/free-materials', label: 'Free Materials', icon: BookOpen },
    { href: '/dashboard/student/book-home-tutor', label: 'Book Home Tutor', icon: Home },
    { href: '/dashboard/student/rewards', label: 'My Rewards', icon: Gift },
    { href: '/dashboard/student/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/dashboard/student/shop', label: 'Shop', icon: ShoppingBag },
  ];

  const renderSidebarContent = () => (
    <aside className="flex flex-col gap-2 p-4">
      <h2 className="px-4 text-lg font-semibold tracking-tight">Student Menu</h2>
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="justify-start"
            onClick={() => setSidebarOpen(false)}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  );

  if (isUserLoading || profileLoading) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
            <School className="h-16 w-16 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading Student Portal...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader userProfile={userProfile} />
      <div className="flex flex-1">
        <div className="hidden md:flex md:w-64 flex-col border-r bg-muted/20">
          {renderSidebarContent()}
        </div>
        <main className="flex-1 p-4 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="md:hidden mb-4 flex items-center justify-end">
              <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  {renderSidebarContent()}
                </SheetContent>
              </Sheet>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
