
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  ShoppingCart,
  Store,
  Users2,
  UserPlus,
  BookOpenCheck,
  ShieldCheck,
  BookCopy,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

type Role = 'teacher' | 'student' | 'admin';

const navItems = {
  student: [
    { href: '/dashboard/student', label: 'Home', icon: Home },
    { href: '/dashboard/student/my-schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/dashboard/student/find-tutor', label: 'Find Tutor', icon: Search },
    { href: '/dashboard/student/shop', label: 'Shop', icon: ShoppingCart },
    { href: '/dashboard/student/my-store', label: 'My Store', icon: Store },
  ],
  teacher: [
    { href: '/dashboard/teacher', label: 'Home', icon: Home },
    { href: '/dashboard/teacher/batches', label: 'Classes', icon: Users2 },
    { href: '/dashboard/teacher/enrollments', label: 'Requests', icon: UserPlus },
    { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/dashboard/teacher/ai-tools', label: 'AI Tools', icon: Sparkles },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Admin', icon: ShieldCheck },
  ]
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItems[role] || [];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className={cn("grid h-full max-w-lg mx-auto font-medium", 
        `grid-cols-${items.length}`
      )}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
              pathname === item.href ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
