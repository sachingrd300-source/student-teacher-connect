'use client';

import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Heart, TrendingUp, Star, MapPin, Phone, Mail } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
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


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/20 py-12 md:py-24">
          <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-10 items-center">
             <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-serif">
                    Become a Home Tutor in Giridih
                </h1>
                <p className="mt-4 max-w-xl text-lg md:text-xl text-muted-foreground">
                    Join the Achievers Community and connect with students who need your expertise. We're looking for passionate tutors for all subjects, from Class 1 to 12.
                </p>
                <div className="mt-8">
                  <Button asChild size="lg">
                    <Link href="/signup/teacher">
                      Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
            </motion.div>
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-2xl"
            >
                <Image
                    src={placeholderImages.featureTeacher.src}
                    alt="A teacher helping a student"
                    fill
                    className="object-cover"
                    data-ai-hint="teacher student"
                />
            </motion.div>
          </div>
        </section>

        {/* Why Achievers Community Section */}
        <section id="why-us" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Why Achievers Community?</h2>
              <p className="mt-2 text-muted-foreground md:text-lg">We provide the platform, you provide the knowledge.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
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
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 md:py-24 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">What Our Tutors Say</h2>
              <p className="mt-2 text-muted-foreground md:text-lg">Real stories from tutors in our community.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                 <motion.div
                    key={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeIn}
                    className="h-full"
                >
                    <Card key={index} className="h-full flex flex-col">
                        <CardContent className="pt-6 flex-grow">
                             <div className="flex items-center mb-4">
                                <Avatar className="h-12 w-12 mr-4">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">"{testimonial.text}"</p>
                        </CardContent>
                        <div className="p-6 pt-0 flex text-yellow-400">
                            <Star className="h-5 w-5 fill-current" />
                            <Star className="h-5 w-5 fill-current" />
                            <Star className="h-5 w-5 fill-current" />
                            <Star className="h-5 w-5 fill-current" />
                            <Star className="h-5 w-5 fill-current" />
                        </div>
                    </Card>
                 </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Google Map Section */}
        <section id="location" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
             <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">Our Location</h2>
              <p className="mt-2 text-muted-foreground md:text-lg">We are based in the heart of Giridih, Jharkhand.</p>
            </div>
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border shadow-lg">
               <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58284.42065845563!2d86.26251576134372!3d24.1848520703889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f174c8928a69d7%3A0xe2b7b5f1b30646f!2sGiridih%2C%20Jharkhand%2C%20India!5e0!3m2!1sen!2sus!4v1628509891295!5m2!1sen!2sus"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Contact Us</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>+91 12345 67890</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>contact@achieverscommunity.com</span>
            </div>
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={fadeIn}
      className="flex flex-col items-center text-center p-6 border rounded-lg bg-card shadow-sm"
    >
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  )
}
