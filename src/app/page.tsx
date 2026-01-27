'use client'

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { School } from "lucide-react";

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-6">
            <School className="h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                Welcome to Your App
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                This is a fresh start. Login or sign up to continue.
            </p>
            <div className="mt-6 flex flex-col gap-4 min-[400px]:flex-row justify-center">
                <Link href="/signup">
                    <Button size="lg">Get Started</Button>
                </Link>
                 <Link href="/login">
                    <Button size="lg" variant="secondary">Login</Button>
                </Link>
            </div>
        </div>
      </main>
       <footer className="bg-muted border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 flex justify-center items-center text-sm text-muted-foreground">
             <p>&copy; 2024 Your App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
