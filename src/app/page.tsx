
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight, Search, UserPlus, BookOpenCheck, StepForward, Atom, FlaskConical, Book, BrainCircuit, MessageSquare, TestTube, Edit, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedCard } from '@/components/ui/animated-card';


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
        icon: <Edit className="h-8 w-8 text-primary" />,
        title: "Create a Profile",
        description: "Sign up and build your tutor profile to showcase your skills and experience."
    },
    {
        icon: <Layers className="h-8 w-8 text-primary" />,
        title: "Create Classes",
        description: "Set up your classes and receive a unique code to share with your students."
    },
    {
        icon: <GraduationCap className="h-8 w-8 text-primary" />,
        title: "Start Teaching",
        description: "Manage enrollments, upload materials, and track student performance."
    }
]

const floatingIcons = [
    { icon: <Book /> },
    { icon: <Atom /> },
    { icon: <FlaskConical /> },
    { icon: <TestTube /> },
    { icon: <BrainCircuit /> },
    { icon: "🎓" },
    { icon: "🔬" },
    { icon: "📚" },
    { icon: "💡" },
    { icon: "📈" },
]

const FloatingIconsBackground = () => {
    const [isClient, setIsClient] = useState(false);
  
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient) {
      return null;
    }
  
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => {
          const Icon = floatingIcons[i % floatingIcons.length].icon;
          const style = {
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          };
          return (
            <div key={i} style={style} className="floating-icon">
              {Icon}
            </div>
          );
        })}
      </div>
    );
  };


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center text-center text-foreground overflow-hidden">
             <div className="absolute inset-0 bg-black/70 z-10"></div>
             
             <FloatingIconsBackground />

             <div className="relative z-20 px-4 md:px-6 space-y-6 text-white">
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
                                <h3 className="font-bold text-xl font-headline">{feature.title}</h3>
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
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl flex items-center justify-center gap-3 animation-multi-color-blink">
                        <StepForward className="w-8 h-8"/>
                        Getting Started is Easy
                    </h2>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-lg">
                        Follow these simple steps to join our learning community.
                    </p>
                </div>
                
                <Tabs defaultValue="student" className="w-full max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="student">For Students</TabsTrigger>
                        <TabsTrigger value="teacher">For Teachers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="student">
                        <div className="relative mt-12">
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                            {howItWorksStudent.map((step, index) => (
                                <div key={step.title} className={cn("relative flex items-center mb-12", index % 2 === 0 ? "justify-start" : "justify-end")}>
                                     <div className="absolute left-1/2 top-8 -translate-x-1/2 h-16 w-16 rounded-full flex items-center justify-center ring-8 ring-muted/20 bg-background z-10">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                            <div className="absolute inset-0 aurora-viz" />
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-primary">
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatedCard index={index} className={cn("w-1/2", index % 2 === 0 ? "pr-12" : "pl-12")}>
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                {step.icon}
                                                <CardTitle className="font-headline">{step.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{step.description}</p>
                                        </CardContent>
                                    </AnimatedCard>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="teacher">
                        <div className="relative mt-12">
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                             {howItWorksTeacher.map((step, index) => (
                                <div key={step.title} className={cn("relative flex items-center mb-12", index % 2 === 0 ? "justify-start" : "justify-end")}>
                                    <div className="absolute left-1/2 top-8 -translate-x-1/2 h-16 w-16 rounded-full flex items-center justify-center ring-8 ring-muted/20 bg-background z-10">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                            <div className="absolute inset-0 aurora-viz" />
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-primary">
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatedCard index={index} className={cn("w-1/2", index % 2 === 0 ? "pr-12" : "pl-12")}>
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                {step.icon}
                                                <CardTitle className="font-headline">{step.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{step.description}</p>
                                        </CardContent>
                                    </AnimatedCard>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
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
