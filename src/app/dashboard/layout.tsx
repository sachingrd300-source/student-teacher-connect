'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DashboardNav } from '@/components/dashboard-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type Role = 'teacher' | 'student';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  const getRole = (): Role => {
    if (pathname.startsWith('/dashboard/teacher')) return 'teacher';
    if (pathname.startsWith('/dashboard/student')) return 'student';
    // Default to student if no specific role path is matched.
    // This handles the case of /dashboard redirecting page.
    return 'student'; 
  };

  const role = getRole();

  const getDisplayName = () => user?.displayName || user?.email?.split('@')[0] || 'User';
  const getAvatarFallback = () => (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <div className="flex flex-col h-full">
            <SidebarHeader className="p-4 border-b">
              <Link href="/" className="flex items-center gap-2">
                <Icons.logo className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold font-headline">EduConnect Pro</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-y-auto">
              <DashboardNav role={role} />
            </SidebarContent>
            <div className="p-4 border-t">
              {isUserLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={getDisplayName()} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{getDisplayName()}</span>
                    <span className="text-xs text-muted-foreground capitalize">{role === 'teacher' ? 'Tutor' : 'Student'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Not logged in</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h2 className="text-2xl font-semibold font-headline hidden sm:block">
                  Dashboard
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                {isUserLoading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : user ? (
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={getDisplayName()} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar>
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
