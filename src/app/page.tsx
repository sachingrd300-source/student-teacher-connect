'use client'

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { BookCopy, BrainCircuit, Users, Search } from "lucide-react";
import placeholderData from "@/lib/placeholder-images.json";

const { placeholderImages } = placeholderData;

const appFeatures = [
  {
    icon: <Search className="h-8 w-8" />,
    title: "Find Local Tutors",
    description: "Easily search and find verified teachers near your location.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Connect Directly",
    description: "Send connection requests to teachers and manage your connections.",
  },
  {
    icon: <BookCopy className="h-8 w-8" />,
    title: "Simple & Focused",
    description: "A clean, straightforward platform to connect students and teachers.",
  },
];


const getImageById = (id: string) => {
  return placeholderImages.find(img => img.id === id);
}

export default function Home() {
  const heroImage = getImageById('hero-section');
  const teachersImage = getImageById('empowering-teachers');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] lg:h-[80vh]">
            {heroImage && (
                <Image
                    alt="Teacher helping students"
                    className="object-cover"
                    data-ai-hint="teacher classroom"
                    src={heroImage.src}
                    fill
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="relative container h-full px-4 md:px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                        Find the Best Local Tutors, Simply
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                       The simplest way for students to find and connect with trusted teachers in their area.
                    </p>
                    <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row justify-center">
                        <Link
                            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            href="/signup"
                        >
                            Get Started
                        </Link>
                         <Link
                            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/80 backdrop-blur-sm px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            href="/tutors"
                        >
                            Browse Tutors
                        </Link>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
                    <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">A Better Way to Connect</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        We've removed the complexity. Our platform focuses on one thing: connecting students with the right teachers.
                    </p>
                </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
                {teachersImage && <Image
                    alt="Teacher using a laptop"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last lg:col-span-2 shadow-xl"
                    data-ai-hint={teachersImage.hint}
                    src={teachersImage.src}
                    width={teachersImage.width}
                    height={teachersImage.height}
                />}
                <div className="flex flex-col justify-center space-y-4 lg:col-span-1">
                    <div className="grid gap-6">
                        {appFeatures.map((feature, index) => (
                             <div key={index} className="flex gap-4">
                                <div className="p-1">{feature.icon}</div>
                                <div>
                                    <h3 className="text-lg font-bold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Get Started Today</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Whether you're a teacher looking for students or a student looking for a teacher, sign up now to get connected.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Link
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                href="/signup"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </section>
      </main>
       <footer className="bg-muted border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 flex justify-between items-center text-sm text-muted-foreground">
             <p>&copy; 2024 EduConnect Pro. All rights reserved.</p>
             <div className="flex items-center gap-4">
                 <Link href="#" className="hover:text-foreground">Terms</Link>
                 <Link href="#" className="hover:text-foreground">Privacy</Link>
             </div>
        </div>
      </footer>
    </div>
  );
}
