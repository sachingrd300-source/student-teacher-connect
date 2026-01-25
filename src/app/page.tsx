
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, CalendarCheck, FlaskConical, ArrowRight, Landmark, Palette, CheckCircle, Quote, School } from "lucide-react";
import placeholderData from "@/lib/placeholder-images.json";

const { placeholderImages } = placeholderData;

// New features with icons
const features = [
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Seamless Management",
    description: "Easily create classes, manage enrollments, and track your student roster in one intuitive dashboard.",
  },
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: "Centralized Resources",
    description: "Upload, organize, and share study materials like notes, PDFs, and videos with your students effortlessly.",
  },
  {
    icon: <CalendarCheck className="h-10 w-10 text-primary" />,
    title: "Simplified Attendance",
    description: "Take daily attendance for your classes with a simple toggle interface. Students can view their records anytime.",
  },
  {
    icon: <FlaskConical className="h-10 w-10 text-primary" />,
    title: "AI-Powered Tools",
    description: "Save hours of prep time. Use our AI to generate tests, get student performance insights, and even draft announcements.",
  },
];


const testimonials = [
  {
    quote: "EduConnect Pro has revolutionized how I manage my classes. The AI test generator is a game-changer!",
    name: "Rajesh Kumar",
    role: "Physics Teacher",
    avatarId: "testimonial-1",
  },
  {
    quote: "As a student, having all my study materials and attendance in one dashboard is incredibly helpful. The platform is so easy to use.",
    name: "Priya Sharma",
    role: "Class 10 Student",
    avatarId: "testimonial-2",
  },
  {
    quote: "The ability to manage multiple batches and enroll students seamlessly has made my life so much easier. Highly recommended!",
    name: "Anjali Mehta",
    role: "Math Tutor",
    avatarId: "testimonial-3",
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
        <section className="relative w-full h-[70vh] lg:h-[85vh]">
            {heroImage && (
                <Image
                    alt="Hero Background"
                    className="object-cover"
                    data-ai-hint={heroImage.hint}
                    src={heroImage.src}
                    fill
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="relative container h-full px-4 md:px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-serif text-foreground">
                        The Smart Way to Connect Teachers and Students
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-foreground/80 md:text-xl">
                        EduConnect Pro is the all-in-one platform for seamless collaboration. Manage classes, share materials, track attendance, and generate tests with AI.
                    </p>
                    <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row justify-center">
                        <Link
                            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            href="/signup"
                        >
                            Get Started Free
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
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A powerful suite of tools designed to enhance the learning experience for both teachers and students.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 md:grid-cols-2 lg:gap-8">
              {features.map((feature, index) => (
                    <Card key={index} className="flex flex-col text-center items-center justify-start p-6 transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="mb-4 rounded-full bg-primary/10 p-4">
                            {feature.icon}
                        </div>
                        <CardHeader className="p-0">
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-2">
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Free Materials Section */}
        <section id="resources" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Open Library</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">Free Study Materials</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Access a comprehensive, open library of free resources for Classes 8 to 12, covering Science, Commerce, and Arts streams. No login required.
                </p>
              </div>
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 pt-12 sm:grid-cols-3">
                  <Card className="text-center p-6">
                      <div className="flex justify-center mb-4"><FlaskConical className="h-10 w-10 text-primary"/></div>
                      <CardTitle className="text-xl">Science</CardTitle>
                      <CardDescription>Physics, Chemistry, Biology & Maths.</CardDescription>
                  </Card>
                   <Card className="text-center p-6">
                       <div className="flex justify-center mb-4"><Landmark className="h-10 w-10 text-primary"/></div>
                      <CardTitle className="text-xl">Commerce</CardTitle>
                      <CardDescription>Accounts, Economics & Business Studies.</CardDescription>
                  </Card>
                   <Card className="text-center p-6">
                       <div className="flex justify-center mb-4"><Palette className="h-10 w-10 text-primary"/></div>
                      <CardTitle className="text-xl">Arts</CardTitle>
                      <CardDescription>History, Geography, Political Science & more.</CardDescription>
                  </Card>
              </div>
              <div className="mx-auto max-w-5xl text-center mt-8">
                   <Link href="/materials">
                        <Button size="lg">
                            Browse Free Materials <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
              </div>
            </div>
          </div>
        </section>


        {/* How it works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Simple for Teachers, Powerful for Students</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Get up and running in just a few easy steps.
                </p>
              </div>
            </div>

             <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 items-start gap-10 pt-12">
                <Card className="p-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl">For Teachers</CardTitle>
                    <CardDescription>A complete toolkit to streamline your teaching.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 mt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Create a free account and set up your professional profile.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Create distinct classes for your different subjects and batches.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Enroll students by sharing a simple class code or creating logins.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Upload materials, track attendance, and create tests with AI.</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="p-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl">For Students</CardTitle>
                    <CardDescription>Your personal dashboard for success.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 mt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Sign up or log in with details from your teacher.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Join your classes by entering the unique code from your teacher.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Access all your study materials and class announcements in one place.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span>Check attendance, take tests, and view your results instantly.</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Testimonials</div>
                <h2 className="text-3xl font-bold font-serif tracking-tighter sm:text-5xl">Loved by Teachers & Students</h2>
                 <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear what our users have to say about their experience with EduConnect Pro.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 lg:grid-cols-3 lg:gap-8">
              {testimonials.map((testimonial) => {
                const avatar = getImageById(testimonial.avatarId);
                return (
                  <Card key={testimonial.name} className="flex flex-col p-6 bg-background">
                    <CardContent className="p-0 flex-grow flex flex-col">
                        <Quote className="h-8 w-8 text-primary mb-4" />
                      <p className="text-muted-foreground flex-grow">"{testimonial.quote}"</p>
                      <div className="mt-4 flex items-center gap-4 border-t pt-4">
                        {avatar && (
                           <Image
                              src={avatar.src}
                              alt={`Avatar of ${testimonial.name}`}
                              width={avatar.width}
                              height={avatar.height}
                              className="rounded-full"
                              data-ai-hint={avatar.hint}
                            />
                        )}
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40 border-t">
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
      <footer className="bg-background border-t">
        <div className="container mx-auto py-12 px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-4">
                <div className="space-y-4 md:col-span-1">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <School className="h-6 w-6 text-primary" />
                        <span className="text-lg font-serif">EduConnect Pro</span>
                    </Link>
                    <p className="text-sm text-muted-foreground">The smart platform to connect teachers and students seamlessly.</p>
                </div>
                <div className="grid grid-cols-2 md:col-span-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider uppercase">Platform</h3>
                        <ul className="mt-4 space-y-2">
                            <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
                            <li><Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it Works</Link></li>
                            <li><Link href="/materials" className="text-sm text-muted-foreground hover:text-foreground">Free Materials</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold tracking-wider uppercase">Company</h3>
                        <ul className="mt-4 space-y-2">
                            <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
                            <li><Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground">Testimonials</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                <p>&copy; 2024 EduConnect Pro. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-foreground">Terms of Service</Link>
                    <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
