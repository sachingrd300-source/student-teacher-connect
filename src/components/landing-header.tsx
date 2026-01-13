'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "border-b border-border bg-background/80 backdrop-blur-lg" : "border-b border-transparent"
    )}>
      <div className="container flex h-20 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-7 w-7 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-xl">EduConnect Pro</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex gap-6 items-center flex-1">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</Link>
            <Link href="#free-material" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Resources</Link>
            <Link href="#top-teachers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Tutors</Link>
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
            <>
                <div className="hidden md:flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Tutor Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/login-student">Student Login <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-8">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ml-2 font-bold font-headline text-lg">EduConnect Pro</span>
                </div>
                 <div className="flex flex-col gap-4 text-lg">
                    <Link href="#features" className="font-medium">Features</Link>
                    <Link href="#free-material" className="font-medium">Resources</Link>
                    <Link href="#top-teachers" className="font-medium">Tutors</Link>
                    <hr className="my-2 border-border"/>
                    <Link href="/login-student" className="font-medium">Student Login</Link>
                    <Link href="/login" className="font-medium">Tutor Login</Link>
                    <Link href="/signup" className="font-medium">Become a Tutor</Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
