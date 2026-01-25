
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, CalendarCheck, FlaskConical, ArrowRight, Landmark, Palette, CheckCircle, Quote, School, ShieldCheck } from "lucide-react";
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

const InstagramIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current">
        <title>Instagram</title>
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.784.305-1.459.717-2.126 1.384S.935 3.356.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.783.718 1.458 1.384 2.126s1.343.922 2.126 1.22c.765.297 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.783-.306 1.458-.718 2.126-1.384s.922-1.343 1.22-2.126c.297-.765.499-1.636.558-2.913C23.988 15.667 24 15.26 24 12s-.015-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.783-.718-1.458-1.384-2.126S15.644.935 14.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.82.679-1.38.896-.423.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896 1.381.164.422.36 1.057.413 2.227-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249-1.805.413-2.227.217-.562.477.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413C8.415 2.175 8.797 2.16 12 2.16zm0 5.48c-2.454 0-4.444 1.99-4.444 4.444s1.99 4.444 4.444 4.444 4.444-1.99 4.444-4.444-1.99-4.444-4.444-4.444zm0 7.245c-1.545 0-2.8-1.255-2.8-2.8s1.255-2.8 2.8-2.8 2.8 1.255 2.8 2.8-1.255 2.8-2.8 2.8zm6.336-7.85c-.63 0-1.14-.51-1.14-1.14s.51-1.14 1.14-1.14 1.14.51 1.14 1.14-.51 1.14-1.14 1.14z"/>
    </svg>
);

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current">
        <title>WhatsApp</title>
        <path d="M12.04 2.004c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.49 1.32 4.95L2 22l6.23-1.64c1.43.83 3.03 1.25 4.72 1.25h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zM17.47 15.93c-.27.14-.99.49-1.14.54-.15.05-.26.08-.46-.08s-.73-.27-1.39-.86a7.61 7.61 0 0 1-1.2-1.05c-.15-.27-.03-.42.06-.56.09-.14.2-.23.27-.3.07-.07.11-.14.17-.23.05-.1.03-.18 0-.27s-.46-1.1-.63-1.51c-.17-.4-.35-.34-.46-.34H11.3c-.1 0-.27.12-.42.27-.14.15-.54.52-.54 1.27s.55 1.47.63 1.57.9 1.58 2.2 2.18c.21.1.36.16.49.21.43.17.69.14.94.08.29-.05.9-.37 1.02-.72.13-.35.13-.65.09-.72-.04-.07-.15-.11-.3-.2z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current">
        <title>Telegram</title>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.17.91-.494 1.208-.822 1.23-.696.04-1.22-.46-1.89-1.05-.98-1.04-1.55-1.5-1.8-1.92-.25-.42-.04-.66.12-.86.17-.2.37-.38.51-.51.17-.15.34-.31.5-.46.3-.3.61-.6.31-.95-.12-.13-.3-.04-.42.03-.18.1-.38.22-.6.35-1.02.6-1.57.8-2.01.75-.49-.05-1.32-.42-1.87-.63-.6-.23-1.08-.35-1.01-.78.04-.26.32-.52.88-.73.96-.36 1.77-.55 2.33-.67.86-.18 1.45-.25 1.83-.26.02-.002.04 0 .059-.001.3-.01.57-.02.77-.02.22 0 .42.01.6.04.03.003.06.007.08.01zm-1.85 5.547c.18.17.31.3.41.4.31.31.32.74.02.94-.3.2-.55.02-.66-.09-.07-.06-.13-.12-.2-.2l-.28-.27c-.28-.27-.52-.51-.32-.82.2-.32.51-.12.65-.01z"/>
    </svg>
);


export default function Home() {

  const heroImage = getImageById('hero-section');
  const empoweringTeachersImage = getImageById('empowering-teachers');
  const builtForStudentsImage = getImageById('built-for-students');

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
                  Access a comprehensive, open library of free resources, including special materials for the Jharkhand Board (Class 10 & 12). No login required.
                </p>
              </div>
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-4">
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
                   <Card className="text-center p-6 bg-primary/10 border-2 border-primary">
                        <div className="flex justify-center mb-4"><ShieldCheck className="h-10 w-10 text-primary"/></div>
                        <CardTitle className="text-xl">Jharkhand Board</CardTitle>
                        <CardDescription>All materials for Class 10 & 12 absolutely free.</CardDescription>
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

        {/* Empowering Teachers Section */}
        <section id="platform-tour" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">For Teachers</div>
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Teach Smarter, Not Harder</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides you with the tools to reduce administrative work and focus on what you do best: teaching.
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Save Time with AI</h3>
                    <p className="text-sm text-muted-foreground">Generate complete tests and draft announcements in seconds, freeing up valuable prep time.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                   <div>
                    <h3 className="font-semibold">Centralized Class Hub</h3>
                    <p className="text-sm text-muted-foreground">Manage students, share materials, and track attendance all from one easy-to-use dashboard.</p>
                  </div>
                </li>
                 <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                   <div>
                    <h3 className="font-semibold">Gain Actionable Insights</h3>
                    <p className="text-sm text-muted-foreground">Use the AI Performance Analyzer to quickly identify students who need extra help or praise.</p>
                  </div>
                </li>
              </ul>
            </div>
            {empoweringTeachersImage && (
                <Image
                    src={empoweringTeachersImage.src}
                    alt="Teacher using a laptop"
                    width={empoweringTeachersImage.width}
                    height={empoweringTeachersImage.height}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                    data-ai-hint={empoweringTeachersImage.hint}
                />
            )}
          </div>
        </section>

        {/* Built for Students Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
             {builtForStudentsImage && (
                <Image
                    src={builtForStudentsImage.src}
                    alt="Student studying with books"
                    width={builtForStudentsImage.width}
                    height={builtForStudentsImage.height}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                    data-ai-hint={builtForStudentsImage.hint}
                />
            )}
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">For Students</div>
              <h2 className="text-3xl font-bold font-serif tracking-tighter md:text-4xl/tight">Your Personal Learning Hub</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to stay organized, access resources, and get help when you need it.
              </p>
              <ul className="grid gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Find Tutors & Enroll Instantly</h3>
                    <p className="text-sm text-muted-foreground">Browse teacher profiles and enroll in their classes directly from the platform.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                   <div>
                    <h3 className="font-semibold">All Resources in One Place</h3>
                    <p className="text-sm text-muted-foreground">Access all your study materials, announcements, and test results from a single dashboard.</p>
                  </div>
                </li>
                 <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                   <div>
                    <h3 className="font-semibold">Get Instant Help with AI</h3>
                    <p className="text-sm text-muted-foreground">Stuck on a problem? Use the AI Question Solver to get step-by-step explanations 24/7.</p>
                  </div>
                </li>
              </ul>
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
                            <li><Link href="#platform-tour" className="text-sm text-muted-foreground hover:text-foreground">Platform Tour</Link></li>
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
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-foreground">Terms of Service</Link>
                    <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
                    <div className="flex gap-4">
                        <Link href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-foreground">
                            <WhatsAppIcon />
                        </Link>
                        <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                            <InstagramIcon />
                        </Link>
                        <Link href="#" aria-label="Telegram" className="text-muted-foreground hover:text-foreground">
                            <TelegramIcon />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

    