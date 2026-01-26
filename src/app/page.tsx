
'use client'

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { BookCopy, BrainCircuit, CalendarCheck, Users } from "lucide-react";
import placeholderData from "@/lib/placeholder-images.json";

const { placeholderImages } = placeholderData;

const teacherFeatures = [
  {
    icon: <BookCopy className="h-8 w-8" />,
    title: "Class Management",
    description: "Easily create and manage your classes, subjects, and batch timings.",
  },
  {
    icon: <CalendarCheck className="h-8 w-8" />,
    title: "Attendance Tracking",
    description: "Take daily attendance and view detailed reports for each class.",
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: "AI-Powered Tools",
    description: "Generate lesson plans, tests, and study guides with our smart assistants.",
  },
];

const studentFeatures = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Find Tutors & Classes",
      description: "Browse profiles of verified teachers and enroll in their classes.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Connect with Peers",
      description: "Connect with other students on the platform to study together and share knowledge.",
    },
    {
      icon: <BrainCircuit className="h-8 w-8" />,
      title: "AI Learning Aids",
      description: "Use AI to solve questions, generate study guides, and improve your English.",
    },
  ];

const getImageById = (id: string) => {
  return placeholderImages.find(img => img.id === id);
}

export default function Home() {
  const heroImage = getImageById('hero-section');
  const teachersImage = getImageById('empowering-teachers');
  const studentsImage = getImageById('built-for-students');

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
                        Empowering Teachers, Inspiring Students
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                       The all-in-one platform for coaching centers to manage classes, engage students, and leverage the power of AI.
                    </p>
                    <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row justify-center">
                        <Link
                            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            href="/signup"
                        >
                            Get Started for Free
                        </Link>
                         <Link
                            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/80 backdrop-blur-sm px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            href="/tutors"
                        >
                            Find a Tutor
                        </Link>
                    </div>
                </div>
            </div>
        </section>

        {/* For Teachers Section */}
        <section id="teachers" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">For Teachers</div>
                    <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-4xl">Tools to Empower Your Teaching</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                        Streamline your administrative tasks and focus on what you do best: teaching. Our platform provides everything you need to run your coaching center efficiently.
                    </p>
                    <div className="grid gap-6 mt-6">
                        {teacherFeatures.map((feature, index) => (
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
                <div className="flex items-center justify-center">
                    {teachersImage && <Image
                        alt="Teacher using a laptop"
                        className="rounded-xl object-cover shadow-xl"
                        data-ai-hint={teachersImage.hint}
                        src={teachersImage.src}
                        width={teachersImage.width}
                        height={teachersImage.height}
                    />}
                </div>
            </div>
          </div>
        </section>

        {/* For Students Section */}
         <section id="students" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                 <div className="flex items-center justify-center lg:order-last">
                    {studentsImage && <Image
                        alt="Student studying"
                        className="rounded-xl object-cover shadow-xl"
                        data-ai-hint={studentsImage.hint}
                        src={studentsImage.src}
                        width={studentsImage.width}
                        height={studentsImage.height}
                    />}
                </div>
                <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">For Students</div>
                    <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-4xl">Your Partner in Learning</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                        Find the best tutors, access helpful resources, and connect with a community of learners to excel in your studies.
                    </p>
                    <div className="grid gap-6 mt-6">
                        {studentFeatures.map((feature, index) => (
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
        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted/40">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Join the Future of Coaching</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Whether you're a teacher looking to grow or a student aiming for the top, EduConnect Pro is for you.
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
       <footer className="bg-background border-t">
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
