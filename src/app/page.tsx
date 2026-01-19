
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { User, GraduationCap, CheckCircle, ArrowRight, BookOpen, MessageSquare, ShoppingCart, Star, Search, LogIn, Quote } from 'lucide-react';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const howItWorks = [
    {
        icon: <Search className="h-8 w-8 text-primary" />,
        title: '1. Find Your Tutor',
        description: 'Explore our extensive list of verified tutors. Filter by subject, location, and more to find your perfect match.',
    },
    {
        icon: <LogIn className="h-8 w-8 text-primary" />,
        title: '2. Join a Class',
        description: 'Use the unique class code from your tutor to send an enrollment request and join your batch.',
    },
    {
        icon: <GraduationCap className="h-8 w-8 text-primary" />,
        title: '3. Start Learning',
        description: 'Access class materials, view your schedule, track your performance, and engage with your learning community.',
    },
]

const features = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: 'Find Top Tutors',
    description: 'Browse profiles, check qualifications, and connect with the best tutors for your needs.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Free Study Material',
    description: 'Access a rich library of free notes, practice papers, and resources shared by our community.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Direct Communication',
    description: 'Connect directly with tutors and students via WhatsApp for seamless communication.',
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: 'Marketplace',
    description: 'Buy and sell new or used books, notes, and equipment in the student marketplace.',
  },
];

const stats = [
    { number: "10,000+", label: "Happy Students" },
    { number: "1,200+", label: "Verified Tutors" },
    { number: "5,000+", label: "Free Resources" },
    { number: "24/7", label: "Fast Support" },
]


export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-2');
  
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const ads = React.useMemo(() => [
    {
      title: "Boost Your Exam Prep",
      description: "Get exclusive access to premium question banks and mock tests.",
      image: PlaceHolderImages.find(img => img.id === 'ad-1'),
    },
    {
      title: "IIT-JEE Masterclass",
      description: "Join our intensive masterclass series with top-ranked educators.",
      image: PlaceHolderImages.find(img => img.id === 'ad-2'),
    },
    {
      title: "Sell Your Old Books",
      description: "Make money from your used textbooks. List them on our marketplace now!",
      image: PlaceHolderImages.find(img => img.id === 'ad-3'),
    }
  ], []);

  const topTutors = React.useMemo(() => [
    {
        name: "Dr. Ananya Sharma",
        subject: "Physics, IIT-JEE",
        rating: 5,
        image: PlaceHolderImages.find(img => img.id === 'landing-tutor-1'),
    },
    {
        name: "Rohan Verma",
        subject: "Mathematics, Class 12",
        rating: 5,
        image: PlaceHolderImages.find(img => img.id === 'landing-tutor-2'),
    },
    {
        name: "Priya Singh",
        subject: "Chemistry, NEET",
        rating: 4.9,
        image: PlaceHolderImages.find(img => img.id === 'landing-tutor-3'),
    },
     {
        name: "Amit Kumar",
        subject: "Biology, Class 10",
        rating: 4.9,
        image: PlaceHolderImages.find(img => img.id === 'landing-tutor-4'),
    },
  ], []);

  const testimonials = React.useMemo(() => [
    {
        quote: "The one-on-one sessions have been a game-changer for my NEET preparation. My physics concepts are finally clear!",
        name: "Riya Sharma",
        role: "Class 12 Student",
        rating: 5,
        image: PlaceHolderImages.find(img => img.id === 'testimonial-student-2'),
    },
    {
        quote: "As a tutor, this platform has made managing my batches and sharing materials incredibly easy. The AI tools are a huge time-saver.",
        name: "Prof. Alok Nath",
        role: "IIT-JEE Physics Tutor",
        rating: 5,
        image: PlaceHolderImages.find(img => img.id === 'testimonial-tutor-1'),
    },
    {
        quote: "I found a great tutor for Mathematics and was able to clear my doubts before the board exams. The marketplace is great for finding cheap books too.",
        name: "Arjun Singh",
        role: "Class 10 Student",
        rating: 5,
        image: PlaceHolderImages.find(img => img.id === 'testimonial-student-1'),
    }
], []);


  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 -z-10" />
          <div className="container px-4 md:px-6 py-20 md:py-32 lg:py-40">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-24">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    The Ultimate Platform for Tutors and Students
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    EduConnect Pro provides seamless tools for teachers to manage classes and for students to find the best tutors.
                  </p>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl pt-2">
                    Earn by selling your notes, books, and other materials. Both students and teachers can become sellers in our marketplace.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="button-glow">
                    <Link href="/login-student">I'm a Student</Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                     <Link href="/signup">Become a Tutor</Link>
                  </Button>
                </div>
              </div>
               {heroImage && (
                <div className="relative w-full h-64 lg:h-auto rounded-xl overflow-hidden shadow-2xl group">
                    <Image
                      src={heroImage.imageUrl}
                      alt={heroImage.description}
                      data-ai-hint={heroImage.imageHint}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm shadow-sm">How It Works</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Your Path to Success in 3 Simple Steps</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Getting started with EduConnect Pro is quick and easy.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
                {howItWorks.map((step, index) => (
                    <AnimatedCard key={step.title} index={index}>
                        <Card className="p-6 text-center md:text-left h-full bg-card/50 hover:bg-card border-2 border-transparent hover:border-primary transition-all duration-300 group">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto md:mx-0 mb-4 transition-colors duration-300 group-hover:bg-primary/20">
                                {step.icon}
                            </div>
                            <div className="grid gap-1">
                                <h3 className="text-xl font-bold font-headline">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </Card>
                    </AnimatedCard>
                ))}
                </div>
            </div>
        </section>


        <section id="features" className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent -z-10" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm shadow-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to empower both teachers and students with powerful, easy-to-use features.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-4">
              {features.map((feature, index) => (
                <AnimatedCard 
                  key={feature.title} 
                  index={index}
                  className="grid gap-4 p-6 rounded-lg bg-card shadow-soft-shadow hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Meet Our Top Tutors</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Learn from the best. Our educators are experienced, verified, and ready to help you succeed.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {topTutors.map((tutor, index) => (
                         <AnimatedCard key={tutor.name} index={index}>
                            <Card className="text-center h-full flex flex-col overflow-hidden shadow-soft-shadow hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
                                <CardContent className="p-6 flex-1">
                                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                                        {tutor.image && <AvatarImage src={tutor.image.imageUrl} alt={tutor.name} data-ai-hint={tutor.image.imageHint}/>}
                                        <AvatarFallback className="text-3xl">{tutor.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-xl font-bold font-headline">{tutor.name}</h3>
                                    <p className="text-sm text-muted-foreground">{tutor.subject}</p>
                                    <div className="flex items-center justify-center gap-4 mt-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold">{tutor.rating}</span>
                                        </div>
                                        <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 bg-muted/50">
                                    <Button variant="ghost" className="w-full">View Profile</Button>
                                </CardFooter>
                            </Card>
                        </AnimatedCard>
                    ))}
                </div>
            </div>
        </section>
        
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">What Our Users Say</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Hear from students and tutors who have found success with EduConnect Pro.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <AnimatedCard key={index} index={index}>
                          <Card className="bg-card rounded-lg p-6 shadow-soft-shadow flex flex-col h-full relative overflow-hidden">
                              <Quote className="absolute -top-2 -right-2 h-24 w-24 text-muted/10 transform-gpu" />
                              <div className="flex-1 z-10">
                                  <div className="flex items-center gap-1 mb-4">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
                                      ))}
                                  </div>
                                  <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                              </div>
                              <div className="flex items-center gap-4 z-10">
                                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                                      {testimonial.image && <AvatarImage src={testimonial.image.imageUrl} alt={testimonial.name} />}
                                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <h4 className="font-semibold">{testimonial.name}</h4>
                                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                  </div>
                              </div>
                          </Card>
                        </AnimatedCard>
                    ))}
                </div>
            </div>
        </section>


        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
                <div className="grid gap-10 lg:grid-cols-2">
                     <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm shadow-sm">Join Our Community</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Trusted by Thousands</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our platform is built on trust and quality. See the numbers that make us a leading choice for education.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        {stats.map(stat => (
                             <div key={stat.label} className="text-center">
                                <h3 className="text-5xl lg:text-6xl font-bold text-primary font-headline">{stat.number}</h3>
                                <p className="text-base text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Featured Opportunities</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Don't miss out on these exclusive offers and masterclasses.
                        </p>
                    </div>
                </div>
                <Carousel 
                    opts={{ align: "start", loop: true }} 
                    plugins={[autoplayPlugin.current]}
                    className="w-full max-w-4xl mx-auto"
                >
                    <CarouselContent>
                        {ads.map((ad, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                            <Card className="overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
                                <CardContent className="flex flex-col aspect-[4/3] items-start justify-end p-0">
                                    {ad.image && <Image 
                                        src={ad.image.imageUrl} 
                                        alt={ad.title} 
                                        width={600} 
                                        height={400} 
                                        className="absolute inset-0 w-full h-full object-cover -z-10"
                                        data-ai-hint={ad.image.imageHint}
                                    />}
                                    <div className="flex flex-col p-6 bg-gradient-to-t from-black/80 to-transparent w-full">
                                        <h3 className="text-xl font-bold text-white font-headline">{ad.title}</h3>
                                        <p className="text-sm text-gray-300 mt-1">{ad.description}</p>
                                        <Button size="sm" className="mt-4 w-fit">Learn More</Button>
                                    </div>
                                </CardContent>
                            </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container">
            <div className="relative rounded-xl overflow-hidden p-8 md:p-12 bg-muted">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 -z-10" />
                <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
                    <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                        Ready to start your journey?
                    </h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Whether you're a student eager to learn or a tutor ready to inspire, your journey begins here.
                    </p>
                    </div>
                    <div className="flex flex-col gap-2 min-[400px]:flex-row lg:justify-end">
                    <Button asChild size="lg" className="button-glow">
                        <Link href="/login-student">
                        Join as a Student
                        <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/signup">
                        Register as a Tutor
                        </Link>
                    </Button>
                    </div>
                </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 EduConnect Pro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
