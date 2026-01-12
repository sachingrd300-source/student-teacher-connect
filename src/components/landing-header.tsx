
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, ArrowRight } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg">EduConnect Pro</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
            <>
                <div className="hidden md:flex gap-2">
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2" /></Link>
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
                <div className="mt-auto flex flex-col gap-2">
                    <Button asChild>
                        <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
