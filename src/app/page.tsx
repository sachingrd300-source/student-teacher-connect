'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';

const features = [
    {
        icon: <User className="h-10 w-10 text-primary" />,
        title: 'For Students',
        description: 'Find the best tutors in your area, view their profiles, and connect with them instantly.',
        comingSoon: false,
    },
    {
        icon: <GraduationCap className="h-10 w-10 text-primary" />,
        title: 'For Teachers',
        description: 'Showcase your expertise, manage your classes, and connect with students seeking your knowledge.',
        comingSoon: false,
    },
    {
        icon: <CheckCircle className="h-10 w-10 text-primary" />,
        title: 'Verified Tutors',
        description: 'All tutors on our platform are manually verified to ensure quality and safety for our students.',
        comingSoon: false,
    }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-background overflow-hidden">
             <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
             <div className="container relative z-10 px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight">
                            Empowering Education, <span className="text-primary">Connecting Minds</span>
                        </h1>
                        <p className="max-w-[600px] mx-auto lg:mx-0 text-muted-foreground md:text-xl">
                            EduConnect Pro is a modern, all-in-one platform designed to bring teachers and students closer together for a richer learning experience.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button asChild size="lg">
                                <Link href="/login-student">Find a Tutor <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                             <Button asChild size="lg" variant="outline">
                                <Link href="/signup">Become a Tutor</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-64 md:h-96 lg:h-[450px] rounded-xl shadow-2xl overflow-hidden border-4 border-primary/10">
                         <Image
                            src="https://picsum.photos/seed/hero/1200/800"
                            alt="A student learning on a tablet in a modern classroom setting."
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            data-ai-hint="education learning"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform is packed with powerful features to enhance the teaching and learning process.
              </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
                {features.map((feature) => (
                     <Card key={feature.title} className="hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="flex flex-col items-center text-center gap-4">
                            {feature.icon}
                            <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            <p>{feature.description}</p>
                            {feature.comingSoon && <p className="mt-2 text-primary font-semibold">(Coming Soon)</p>}
                        </CardContent>
                     </Card>
                ))}
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
