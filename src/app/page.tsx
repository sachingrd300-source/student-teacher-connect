
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, FlaskConical, CalendarCheck, CheckCircle } from "lucide-react";

const features = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Class & Student Management",
    description: "Easily create classes, manage student enrollments, and keep track of your student roster in one place.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: "Study Materials Hub",
    description: "Upload, organize, and share study materials like notes, books, and homework with your students effortlessly.",
  },
  {
    icon: <CalendarCheck className="h-8 w-8 text-primary" />,
    title: "Attendance Tracking",
    description: "Take daily attendance for your classes with a simple and intuitive interface, and let students view their records.",
  },
  {
    icon: <FlaskConical className="h-8 w-8 text-primary" />,
    title: "AI Test Generator",
    description: "Save time by using our AI-powered tool to generate multiple-choice tests on any topic, ready to be assigned.",
  },
];

const testimonials = [
  {
    quote: "EduConnect Pro has revolutionized how I manage my classes. The AI test generator is a game-changer!",
    name: "Rajesh Kumar",
    role: "Physics Teacher",
  },
  {
    quote: "As a student, having all my study materials and attendance in one dashboard is incredibly helpful. The platform is so easy to use.",
    name: "Priya Sharma",
    role: "Class 10 Student",
  },
  {
    quote: "The ability to manage multiple batches and enroll students seamlessly has made my life so much easier. Highly recommended!",
    name: "Anjali Mehta",
    role: "Math Tutor",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                    The Smart Way to Connect Teachers and Students
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    EduConnect Pro is the all-in-one platform for seamless
                    teacher-student collaboration. Manage classes, share materials, track attendance, and generate tests with AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    href="/signup"
                  >
                    Get Started as a Teacher
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    href="/login"
                  >
                    Login
                  </Link>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                data-ai-hint="classroom students"
                height="550"
                src="https://picsum.photos/seed/hero/600/400"
                width="600"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A powerful suite of tools designed to enhance the learning experience for both teachers and students.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    {feature.icon}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Simple for Teachers, Powerful for Students</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Get started in just a few easy steps.
              </p>
            </div>
            <div className="mx-auto w-full max-w-4xl grid md:grid-cols-2 gap-8 pt-8">
              <div className="flex flex-col items-center gap-4">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-primary-foreground text-sm">For Teachers</div>
                <ul className="space-y-4 text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Create a free account and set up your teacher profile.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Create classes for your different subjects and batches.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Enroll existing students or create new student logins in seconds.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Upload materials, track attendance, and create tests with AI.</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-secondary-foreground text-sm">For Students</div>
                <ul className="space-y-4 text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Sign up with your email or get login details from your teacher.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Log in to your personal dashboard to see all your classes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Access study materials and check your attendance records.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <span>Take tests assigned by your teachers and view your results instantly.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Testimonials</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">Loved by Teachers & Students</h2>
                 <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear what our users have to say about their experience with EduConnect Pro.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0">
                    <p className="text-muted-foreground">"{testimonial.quote}"</p>
                    <div className="mt-4">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Ready to Transform Your Teaching?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join EduConnect Pro today and unlock a world of seamless collaboration and powerful teaching tools. It's free to get started!
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
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 EduConnect Pro. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
