
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpenCheck,
  Users,
  BarChart3,
  CalendarDays,
  Settings,
  LogOut,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { buttonVariants } from './ui/button';
import { useEffect, useState } from 'react';

type Role = 'teacher' | 'student' | 'parent';

const navItems = {
  teacher: [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: Home },
    { href: '/dashboard/teacher/students', label: 'Students', icon: Users },
    { href: '/dashboard/teacher/materials', label: 'Materials', icon: BookOpenCheck },
    { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/dashboard/teacher/performance', label: 'Performance', icon: BarChart3 },
  ],
  student: [
    { href: '/dashboard/student', label: 'Dashboard', icon: Home },
    { href: '/dashboard/student/passport', label: 'Learning Passport', icon: FileText },
    { href: '/dashboard/student/materials', label: 'Study Material', icon: BookOpenCheck },
    { href: '/dashboard/student/performance', label: 'My Performance', icon: BarChart3 },
    { href: '/dashboard/student/attendance', label: 'My Attendance', icon: CalendarDays },
  ],
  parent: [
    { href: '/dashboard/parent', label: 'Dashboard', icon: Home },
    { href: '/dashboard/parent/performance', label: 'Performance', icon: BarChart3 },
    { href: '/dashboard/parent/attendance', label: 'Attendance', icon: CalendarDays },
    { href: '/dashboard/parent/schedule', label: 'Class Schedule', icon: CalendarDays },
  ],
};

const roleIcons = {
  teacher: <User className="h-5 w-5" />,
  student: <BookOpenCheck className="h-5 w-5" />,
  parent: <Shield className="h-5 w-5" />,
};

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItems[role];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <nav className="flex flex-col gap-2 p-4">
      {isClient ? (
        <Collapsible defaultOpen={true} key={role}>
          <CollapsibleTrigger
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'flex w-full justify-start items-center gap-2 mb-2 font-semibold text-lg'
            )}
          >
            {roleIcons[role]}
            <span className="capitalize">{role} Menu</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 pl-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'justify-start gap-2',
                  pathname === item.href && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
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
        <Link
          href="#"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-2'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10'
          )}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </nav>
  );
}
