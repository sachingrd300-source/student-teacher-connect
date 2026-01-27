'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from "next/link";
import Image from 'next/image';
import { MainHeader } from "@/components/main-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, FileText, ArrowRight, Loader2, User, Briefcase, Star, School } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import placeholderImages from '@/lib/placeholder-images.json';
import { cn } from '@/lib/utils';


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const { hero, expertTeachers, interactiveBatches, organizedMaterials } = placeholderImages;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white">
            <Image
                src={hero.src}
                alt={hero.alt}
                fill
                className="object-cover"
                data-ai-hint={hero.hint}
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
            <div className="relative z-10 p-4 animate-fade-in-down max-w-4xl">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-serif shadow-lg">
                    Unlock Your Potential, Together.
                </h1>
                <p className="mt-6 max-w-2xl mx-auto md:text-xl text-primary-foreground/90">
                    The ultimate platform connecting dedicated teachers with eager students. Join a community of learners and educators today.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105">
                       <Link href="/signup">
                         Join as a Student
                         <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105">
                         <Link href="/signup/teacher">
                            Teach on Our Platform
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white dark:bg-gray-900">
            <div className="container px-4 md:px-6 space-y-20">
                 <div className="text-center space-y-4 animate-fade-in-up">
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">A Platform Built for Connection and Growth</h2>
                     <p className="max-w-3xl mx-auto text-foreground/80 md:text-xl">
                        We provide the tools and community to foster growth and learning for everyone.
                     </p>
                </div>
                {/* Feature 1 */}
                <div className="grid md:grid-cols-2 gap-12 items-center group animate-fade-in-up">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-semibold text-primary">Expert Teachers</div>
                        <h3 className="text-3xl font-bold font-serif">Learn from the Best</h3>
                        <p className="text-muted-foreground">Our platform attracts experienced and passionate educators dedicated to your success. Find a mentor who can guide you on your learning journey.</p>
                         <ul className="grid gap-2 py-2">
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Verified Educator Profiles</li>
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Diverse Subject Expertise</li>
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Direct Communication Channels</li>
                        </ul>
                    </div>
                    <div>
                        <Image src={expertTeachers.src} alt={expertTeachers.alt} width={expertTeachers.width} height={expertTeachers.height} className="rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-500" data-ai-hint={expertTeachers.hint} />
                    </div>
                </div>

                {/* Feature 2 */}
                <div className="grid md:grid-cols-2 gap-12 items-center group animate-fade-in-up [animation-delay:200ms]">
                    <div className="order-last md:order-first">
                         <Image src={interactiveBatches.src} alt={interactiveBatches.alt} width={interactiveBatches.width} height={interactiveBatches.height} className="rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-500" data-ai-hint={interactiveBatches.hint} />
                    </div>
                     <div className="space-y-4 md:text-right md:items-end flex flex-col">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-semibold text-primary">Interactive Batches</div>
                        <h3 className="text-3xl font-bold font-serif">Collaborate and Grow</h3>
                        <p className="text-muted-foreground">Join focused learning groups, interact with peers, and get personalized attention from your teacher. Learning is better when it's a shared experience.</p>
                        <ul className="grid gap-2 py-2">
                          <li className="flex items-center md:justify-end"><Star className="w-4 h-4 mr-2 md:mr-0 md:ml-2 text-accent order-first md:order-last" /> Small, Focused Group Sizes</li>
                          <li className="flex items-center md:justify-end"><Star className="w-4 h-4 mr-2 md:mr-0 md:ml-2 text-accent order-first md:order-last" /> Peer-to-Peer Learning</li>
                          <li className="flex items-center md:justify-end"><Star className="w-4 h-4 mr-2 md:mr-0 md:ml-2 text-accent order-first md:order-last" /> Live Announcements & Updates</li>
                        </ul>
                    </div>
                </div>

                 {/* Feature 3 */}
                <div className="grid md:grid-cols-2 gap-12 items-center group animate-fade-in-up [animation-delay:400ms]">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-semibold text-primary">Seamless Organization</div>
                        <h3 className="text-3xl font-bold font-serif">Everything in One Place</h3>
                        <p className="text-muted-foreground">Forget scattered notes and missed deadlines. Access all your study materials, announcements, and updates in one unified dashboard for each batch.</p>
                         <ul className="grid gap-2 py-2">
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Easy Material Uploads & Downloads</li>
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Centralized Announcement Feed</li>
                          <li className="flex items-center"><Star className="w-4 h-4 mr-2 text-accent" /> Clear and Simple Interface</li>
                        </ul>
                    </div>
                    <div>
                        <Image src={organizedMaterials.src} alt={organizedMaterials.alt} width={organizedMaterials.width} height={organizedMaterials.height} className="rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-500" data-ai-hint={organizedMaterials.hint} />
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12 animate-fade-in-up">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">Loved by Students and Teachers</h2>
              <p className="max-w-3xl mx-auto text-foreground/80 md:text-xl">
                See what members of our community are saying about their experience.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up [animation-delay:200ms]">
              <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback>AS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Anjali Sharma</p>
                      <p className="text-sm text-muted-foreground">Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"This platform completely changed how I study. The batch system helps me stay focused, and my teacher is always available to help. I'm finally understanding complex topics!"</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback>RK</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Ravi Kumar</p>
                      <p className="text-sm text-muted-foreground">Teacher</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"As a teacher, managing multiple student groups was always a challenge. Now, with dedicated batches and easy material sharing, I can focus on what I do best: teaching."</p>
                </CardContent>
              </Card>
               <Card className="md:col-span-2 lg:col-span-1 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback>PM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Priya Mehta</p>
                      <p className="text-sm text-muted-foreground">Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"The announcement feature is a lifesaver! I never miss an update about class cancellations or test schedules. It's so much better than checking multiple WhatsApp groups."</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-background">
             <div className="container px-4 md:px-6 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-serif">Ready to Join?</h2>
                <p className="max-w-2xl mx-auto text-foreground/80 md:text-xl">
                    Create an account and start your learning or teaching journey with us today. It's free to get started.
                </p>
                <div className="w-full max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <Link href="/signup" className="group flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:shadow-2xl hover:scale-105 hover:border-primary transition-all duration-300">
                        <User className="h-12 w-12 mb-4 text-primary transition-transform group-hover:scale-110" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Join as a Student</h3>
                        <p className="text-muted-foreground text-center">Find teachers, join batches, and start learning.</p>
                    </Link>
                    <Link href="/signup/teacher" className="group flex flex-col items-center justify-center p-8 rounded-lg border bg-card hover:shadow-2xl hover:scale-105 hover:border-primary transition-all duration-300">
                        <Briefcase className="h-12 w-12 mb-4 text-primary transition-transform group-hover:scale-110" />
                        <h3 className="text-2xl font-bold font-serif mb-2">Join as a Teacher</h3>
                        <p className="text-muted-foreground text-center">Create batches, manage students, and share your knowledge.</p>
                    </Link>
                </div>
            </div>
        </section>
      </main>
       <footer className="bg-muted border-t">
        <div className="container mx-auto py-8 px-4 md:px-6 text-sm text-muted-foreground">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <School className="h-6 w-6 text-primary" />
                        <span className="text-lg font-semibold font-serif text-foreground">My App</span>
                    </div>
                    <p>Connecting teachers and students for a better learning experience.</p>
                </div>
                <div className="grid grid-cols-2 md:col-span-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-foreground mb-3">Platform</h4>
                        <ul className="space-y-2">
                            <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                            <li><Link href="/signup/teacher" className="hover:text-primary">For Teachers</Link></li>
                            <li><Link href="/signup" className="hover:text-primary">For Students</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-foreground mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
             <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row justify-between items-center">
                <p>&copy; 2024 My App. All rights reserved.</p>
                 {/* Social links placeholder */}
             </div>
        </div>
      </footer>
    </div>
  );
}
