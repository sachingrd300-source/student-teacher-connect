
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight, BookOpen, MessageSquare, ShoppingCart } from 'lucide-react';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AnimatedCard } from '@/components/ui/animated-card';

const features = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: 'Find Top Tutors',
    description: 'Browse profiles, check qualifications, and connect with the best tutors for your needs.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Free Study Material',
    description: 'Access a rich library of free notes, practice papers, and resources shared by our community.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Direct Communication',
    description: 'Connect directly with tutors and students via WhatsApp for seamless communication.',
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: 'Marketplace',
    description: 'Buy and sell new or used books, notes, and equipment in the student marketplace.',
  },
];

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-2');

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-24">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
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
               {heroImage && (
                <div className="relative w-full h-64 lg:h-auto rounded-xl overflow-hidden shadow-2xl">
                    <Image
                      src={heroImage.imageUrl}
                      alt={heroImage.description}
                      data-ai-hint={heroImage.imageHint}
                      fill
                      className="object-cover"
                    />
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm shadow-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to empower both teachers and students with powerful, easy-to-use features.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-4">
              {features.map((feature, index) => (
                <AnimatedCard 
                  key={feature.title} 
                  index={index}
                  className="grid gap-4 p-6 rounded-lg bg-background shadow-soft-shadow hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
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
