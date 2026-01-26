'use client'

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Users, Link2, CheckCircle } from "lucide-react";
import placeholderData from "@/lib/placeholder-images.json";

const { placeholderImages } = placeholderData;

const features = [
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Discover People",
    description: "Browse profiles of other users on the platform and find new people to connect with.",
  },
  {
    icon: <Link2 className="h-10 w-10 text-primary" />,
    title: "Send Connection Requests",
    description: "Easily send a connection request to anyone you're interested in talking to.",
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-primary" />,
    title: "Manage Connections",
    description: "Keep track of your pending requests and manage your list of accepted connections in one place.",
  },
];

const getImageById = (id: string) => {
  return placeholderImages.find(img => img.id === id);
}

export default function Home() {
  const heroImage = getImageById('hero-section');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] lg:h-[70vh]">
            {heroImage && (
                <Image
                    alt="Hero Background"
                    className="object-cover"
                    data-ai-hint="social network abstract"
                    src={heroImage.src}
                    fill
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="relative container h-full px-4 md:px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                        Connect with New People
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                       A simple, fresh platform to discover and connect with other students.
                    </p>
                    <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row justify-center">
                        <Link
                            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            href="/signup"
                        >
                            Join Now
                        </Link>
                        <Link
                            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/80 backdrop-blur-sm px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            href="/login"
                        >
                            Login
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
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Core Features</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">A Simple Way to Connect</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to build your network, one connection at a time.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 md:grid-cols-3 lg:gap-8">
              {features.map((feature, index) => (
                    <div key={index} className="flex flex-col text-center items-center justify-start p-6">
                        <div className="mb-4 rounded-full bg-primary/10 p-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                    </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Ready to Get Started?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Create an account in seconds and start connecting with others.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Link
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                href="/signup"
              >
                Sign Up for Free
              </Link>
            </div>
          </div>
        </section>
      </main>
       <footer className="bg-background border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 flex justify-between items-center text-sm text-muted-foreground">
             <p>&copy; 2024 ConnectApp. All rights reserved.</p>
             <div className="flex items-center gap-4">
                 <Link href="#" className="hover:text-foreground">Terms</Link>
                 <Link href="#" className="hover:text-foreground">Privacy</Link>
             </div>
        </div>
      </footer>
    </div>
  );
}
