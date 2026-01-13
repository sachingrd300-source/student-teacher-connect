'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight, Search, Star, MessageSquare, BookOpen, UserPlus, FileText, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Icons } from '@/components/icons';

const features = [
    {
        icon: <User className="h-8 w-8 text-primary" />,
        title: 'For Students',
        description: 'Find the best tutors, view profiles, and connect instantly.',
    },
    {
        icon: <GraduationCap className="h-8 w-8 text-primary" />,
        title: 'For Teachers',
        description: 'Showcase your expertise, manage classes, and connect with students.',
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-primary" />,
        title: 'Verified Tutors',
        description: 'All tutors are manually verified to ensure quality and safety.',
    },
    {
        icon: <MessageSquare className="h-8 w-8 text-primary" />,
        title: 'WhatsApp Connect',
        description: 'Directly connect with tutors via WhatsApp for quick communication.',
    }
];

const topTeachers = [
    {
        name: 'Aarav Sharma',
        subject: 'Physics, IIT-JEE',
        rating: 4.9,
        verified: true,
        avatar: '/avatars/01.png'
    },
    {
        name: 'Priya Patel',
        subject: 'Biology, NEET',
        rating: 4.8,
        verified: true,
        avatar: '/avatars/02.png'
    },
    {
        name: 'Rohan Gupta',
        subject: 'Mathematics',
        rating: 5.0,
        verified: true,
        avatar: '/avatars/03.png'
    },
    {
        name: 'Sneha Verma',
        subject: 'Chemistry',
        rating: 4.9,
        verified: true,
        avatar: '/avatars/04.png'
    }
]

const stats = [
    { value: '10k+', label: 'Happy Students' },
    { value: '500+', label: 'Verified Tutors' },
    { value: '1k+', label: 'Free Resources' },
    { value: '24/7', label: 'AI Support' }
]

const Illustration = () => (
    <div className="relative w-full h-80 rounded-2xl bg-muted/50 overflow-hidden border border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-primary/20 animate-pulse delay-200"></div>
                <div className="absolute inset-8 rounded-full bg-primary/30 flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-primary animate-logo-glow" />
                </div>
            </div>
        </div>
    </div>
)

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative w-full h-[80vh] flex items-center justify-center text-center overflow-hidden">
             <div className="absolute -inset-1/2 aurora-viz z-0"></div>
             <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10"></div>
             
             <div className="relative z-20 px-4 md:px-6 space-y-8">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-headline tracking-tighter leading-tight">
                    Your Path to <span 
                    className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                    >Academic Excellence</span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/70">
                    Discover expert tutors, access quality study materials, and connect with a community dedicated to learning and growth.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                        <Link href="/login-student">I'm a Student <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                     <Button asChild size="lg" variant="outline" className="bg-background/50 backdrop-blur-md">
                        <Link href="/signup">Become a Tutor</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Search Section */}
        <section className="relative -mt-20 z-30 px-4">
            <div className="container">
                 <Card className="p-6 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <Select>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="9">Class 9</SelectItem>
                                <SelectItem value="10">Class 10</SelectItem>
                                <SelectItem value="11">Class 11</SelectItem>
                                <SelectItem value="12">Class 12</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="physics">Physics</SelectItem>
                                <SelectItem value="chemistry">Chemistry</SelectItem>
                                <SelectItem value="maths">Maths</SelectItem>
                                <SelectItem value="biology">Biology</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Location / Online" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="delhi">Delhi</SelectItem>
                                <SelectItem value="mumbai">Mumbai</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button size="lg" className="h-12 text-base"><Search className="mr-2 h-5 w-5"/> Search Tutors</Button>
                    </div>
                </Card>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="grid items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4">
                {features.map((feature) => (
                     <div key={feature.title} className="flex flex-col items-center text-center gap-3">
                        <div className="p-3 rounded-xl bg-muted border border-border">
                            {feature.icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl font-headline">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                     </div>
                ))}
            </div>
          </div>
        </section>

        {/* Free Study Material Section */}
        <section id="free-material" className="w-full py-20 md:py-28 bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Unlock a World of Knowledge, for Free</h2>
                        <ul className="space-y-4 text-lg text-foreground/80">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-accent mt-1 shrink-0"/>
                                <span>Access thousands of notes, previous year papers, and solutions.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-accent mt-1 shrink-0"/>
                                <span>Curated by expert educators to align with your syllabus.</span>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="h-6 w-6 text-accent mt-1 shrink-0"/>
                                <span>Boost your preparation and score higher in exams.</span>
                            </li>
                        </ul>
                        <Button asChild size="lg">
                            <Link href="/login-student">Explore Free Content <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </div>
                    <Illustration />
                </div>
            </div>
        </section>

        {/* Top Teachers Section */}
        <section id="top-teachers" className="w-full py-20 md:py-28">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tighter">Meet Our Top Educators</h2>
                  <p className="max-w-2xl mx-auto mt-4 text-muted-foreground md:text-lg">
                    Learn from the best. Our tutors are experienced, verified, and passionate about teaching.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {topTeachers.map(tutor => (
                        <Card key={tutor.name} className="overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                             <CardContent className="p-6 text-center flex flex-col items-center">
                                <Image src={tutor.avatar} alt={tutor.name} width={96} height={96} className="rounded-full mb-4 border-4 border-muted" />
                                <h3 className="font-bold text-xl font-headline">{tutor.name}</h3>
                                <p className="text-muted-foreground text-sm">{tutor.subject}</p>
                                <div className="flex items-center gap-4 mt-4">
                                     <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                        <span className="font-bold">{tutor.rating}</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <MessageSquare className="mr-2 h-4 w-4"/> Connect
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

         {/* Stats Section */}
        <section id="stats" className="w-full py-20 md:py-28">
            <div className="container px-4 md:px-6">
                <div className="bg-muted/50 border rounded-2xl p-12">
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map(stat => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary to-secondary">{stat.value}</p>
                                <p className="text-muted-foreground mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section id="cta" className="w-full py-20 md:py-28">
            <div className="container">
                <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center text-foreground border border-border">
                    <div className="absolute -inset-1/2 aurora-viz z-0 opacity-50"></div>
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10"></div>
                    <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                         <h2 className="text-3xl md:text-4xl font-bold font-headline">Start Learning with Confidence Today</h2>
                         <p className="text-lg text-foreground/80">
                            Whether you're a student eager to learn or a tutor ready to inspire, your journey begins here.
                         </p>
                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                                <Link href="/login-student">Join as a Student</Link>
                            </Button>
                            <Button asChild size="lg" variant="secondary" className="shadow-lg shadow-secondary/20">
                                <Link href="/signup">Register as a Tutor</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <ScrollToTop />
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-background">
          <div className="container flex flex-col sm:flex-row gap-4 py-6 items-center justify-between">
            <div className="flex items-center gap-2">
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="font-bold">EduConnect Pro</span>
            </div>
            <p className="text-xs text-muted-foreground">&copy; 2024 EduConnect Pro. All rights reserved.</p>
            <nav className="flex gap-4 sm:gap-6">
              <Link href="#" className="text-xs hover:underline underline-offset-4">
                Terms of Service
              </Link>
              <Link href="#" className="text-xs hover:underline underline-offset-4">
                Privacy Policy
              </Link>
            </nav>
          </div>
      </footer>
    </div>
  );
}
