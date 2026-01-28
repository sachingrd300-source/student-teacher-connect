
'use client';

import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, MapPin, Phone, Mail, BookOpen, GraduationCap, HeartHandshake, Briefcase, Search, Award } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay,
      ease: [0.25, 1, 0.5, 1],
    },
  },
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Maths Teacher",
    avatar: "https://picsum.photos/seed/priya/100/100",
    text: "Achievers Community has been a game-changer for my tutoring career. I get a steady stream of students and the support from the team is fantastic."
  },
  {
    name: "Rohan Mehra",
    role: "Student, Class 10",
    avatar: "https://picsum.photos/seed/rohan/100/100",
    text: "The free notes and PYQs for the Jharkhand Board were incredibly helpful for my exam preparation. My tutor is also excellent!"
  },
  {
    name: "Amit Kumar",
    role: "Science Teacher",
    avatar: "https://picsum.photos/seed/amit/100/100",
    text: "Joining was the best decision. I can focus on teaching, and the community handles the logistics. The platform is very easy to use."
  }
];

const features = [
    {
        icon: <GraduationCap className="w-8 h-8 text-primary" />,
        title: "Expert Tutors",
        description: "Connect with verified, high-quality home tutors in your local area."
    },
    {
        icon: <BookOpen className="w-8 h-8 text-primary" />,
        title: "Free Resources",
        description: "Access notes, books, and PYQs for Jharkhand Board (Class 8-12)."
    },
    {
        icon: <Briefcase className="w-8 h-8 text-primary" />,
        title: "Career Growth",
        description: "A supportive platform for tutors to build their career and reputation."
    }
];

const howItWorks = {
    students: [
        {
            step: 1,
            title: "Sign Up for Free",
            description: "Create your student account in minutes."
        },
        {
            step: 2,
            title: "Find a Tutor or Batch",
            description: "Browse teacher profiles or join a batch with a code."
        },
        {
            step: 3,
            title: "Start Learning",
            description: "Access materials, track progress, and excel in your studies."
        }
    ],
    teachers: [
        {
            step: 1,
            title: "Apply to Join",
            description: "Create your teacher profile to showcase your expertise."
        },
        {
            step: 2,
            title: "Create Batches",
            description: "Easily set up and manage your student batches online."
        },
        {
            step: 3,
            title: "Teach & Grow",
            description: "Share materials, manage fees, and build your tutoring career."
        }
    ]
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] md:h-[90vh] flex items-center justify-center text-center text-white">
            <Image
                src={placeholderImages.heroFull.src}
                alt={placeholderImages.heroFull.alt}
                fill
                priority
                className="object-cover"
                data-ai-hint={placeholderImages.heroFull.hint}
            />
            <div className="absolute inset-0 bg-black/60"></div>
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="relative z-10 container px-4 md:px-6"
            >
                <motion.h1 variants={fadeIn(0)} className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter font-serif">
                    Your Gateway to Quality Education
                </motion.h1>
                <motion.p variants={fadeIn(0.2)} className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/80">
                    Connecting dedicated tutors with students in Giridih. Plus, get <span className="font-bold text-primary">free study materials</span> for Jharkhand Board (Class 8-12, Science, Arts & Commerce).
                </motion.p>
                <motion.div variants={fadeIn(0.4)} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                    <Link href="/signup/teacher">
                        Become a Tutor <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                    <Link href="/signup">
                        Find a Tutor
                    </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={fadeIn()}>
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold">{feature.title}</h3>
                            <p className="mt-2 text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
        
        {/* How it Works Section */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                 <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn()}
                    className="text-center mb-12"
                 >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">How It Works</h2>
                    <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">A simple and straightforward process for everyone.</p>
                </motion.div>
                <div className="grid md:grid-cols-2 gap-16">
                    {/* For Students */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
                        <h3 className="text-2xl font-bold mb-6">For Students</h3>
                        <div className="relative grid gap-10">
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10"></div>
                            {howItWorks.students.map((item, index) => (
                                <motion.div key={index} variants={fadeIn()} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">{item.step}</div>
                                    <div>
                                        <h4 className="font-bold text-lg">{item.title}</h4>
                                        <p className="text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    {/* For Teachers */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer}>
                        <h3 className="text-2xl font-bold mb-6">For Teachers</h3>
                        <div className="relative grid gap-10">
                             <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10"></div>
                            {howItWorks.teachers.map((item, index) => (
                                <motion.div key={index} variants={fadeIn()} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg z-10">{item.step}</div>
                                    <div>
                                        <h4 className="font-bold text-lg">{item.title}</h4>
                                        <p className="text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn()}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Loved by Our Community</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">Real stories from our growing community of students and teachers.</p>
            </motion.div>
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {testimonials.map((testimonial, index) => (
                 <motion.div
                    key={index}
                    variants={fadeIn()}
                    className="h-full"
                >
                    <Card key={index} className="h-full flex flex-col bg-card border shadow-sm rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 flex-grow">
                            <div className="flex text-yellow-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <blockquote className="text-foreground/90 text-base">"{testimonial.text}"</blockquote>
                        </CardContent>
                         <CardHeader className="bg-muted/40 p-6">
                            <div className="flex items-center">
                                <Avatar className="h-12 w-12 mr-4">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                 </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
         {/* Final CTA */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6 text-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn()}>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">Ready to Get Started?</h2>
                    <p className="mt-3 max-w-xl mx-auto text-muted-foreground md:text-lg">Join our community today and take the next step in your educational journey.</p>
                    <div className="mt-8">
                        <Button asChild size="lg">
                            <Link href="/signup">
                                Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
      </main>

      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container px-4 md:px-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-4 font-serif">Contact Us</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <span>+91 12345 67890</span>
            </a>
            <a href="mailto:contact@educonnectpro.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <span>contact@educonnectpro.com</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Giridih, Jharkhand</span>
            </div>
          </div>
          <p className="mt-8 text-gray-500 text-sm">
            © {new Date().getFullYear()} EduConnect Pro. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
