'use client'

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { School, User, Briefcase } from "lucide-react";

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-10">
            <div className="space-y-4">
                <School className="h-16 w-16 text-primary mx-auto" />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                    Welcome to Your Learning Community
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Connecting students and teachers. Choose your path to get started.
                </p>
            </div>
            <div className="w-full max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/login" className="flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <User className="h-12 w-12 mb-4 text-primary" />
                    <h2 className="text-2xl font-bold font-serif mb-2">For Students</h2>
                    <p className="text-muted-foreground text-center">Login or sign up to find teachers and join batches.</p>
                </Link>
                 <Link href="/signup/student" className="flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Briefcase className="h-12 w-12 mb-4 text-primary" />
                    <h2 className="text-2xl font-bold font-serif mb-2">For Teachers</h2>
                    <p className="text-muted-foreground text-center">Login or sign up to manage batches and students.</p>
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
