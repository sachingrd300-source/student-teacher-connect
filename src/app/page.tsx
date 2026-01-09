
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { UserCheck, BookOpen, Star, BadgeCheck } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';
import { tutorsData } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <UserCheck className="h-8 w-8 text-primary" />,
    title: 'For Tutors',
    description: 'Showcase your expertise, manage your schedule, and connect with potential students in your area.',
    isStudent: false,
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'For Students',
    description: 'Access notes, practice with DPPs, track your performance, and stay updated with your class schedule in real-time.',
    isStudent: true,
  }
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-card">
           {heroImage && (
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover opacity-10"
                data-ai-hint={heroImage.imageHint}
                priority
            />
           )}
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight text-foreground">
              Connecting Teachers and Students
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              EduConnect Pro is the all-in-one platform for a seamless learning experience.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">A Platform for Success</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                Tailored experiences for every role in the educational journey.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col text-center items-center p-6 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="flex-col sm:flex-row gap-2 mt-4">
                    {feature.isStudent ? (
                        <>
                          <Button variant="outline" asChild>
                            <Link href="/dashboard/student/study-material">Free Content</Link>
                          </Button>
                          <Button asChild>
                            <Link href="/dashboard/student">My Dashboard</Link>
                          </Button>
                        </>
                    ) : (
                      <Button variant="link" asChild className="text-primary">
                        <Link href="/dashboard/teacher">Explore {feature.title} &rarr;</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Find a Tutor Section */}
        <section id="find-tutor" className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Find the Perfect Tutor</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                Browse our community of verified and experienced educators.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tutorsData.map((tutor) => (
                <Card key={tutor.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image src={tutor.avatarUrl} alt={tutor.name} fill className="object-cover" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold font-headline text-xl">{tutor.name}</h3>
                        {tutor.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{tutor.qualification}</p>
                     <div className="flex items-center gap-1 text-yellow-500 mt-2">
                        <Star className="h-4 w-4 fill-current"/>
                        <Star className="h-4 w-4 fill-current"/>
                        <Star className="h-4 w-4 fill-current"/>
                        <Star className="h-4 w-4 fill-current"/>
                        <Star className="h-4 w-4 fill-current/50"/>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {tutor.subjects.slice(0, 2).map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                        {tutor.subjects.length > 2 && <Badge variant="outline">+{tutor.subjects.length - 2} more</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/50">
                    <Button asChild className="w-full">
                      <Link href={`/tutor/${tutor.id}`}>View Profile</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 md:py-28 bg-card">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Transform Education?</h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              Explore the dashboard to see what EduConnect Pro has to offer.
            </p>
            <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-6 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EduConnect Pro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
