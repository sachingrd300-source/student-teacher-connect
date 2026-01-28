
'use client';

import Link from 'next/link';
import { School, ChevronDown, Menu } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

export function MainHeader() {
    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <Link className="flex items-center justify-center gap-2" href="/">
                <School className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold font-serif">Achievers Community</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-auto">
                <Button variant="ghost" asChild>
                    <Link href="/login/teacher">Teacher Login</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup/teacher">Apply Now</Link>
                </Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden ml-auto">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <nav className="grid gap-6 text-lg font-medium p-4">
                            <SheetClose asChild>
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <School className="h-6 w-6 text-primary" />
                                    <span>Achievers Community</span>
                                </Link>
                            </SheetClose>
                            <div className="mt-8 grid gap-2">
                                <SheetClose asChild>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/login/teacher">Teacher Login</Link>
                                    </Button>
                                </SheetClose>
                                 <SheetClose asChild>
                                    <Button asChild className="w-full">
                                        <Link href="/signup/teacher">Apply Now</Link>
                                    </Button>
                                </SheetClose>
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
