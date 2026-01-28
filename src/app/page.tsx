'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from "next/link";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MainHeader } from "@/components/main-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Loader2, School, CheckCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import placeholderImages from '@/lib/placeholder-images.json';

const fadeIn = (delay = 0, duration = 0.5) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration,
      ease: "easeOut",
    },
  },
});

const detailedFeatures = [
    {
        title: "Empower Teachers to Create and Inspire",
        description: "Our platform provides teachers with a powerful suite of tools to manage their classroom digitally. From creating batches with unique codes to sharing materials and posting real-time announcements, we streamline the administrative work so you can focus on teaching.",
        points: [
            "Simple Batch Creation & Management",
            "Secure Student Enrollment System",
            "Instant Announcements & Updates",
            "Effortless Study Material Sharing",
        ],
        image: placeholderImages.featureTeacher,
        imagePosition: "left" as const,
    },
    {
        title: "A Streamlined Learning Hub for Students",
        description: "Students get a personalized dashboard that brings everything they need into one place. Access study materials, check test results, view announcements, and track fee payments for all your batches. Our clear and organized interface helps you stay on top of your studies.",
        points: [
            "All Your Batches in One Dashboard",
            "Easy Access to Notes and Materials",
            "Track Your Test Performance & Results",
            "Stay Informed with Fee & Announcement Tracking",
        ],
        image: placeholderImages.featureStudent,
        imagePosition: "right" as const,
    },
    {
        title: "A Secure Platform Built for Growth",
        description: "EduConnect Pro is built on a secure, role-based architecture. Admins have a global view to manage platform-wide features like the Shop and Free Materials, while our robust fee management and home-booking systems provide avenues for expansion.",
        points: [
          "Role-based access for Admins, Teachers, and Students",
          "Centralized Fee, Shop, and Booking Management",
          "Free material distribution for all students",
          "Built on a scalable and secure Firebase foundation",
        ],
        image: placeholderImages.featureAdmin,
        imagePosition: "left" as const,
      },
];


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
        <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
            <School className="h-16 w-16 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading Your Experience...</p>
        </div>
    );
  }

  const { hero, dashboardPreview } = placeholderImages;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
            <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn()}
                    className="space-y-6 text-center md:text-left"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
                        Modern Education, <span className="text-primary">Seamlessly Connected.</span>
                    </h1>
                    <p className="max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                        EduConnect Pro is the ultimate platform connecting dedicated teachers with eager students. Manage batches, share materials, and track progress, all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button asChild size="lg" className="font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all">
                           <Link href="/signup">
                             Get Started Free
                             <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="font-semibold transition-all hover:scale-105">
                             <Link href="/login/teacher">
                                I'm a Teacher
                            </Link>
                        </Button>
                    </div>
                </motion.div>
                 <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn(0.2)}
                 >
                    <Image
                        src={hero.src}
                        alt={hero.alt}
                        width={hero.width}
                        height={hero.height}
                        className="rounded-xl shadow-2xl"
                        data-ai-hint={hero.hint}
                        priority
                    />
                </motion.div>
            </div>
        </section>
        
        {/* Detailed Features Section */}
        <section id="features" className="py-16 md:py-24 bg-muted/50">
            <div className="container px-4 md:px-6 space-y-24">
                 <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn()}
                    className="text-center space-y-4"
                >
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">A Platform Built for Connection and Growth</h2>
                     <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                        We provide dedicated tools and a connected community to foster growth and learning for everyone involved.
                     </p>
                </motion.div>
                {detailedFeatures.map((feature, i) => (
                    <motion.div
                        key={feature.title}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeIn(0.2)}
                        className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center`}
                    >
                        <div className={`space-y-6 ${feature.imagePosition === 'right' ? 'md:order-1' : 'md:order-2'}`}>
                            <h3 className="text-3xl font-bold tracking-tight">{feature.title}</h3>
                            <p className="text-muted-foreground md:text-lg">{feature.description}</p>
                            <ul className="space-y-4">
                                {feature.points.map(point => (
                                    <li key={point} className="flex items-start">
                                        <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-foreground font-medium">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`${feature.imagePosition === 'right' ? 'md:order-2' : 'md:order-1'}`}>
                            <Image
                                src={feature.image.src}
                                alt={feature.image.alt}
                                width={feature.image.width}
                                height={feature.image.height}
                                className="rounded-xl shadow-2xl"
                                data-ai-hint={feature.image.hint}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
             <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn()}
                    className="text-center space-y-4 mb-16"
                >
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Get Started in Minutes</h2>
                     <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                        Joining our platform is simple and straightforward for both students and teachers.
                     </p>
                </motion.div>
                <div className="relative grid md:grid-cols-3 gap-8">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 hidden md:block"></div>
                    {steps.map((step, i) => (
                      <motion.div
                        key={step.title}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                        variants={fadeIn(i * 0.15)}
                        className="relative"
                      >
                        <div className="relative z-10 flex flex-col items-center text-center p-6 bg-background">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-6 ring-8 ring-background">{i + 1}</div>
                            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                </div>
             </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="dashboard-preview" className="py-16 md:py-24 bg-muted/50">
            <div className="container px-4 md:px-6">
                 <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn()}
                    className="text-center space-y-4 mb-12"
                >
                     <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Your All-in-One Dashboard</h2>
                     <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                        A single, powerful interface to manage everything. No more juggling between apps.
                     </p>
                </motion.div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeIn()}
                    className="max-w-5xl mx-auto"
                >
                  <div className="rounded-xl shadow-2xl overflow-hidden border">
                    <Image src={dashboardPreview.src} alt={dashboardPreview.alt} width={dashboardPreview.width} height={dashboardPreview.height} className="w-full" data-ai-hint={dashboardPreview.hint} />
                  </div>
                </motion.div>
            </div>
        </section>


        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn()}
                className="text-center space-y-4 mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Loved by Students and Teachers</h2>
              <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                See what members of our community are saying about their experience.
              </p>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={testimonial.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={fadeIn(i * 0.1)}
                >
                  <Card className="h-full flex flex-col">
                    <CardContent className="p-6 flex-grow">
                      <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                    </CardContent>
                    <CardHeader className="flex flex-row items-center gap-4 pt-0">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{testimonial.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

        {/* Footer */}
       <footer className="bg-muted border-t mt-16">
        <div className="container mx-auto py-12 px-4 md:px-6">
            <div className="grid md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-4">
                     <Link className="flex items-center gap-2 font-semibold" href="/">
                        <School className="h-6 w-6 text-primary" />
                        <span className="text-lg font-semibold">EduConnect Pro</span>
                    </Link>
                    <p className="text-muted-foreground">Connecting teachers and students for a better learning experience.</p>
                     <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} EduConnect Pro. All rights reserved.</p>
                </div>
                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                        <ul className="space-y-3">
                            <li><Link href="#features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                            <li><Link href="/signup/teacher" className="text-muted-foreground hover:text-primary">For Teachers</Link></li>
                            <li><Link href="/signup" className="text-muted-foreground hover:text-primary">For Students</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-foreground mb-4">Account</h4>
                        <ul className="space-y-3">
                            <li><Link href="/login" className="text-muted-foreground hover:text-primary">Student Login</Link></li>
                            <li><Link href="/login/teacher" className="text-muted-foreground hover:text-primary">Teacher Login</Link></li>
                            <li><Link href="/signup" className="text-muted-foreground hover:text-primary">Sign Up</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

const steps = [
    {
        title: "Create an Account",
        description: "Sign up in seconds as either a student or a teacher. It's completely free to get started."
    },
    {
        title: "Join or Create a Batch",
        description: "Students can join a batch using a unique code. Teachers can create and customize their batches."
    },
    {
        title: "Start Learning/Teaching",
        description: "Access all your materials, announcements, and tools in one organized dashboard."
    }
];

const testimonials = [
  {
    name: "Anjali Sharma",
    initials: "AS",
    role: "Student",
    quote: "This platform completely changed how I study. The batch system helps me stay focused, and my teacher is always available to help. I'm finally understanding complex topics!"
  },
  {
    name: "Ravi Kumar",
    initials: "RK",
    role: "Teacher",
    quote: "As a teacher, managing multiple student groups was always a challenge. Now, with dedicated batches and easy material sharing, I can focus on what I do best: teaching."
  },
  {
    name: "Priya Mehta",
    initials: "PM",
    role: "Student",
    quote: "The announcement feature is a lifesaver! I never miss an update about class cancellations or test schedules. It's so much better than checking multiple WhatsApp groups."
  }
];
