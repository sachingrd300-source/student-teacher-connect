'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from "next/link";
import Image from 'next/image';
import { MainHeader } from "@/components/main-header";
import { School, User, Briefcase, BookOpen, Users, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import placeholderImages from '@/lib/placeholder-images.json';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const heroImage = placeholderImages.hero;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
            <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                className="object-cover"
                data-ai-hint={heroImage.hint}
                priority
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 p-4 animate-fade-in-down">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-serif">
                    Unlock Your Potential
                </h1>
                <p className="mt-4 max-w-2xl mx-auto md:text-xl">
                    The ultimate platform connecting dedicated teachers with eager students. Join a community of learners and educators today.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="font-semibold">
                       <Link href="/signup">
                         Get Started as a Student
                         <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="font-semibold">
                         <Link href="/signup/teacher">
                            Become a Teacher
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="text-center space-y-4 mb-12">
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">Why Choose Our Platform?</h2>
                     <p className="max-w-3xl mx-auto text-foreground/80 md:text-xl">
                        We provide the tools and community to foster growth and learning for everyone.
                     </p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform hover:scale-105 duration-300">
                        <BookOpen className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Expert Teachers</h3>
                        <p className="text-muted-foreground">Learn from experienced and passionate educators dedicated to your success.</p>
                    </div>
                     <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform hover:scale-105 duration-300">
                        <Users className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Interactive Batches</h3>
                        <p className="text-muted-foreground">Join focused learning groups, interact with peers, and get personalized attention.</p>
                    </div>
                     <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform hover:scale-105 duration-300">
                        <FileText className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Organized Materials</h3>
                        <p className="text-muted-foreground">Access all your study materials, class schedules, and updates in one place.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24">
             <div className="container px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">Ready to Join?</h2>
                <p className="max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Choose your role and sign in to our vibrant learning community today. Your journey starts here.
                </p>
                <div className="w-full max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <Link href="/login" className="flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:bg-muted/50 transition-colors shadow-sm">
                        <User className="h-12 w-12 mb-4 text-primary" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Student Login</h3>
                        <p className="text-muted-foreground text-center">Sign in to your student account.</p>
                    </Link>
                    <Link href="/signup/student" className="flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:bg-muted/50 transition-colors shadow-sm">
                        <Briefcase className="h-12 w-12 mb-4 text-primary" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Teacher Login</h3>
                        <p className="text-muted-foreground text-center">Sign in to your teacher account.</p>
                    </Link>
                </div>
            </div>
        </section>
      </main>
       <footer className="bg-muted border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
             <p>&copy; 2024 My App. All rights reserved.</p>
             <div className="flex gap-4 mt-4 sm:mt-0">
                <Link href="#" className="hover:text-primary">Terms of Service</Link>
                <Link href="#" className="hover:text-primary">Privacy Policy</Link>
             </div>
        </div>
      </footer>
    </div>
  );
}
