'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useUser } from '@/firebase/auth';

export function LandingHeader() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold sm:inline-block">EduConnect Pro</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex gap-6 items-center">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</Link>
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!user && (
            <>
                <div className="hidden md:flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Tutor Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/login-student">Student Login</Link>
                    </Button>
                </div>
            </>
          )}

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
                <div className="flex items-center mb-4">
                    <Icons.logo className="h-6 w-6" />
                    <span className="ml-2 font-bold">EduConnect Pro</span>
                </div>
                 <div className="flex flex-col gap-4 text-lg">
                    <Link href="#features" className="font-medium">Features</Link>
                    <hr className="my-2"/>
                    {!user && (
                        <>
                            <Link href="/login-student" className="font-medium">Student Login</Link>
                            <Link href="/login" className="font-medium">Tutor Login</Link>
                            <Link href="/signup" className="font-medium">Become a Tutor</Link>
                        </>
                    )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
