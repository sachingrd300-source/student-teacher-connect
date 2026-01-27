'use client';

import Link from 'next/link';
import { School, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MainHeader() {
    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b sticky top-0 z-50">
            <Link className="flex items-center justify-center mr-auto" href="/">
                <School className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg font-semibold font-serif">My App</span>
            </Link>
            <nav className="flex gap-2 sm:gap-4 items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
                            Login <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/login">Student</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/signup/student">Teacher</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button>
                            Sign Up <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem asChild>
                           <Link href="/signup">As a Student</Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                           <Link href="/signup/teacher">As a Teacher</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
        </header>
    );
}
