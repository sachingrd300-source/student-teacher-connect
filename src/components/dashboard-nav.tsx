
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpenCheck,
  User,
  FileText,
  Users,
  LogOut,
  ClipboardList,
  BarChart3,
  Users2,
  CalendarDays,
  Search,
  UserPlus,
  ShoppingCart,
  Store,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { buttonVariants } from './ui/button';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
// Auth functionality is temporarily removed
// import { logout } from '@/firebase/auth';

type Role = 'teacher' | 'student';

const navItems = {
  teacher: [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: Home },
    { href: '/dashboard/teacher/profile', label: 'My Profile', icon: User },
    { href: '/dashboard/teacher/enrollments', label: 'Enrollments', icon: UserPlus },
    { href: '/dashboard/teacher/batches', label: 'Classes', icon: Users2 },
    { href: '/dashboard/teacher/materials', label: 'Materials', icon: BookOpenCheck },
    { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/dashboard/teacher/attendance', label: 'Attendance', icon: FileText },
    { href: '/dashboard/teacher/performance', label: 'Performance', icon: BarChart3 },
  ],
  student: [
    { href: '/dashboard/student', label: 'Dashboard', icon: Home },
    { href: '/dashboard/student/find-tutor', label: 'Find a Tutor', icon: Search },
    { href: '/dashboard/student/study-material', label: 'Study Material', icon: BookOpenCheck },
    { href: '/dashboard/student/daily-practice', label: 'Daily Practice', icon: ClipboardList },
    { href: '/dashboard/student/performance', label: 'My Performance', icon: BarChart3, conditional: true },
    { href: '/dashboard/student/shop', label: 'Shop', icon: ShoppingCart },
    { href: '/dashboard/student/my-store', label: 'My Store', icon: Store },
  ],
};

const roleIcons = {
  teacher: <User className="h-5 w-5" />,
  student: <BookOpenCheck className="h-5 w-5" />,
};

type Enrollment = {
    status: 'approved' | 'pending' | 'denied';
}

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isClient, setIsClient] = useState(false);

  const approvedEnrollmentsQuery = useMemo(() => {
    if (!firestore || !user || role !== 'student') return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
  }, [firestore, user, role]);

  const { data: approvedEnrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(approvedEnrollmentsQuery);

  const hasApprovedEnrollments = (approvedEnrollments?.length || 0) > 0;
  
  const items = useMemo(() => {
    const roleItems = navItems[role] || [];
    if (role === 'student') {
        return roleItems.filter(item => {
            if (item.conditional) {
                return hasApprovedEnrollments;
            }
            return true;
        });
    }
    return roleItems;
  }, [role, hasApprovedEnrollments]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    // Auth functionality is temporarily removed
    // await logout();
    router.push('/');
  };

  const navContentLoading = role === 'student' && isLoadingEnrollments;

  return (
    <nav className="flex flex-col gap-2 p-4">
      {isClient ? (
        <Collapsible defaultOpen={true} key={role}>
          <CollapsibleTrigger
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'flex w-full justify-start items-center gap-3 mb-2 font-semibold text-lg hover:bg-primary/10'
            )}
          >
            {roleIcons[role]}
            <span className="capitalize">{role} Menu</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 pl-4 border-l-2 border-primary/20 ml-4">
            {navContentLoading ? (
                 <div className="space-y-1">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            ) : (
                items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'justify-start gap-3',
                      pathname === item.href && 'bg-primary/10 text-primary font-semibold'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <div className="pl-4 space-y-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 pt-4 border-t">
        <button
          onClick={handleLogout}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-3 text-red-500 hover:text-red-500 hover:bg-red-500/10'
          )}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
