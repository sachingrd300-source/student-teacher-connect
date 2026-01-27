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
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <Link className="flex items-center justify-center mr-auto" href="/">
                <School className="h-6 w-6 mr-2 text-primary" />
                <span className="text-lg font-semibold">EduConnect Pro</span>
            </Link>
            <nav className="hidden md:flex gap-4 sm:gap-6 items-center">
                <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</Link>
                <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</Link>
            </nav>
            <nav className="flex gap-2 sm:gap-4 items-center ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="hidden sm:inline-flex">
                            Login <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/login">Student Login</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/login/teacher">Teacher Login</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button asChild>
                   <Link href="/signup">Get Started</Link>
                </Button>
            </nav>
        </header>
    );
}
