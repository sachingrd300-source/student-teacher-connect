
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The Ultimate Platform for Tutors and Students
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    EduConnect Pro provides seamless tools for teachers to manage classes and for students to find the best tutors.
                  </p>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl pt-2">
                    Earn by selling your notes, books, and other materials. Both students and teachers can become sellers in our marketplace.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login-student">I'm a Student</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                     <Link href="/signup">Become a Tutor</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to empower both teachers and students with powerful, easy-to-use features.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <User className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">For Students</h3>
                <p className="text-sm text-muted-foreground">
                  Find the best tutors, view their profiles, and connect with them instantly.
                </p>
              </div>
              <div className="grid gap-1">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">For Teachers</h3>
                <p className="text-sm text-muted-foreground">
                  Showcase your expertise, manage your classes, and connect with students looking for your skills.
                </p>
              </div>
              <div className="grid gap-1">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Verified Tutors</h3>
                <p className="text-sm text-muted-foreground">
                  All tutors on our platform are manually verified to ensure quality and safety.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to start your journey?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Whether you're a student eager to learn or a tutor ready to inspire, your journey begins here.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row lg:justify-end">
              <Button asChild size="lg">
                <Link href="/login-student">
                  Join as a Student
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">
                  Register as a Tutor
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 EduConnect Pro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
