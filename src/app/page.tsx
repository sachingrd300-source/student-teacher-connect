'use client';

import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, MapPin, Phone, Mail, User, Briefcase, BookMarked, Search, Award } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.2
    },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
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

const studentFeatures = [
    {
        icon: <Search className="w-8 h-8 text-primary" />,
        title: "Find Expert Tutors",
        description: "Browse verified home tutors in Giridih and find the perfect match for your needs."
    },
    {
        icon: <BookMarked className="w-8 h-8 text-primary" />,
        title: "Free Study Material",
        description: "Access high-quality notes, books, and PYQs for Jharkhand Board (Class 8-12, Science, Arts & Commerce)."
    },
    {
        icon: <Award className="w-8 h-8 text-primary" />,
        title: "Achieve Your Goals",
        description: "Join interactive batches, track your test results, and excel in your studies."
    }
];

const teacherFeatures = [
    {
        icon: <User className="w-8 h-8 text-primary" />,
        title: "Connect with Students",
        description: "Get a steady stream of verified student leads in your locality without any marketing hassle."
    },
    {
        icon: <Briefcase className="w-8 h-8 text-primary" />,
        title: "Manage Your Batches",
        description: "Easily create and manage student batches, share materials, and conduct tests on our platform."
    },
    {
        icon: <Award className="w-8 h-8 text-primary" />,
        title: "Build Your Reputation",
        description: "Grow your career as a professional tutor and be a part of a supportive community of educators."
    }
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30">
          <div className="container px-4 md:px-6 py-20 md:py-28">
             <motion.div 
                initial="hidden" 
                animate="visible" 
                variants={fadeIn}
                className="grid md:grid-cols-2 gap-10 items-center"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Your Gateway to Quality Education in Giridih
                    </h1>
                    <p className="mt-4 max-w-xl text-lg md:text-xl text-muted-foreground">
                        Connecting dedicated home tutors with students. Plus, get <span className="font-bold text-primary">free study materials</span> for Jharkhand Board (Class 8-12, Science, Arts & Commerce).
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                        <Link href="/signup/teacher">
                          Become a Tutor <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                       <Button asChild size="lg" variant="outline">
                        <Link href="/login">
                          Find a Tutor
                        </Link>
                      </Button>
                    </div>
                </div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                    className="relative w-full h-80 md:h-[450px] rounded-2xl overflow-hidden shadow-2xl"
                >
                    <Image
                        src={placeholderImages.hero.src}
                        alt="A teacher and student collaborating"
                        fill
                        priority
                        className="object-cover"
                        data-ai-hint="teacher student education"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Instructions Section */}
        <section id="instructions" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-16 items-center">
            {/* For Students */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
            >
                <h2 className="text-3xl md:text-4xl font-bold font-serif mb-8">For Students</h2>
                <div className="grid gap-6">
                    {studentFeatures.map((feature, index) => (
                        <FeatureItem key={index} icon={feature.icon} title={feature.title} description={feature.description} />
                    ))}
                </div>
                <Button asChild className="mt-8" variant="link" size="lg">
                    <Link href="/signup">
                        Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </motion.div>

            {/* For Teachers */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
            >
                <h2 className="text-3xl md:text-4xl font-bold font-serif mb-8">For Teachers</h2>
                <div className="grid gap-6">
                     {teacherFeatures.map((feature, index) => (
                        <FeatureItem key={index} icon={feature.icon} title={feature.title} description={feature.description} />
                    ))}
                </div>
                 <Button asChild className="mt-8" variant="link" size="lg">
                    <Link href="/signup/teacher">
                        Join Our Community <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Loved by Students and Teachers</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">Real stories from our growing community.</p>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                 <motion.div
                    key={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={itemFadeIn}
                    className="h-full"
                >
                    <Card key={index} className="h-full flex flex-col bg-card border shadow-sm">
                        <CardHeader>
                            <div className="flex text-yellow-400">
                                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex-grow">
                            <p className="text-foreground/90 text-base mb-6">"{testimonial.text}"</p>
                        </CardContent>
                         <CardContent>
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
                        </CardContent>
                    </Card>
                 </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Google Map Section */}
        <section id="location" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
             <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                className="text-center mb-12"
             >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">We're Local</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">Proudly serving the community of Giridih, Jharkhand.</p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8 }}
                className="aspect-[16/9] rounded-2xl overflow-hidden border shadow-lg"
            >
               <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58284.42065845563!2d86.26251576134372!3d24.1848520703889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f174c8928a69d7%3A0xe2b7b5f1b30646f!2sGiridih%2C%20Jharkhand%2C%20India!5e0!3m2!1sen!2sus!4v1628509891295!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Contact Us</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <span>+91 12345 67890</span>
            </a>
            <a href="mailto:contact@achieverscommunity.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <span>contact@achieverscommunity.com</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Giridih, Jharkhand</span>
            </div>
          </div>
          <p className="mt-8 text-gray-500 text-sm">
            © {new Date().getFullYear()} Achievers Community. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground mt-1">{description}</p>
        </div>
    </div>
  )
}

    