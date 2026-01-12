
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight, Search, UserPlus, BookOpenCheck, StepForward } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import React from 'react';
import { cn } from '@/lib/utils';

const features = [
    {
        icon: <User className="h-10 w-10 text-primary" />,
        title: 'For Students',
        description: 'Find the best tutors, view profiles, and connect instantly.',
    },
    {
        icon: <GraduationCap className="h-10 w-10 text-primary" />,
        title: 'For Teachers',
        description: 'Showcase your expertise, manage classes, and connect with students.',
    },
    {
        icon: <CheckCircle className="h-10 w-10 text-primary" />,
        title: 'Verified Tutors',
        description: 'All tutors are manually verified to ensure quality and safety.',
    }
]

const howItWorksStudent = [
    {
        icon: <Search className="h-8 w-8 text-primary" />,
        title: "Find a Tutor",
        description: "Browse our list of expert tutors and find the perfect match for your needs."
    },
    {
        icon: <UserPlus className="h-8 w-8 text-primary" />,
        title: "Join a Class",
        description: "Use the unique class code provided by your tutor to send an enrollment request."
    },
    {
        icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
        title: "Start Learning",
        description: "Access class materials, track your performance, and engage with your learning."
    }
]

const howItWorksTeacher = [
    {
        icon: <UserPlus className="h-8 w-8 text-primary" />,
        title: "Create a Profile",
        description: "Sign up and build your tutor profile to showcase your skills and experience."
    },
    {
        icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
        title: "Create Classes",
        description: "Set up your classes and receive a unique code to share with your students."
    },
    {
        icon: <GraduationCap className="h-8 w-8 text-primary" />,
        title: "Start Teaching",
        description: "Manage enrollments, upload materials, and track student performance."
    }
]


export default function LandingPage() {
    const heroImages = PlaceHolderImages.filter(p => p.id.startsWith('hero-'));
    const autoplay = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center text-center text-foreground overflow-hidden">
            <Carousel 
                opts={{ loop: true }} 
                plugins={[autoplay.current]} 
                className="absolute inset-0 w-full h-full"
            >
                <CarouselContent className="-ml-0">
                    {heroImages.map((img) => (
                         <CarouselItem key={img.id} className="pl-0">
                            <div className="relative w-full h-full">
                                <Image 
                                    src={img.imageUrl}
                                    alt={img.description}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={img.imageHint}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div className="absolute inset-0 bg-black/60"></div>
             <div className="relative z-10 px-4 md:px-6 space-y-6 text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight text-shadow-lg">
                    Empowering Education, <span className="text-primary">Connecting Minds</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/80">
                    EduConnect Pro is a modern, all-in-one platform designed to bring teachers and students closer together for a richer learning experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg">
                        <Link href="/login-student">I'm a Student <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                     <Button asChild size="lg" variant="secondary">
                        <Link href="/signup">I'm a Tutor</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Everything You Need to Succeed</h2>
              <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-lg">
                Our platform is packed with powerful features to enhance the teaching and learning process.
              </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
                {features.map((feature) => (
                     <Card key={feature.title} className="relative overflow-hidden text-center p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-primary/20 hover:shadow-2xl">
                        <div className="absolute -inset-2 aurora-viz opacity-20 blur-2xl"></div>
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                                {feature.icon}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-xl">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                     </Card>
                ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-24 bg-muted/20">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl flex items-center justify-center gap-3 animate-multi-color-blink">
                        <StepForward className="w-8 h-8"/>
                        Getting Started is Easy
                    </h2>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-lg">
                        Follow these simple steps to join our learning community.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16">
                    {/* For Students */}
                    <div className="space-y-8">
                        <h3 className="text-2xl font-bold font-headline text-center">For Students</h3>
                        <div className="relative flex flex-col gap-8 pl-8">
                             <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 ml-4"></div>
                             {howItWorksStudent.map((step, index) => (
                                <div key={step.title} className="flex items-start gap-6">
                                    <div className="relative flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-background z-10 bg-background">
                                      <div className="absolute inset-0 rounded-full aurora-viz" />
                                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
                                        <span className="font-bold text-primary">{index + 1}</span>
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                        <h4 className="font-bold text-lg">{step.title}</h4>
                                        <p className="text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>

                     {/* For Teachers */}
                     <div className="space-y-8">
                        <h3 className="text-2xl font-bold font-headline text-center">For Teachers</h3>
                        <div className="relative flex flex-col gap-8 pl-8">
                             <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 ml-4"></div>
                             {howItWorksTeacher.map((step, index) => (
                                <div key={step.title} className="flex items-start gap-6">
                                     <div className="relative flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-background z-10 bg-background">
                                      <div className="absolute inset-0 rounded-full aurora-viz" />
                                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
                                        <span className="font-bold text-primary">{index + 1}</span>
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                        <h4 className="font-bold text-lg">{step.title}</h4>
                                        <p className="text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 EduConnect Pro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
