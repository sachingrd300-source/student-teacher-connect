import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg">EduConnect Pro</span>
          </Link>
        </div>
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="/#features" className="text-foreground/60 transition-colors hover:text-foreground/80">Features</Link>
          <Link href="#pricing" className="text-foreground/60 transition-colors hover:text-foreground/80">Pricing</Link>
          <Link href="#contact" className="text-foreground/60 transition-colors hover:text-foreground/80">Contact</Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild variant="ghost">
            <Link href="/dashboard/student">Login</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-8">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ml-2 font-bold font-headline text-lg">EduConnect Pro</span>
                </div>
                <nav className="flex flex-col gap-4 text-lg font-medium">
                    <Link href="/#features" className="text-foreground/60 hover:text-foreground">Features</Link>
                    <Link href="#pricing" className="text-foreground/60 hover:text-foreground">Pricing</Link>
                    <Link href="#contact" className="text-foreground/60 hover:text-foreground">Contact</Link>
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                    <Button asChild>
                        <Link href="/dashboard/student">Login</Link>
                    </Button>
                     <Button asChild variant="secondary">
                        <Link href="/signup">Sign Up</Link>
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
