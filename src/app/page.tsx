'use client';

import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Heart, TrendingUp, Star, MapPin, Phone, Mail, ClipboardList, BadgeCheck, Users, BookOpen } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    name: "Amit Kumar",
    role: "Science Teacher",
    avatar: "https://picsum.photos/seed/amit/100/100",
    text: "Joining was the best decision. I can focus on teaching, and the community handles the logistics. The students are motivated and eager to learn."
  },
    {
    name: "Sneha Verma",
    role: "English Teacher",
    avatar: "https://picsum.photos/seed/sneha/100/100",
    text: "I love the flexibility and the quality of students I get to teach. It's rewarding to be part of a community that truly values education."
  }
];

const howItWorksSteps = [
    {
        icon: <ClipboardList className="w-8 h-8 text-primary" />,
        title: "1. Apply to Join",
        description: "Fill out our simple application form to tell us about your experience and subjects."
    },
    {
        icon: <BadgeCheck className="w-8 h-8 text-primary" />,
        title: "2. Get Verified",
        description: "Our team will review your application and conduct a brief verification process."
    },
    {
        icon: <Users className="w-8 h-8 text-primary" />,
        title: "3. Connect with Students",
        description: "Once approved, you'll start receiving tuition requests from students in your area."
    },
    {
        icon: <BookOpen className="w-8 h-8 text-primary" />,
        title: "4. Start Teaching",
        description: "Accept requests, schedule classes, and make a real impact on students' lives."
    }
];


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 py-20 md:py-28">
          <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-10 items-center">
             <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    Become a Top Home Tutor in Giridih
                </h1>
                <p className="mt-4 max-w-xl text-lg md:text-xl text-muted-foreground">
                    Join the Achievers Community and connect with students who need your expertise. We're looking for passionate tutors for all subjects, from Class 1 to 12.
                </p>
                <div className="mt-8 flex gap-4">
                  <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                    <Link href="/signup/teacher">
                      Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                   <Button asChild size="lg" variant="outline">
                    <Link href="#why-us">
                      Learn More
                    </Link>
                  </Button>
                </div>
            </motion.div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                className="relative w-full h-80 md:h-[450px] rounded-2xl overflow-hidden shadow-2xl"
            >
                <Image
                    src={placeholderImages.featureTeacher.src}
                    alt="A teacher helping a student"
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint="teacher student"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>
          </div>
        </section>

        {/* Why Join Us Section */}
        <section id="why-us" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Why Join Us?</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">We provide the platform, you provide the knowledge.</p>
            </motion.div>
            <motion.div 
              className="grid gap-8 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
            >
              <FeatureCard
                icon={<Target className="w-8 h-8 text-primary" />}
                title="Steady Stream of Students"
                description="We connect you with verified students in your area, so you can focus on teaching, not marketing."
              />
              <FeatureCard
                icon={<Heart className="w-8 h-8 text-primary" />}
                title="Supportive Community"
                description="Join a network of fellow educators. Share resources, get advice, and grow together as professionals."
              />
              <FeatureCard
                icon={<TrendingUp className="w-8 h-8 text-primary" />}
                title="Professional Growth"
                description="We provide resources and opportunities to help you enhance your teaching skills and build your reputation."
              />
            </motion.div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">Simple Steps to Get Started</h2>
                    <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">Your journey to becoming a valued tutor is just a few clicks away.</p>
                </motion.div>
                <div className="relative">
                    {/* Dashed line for desktop */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-transparent">
                        <svg width="100%" height="100%">
                            <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="10, 10" className="stroke-border" strokeWidth="2" />
                        </svg>
                    </div>
                    <motion.div
                        className="grid gap-12 md:gap-8 md:grid-cols-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={fadeIn}
                    >
                        {howItWorksSteps.map((step, index) => (
                            <motion.div key={index} variants={itemFadeIn} className="flex flex-col items-center text-center z-10">
                                <div className="p-5 bg-background rounded-full mb-4 border-2 border-primary/20 shadow-sm">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">What Our Tutors Say</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">Real stories from tutors in our community.</p>
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
                    <Card key={index} className="h-full flex flex-col bg-muted/30 border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex text-yellow-400">
                                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex-grow">
                            <p className="text-foreground text-base mb-6">"{testimonial.text}"</p>
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
        
        {/* CTA Section */}
        <section id="cta" className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeIn}
                    className="bg-card p-10 md:p-16 rounded-2xl shadow-xl text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">Ready to Start Your Tutoring Journey?</h2>
                    <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">Join us today and make a difference. The application is quick and easy.</p>
                    <div className="mt-8">
                         <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                            <Link href="/signup/teacher">
                            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
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
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Our Location</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">We are proudly based in the heart of Giridih, Jharkhand.</p>
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      variants={itemFadeIn}
      className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card shadow-sm h-full"
    >
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  )
}
