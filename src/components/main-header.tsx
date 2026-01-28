'use client';

import Link from 'next/link';
import { GraduationCap, Menu, User, UserPlus, Globe } from 'lucide-react';
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface MainHeaderProps {
    currentLanguage: 'en' | 'hi';
    onLanguageChange: (lang: 'en' | 'hi') => void;
}

export function MainHeader({ currentLanguage, onLanguageChange }: MainHeaderProps) {
    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <Link className="flex items-center justify-center gap-2" href="/">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold font-serif">EduConnect Pro</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Globe className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLanguageChange('en')} disabled={currentLanguage === 'en'}>
                            English
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onLanguageChange('hi')} disabled={currentLanguage === 'hi'}>
                            हिंदी (Hindi)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost">Login</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/login">
                                <User className="mr-2 h-4 w-4" />
                                <span>Student</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/login/teacher">
                                <User className="mr-2 h-4 w-4" />
                                <span>Teacher</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>Sign Up</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem asChild>
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>As a Student</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/signup/teacher">
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>As a Teacher</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden ml-auto flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                         <SheetHeader className="text-left mb-8">
                            <SheetTitle>
                                <SheetClose asChild>
                                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                                        <GraduationCap className="h-6 w-6 text-primary" />
                                        <span>EduConnect Pro</span>
                                    </Link>
                                </SheetClose>
                            </SheetTitle>
                             <SheetDescription>
                                Main navigation menu.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <SheetClose asChild>
                                    <Button variant={currentLanguage === 'en' ? 'default' : 'outline'} onClick={() => onLanguageChange('en')}>English</Button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Button variant={currentLanguage === 'hi' ? 'default' : 'outline'} onClick={() => onLanguageChange('hi')}>हिंदी</Button>
                                </SheetClose>
                            </div>
                            <hr className="my-4" />
                            <SheetClose asChild>
                                <Button asChild variant="outline" className="w-full justify-start text-base py-6">
                                    <Link href="/login">Student Login</Link>
                                </Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild variant="outline" className="w-full justify-start text-base py-6">
                                    <Link href="/login/teacher">Teacher Login</Link>
                                </Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild className="w-full justify-start text-base py-6">
                                    <Link href="/signup">Student Sign Up</Link>
                                </Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild className="w-full justify-start text-base py-6">
                                    <Link href="/signup/teacher">Teacher Sign Up</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
