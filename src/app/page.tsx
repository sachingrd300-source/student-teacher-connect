import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, BookOpen, UserCheck, ShieldCheck } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';

const features = [
  {
    icon: <UserCheck className="h-8 w-8 text-primary" />,
    title: 'For Teachers',
    description: 'Manage students, upload study materials, track attendance, and control your virtual classroom with powerful tools.',
    link: '/dashboard/teacher'
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'For Students',
    description: 'Access notes, practice with DPPs, track your performance, and stay updated with your class schedule in real-time.',
    link: '/dashboard/student'
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'For Parents',
    description: 'Monitor your child\'s academic progress, view attendance records, and receive important updates directly from teachers.',
    link: '/dashboard/parent'
  },
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
              Welcome to EduConnect Pro
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              The all-in-one platform connecting teachers, students, and parents for a seamless learning experience.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">A Platform for Everyone</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                Tailored experiences for every role in the educational journey.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col text-center items-center p-6 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                  <Button variant="link" asChild className="mt-4 text-primary">
                    <Link href={feature.link}>Explore {feature.title} &rarr;</Link>
                  </Button>
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
