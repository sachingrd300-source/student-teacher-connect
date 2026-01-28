
'use client';

import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Phone, MessageSquare, Mail } from "lucide-react";
import { motion } from "framer-motion";

const whyJoinUsItems = [
    "Flexible Hours",
    "Competitive Pay",
    "Impactful Work",
    "Professional Growth",
];

const lookingForItems = [
    "Passionate Educators",
    "Subject Experts (All Grades)",
    "Good Communication",
    "Local Candidates (Giridih)",
];

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: "easeOut",
    },
  },
});

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <MainHeader />
      <main className="flex-1">
        <section className="py-12 md:py-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn()}
            className="container px-4 md:px-6"
          >
            <Card className="max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden border-2 border-primary/20">
              <CardContent className="p-6 md:p-12">
                <div className="text-center">
                  <div className="inline-flex items-center flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-lg">
                      <span className="text-4xl font-bold text-primary font-serif">AC</span>
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Achievers Community</h1>
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary">
                    HOME TUTORS REQUIRED
                  </h2>
                  <p className="mt-2 text-lg text-muted-foreground font-semibold">
                    EMPOWERING MINDS IN GIRIDIH
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12 my-12">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Why Join Us?</h3>
                    <ul className="space-y-3">
                      {whyJoinUsItems.map((item) => (
                        <li key={item} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-4">Looking for:</h3>
                    <ul className="space-y-3">
                      {lookingForItems.map((item) => (
                        <li key={item} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <Button asChild size="lg" className="font-bold text-lg px-12 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all">
                    <Link href="/signup/teacher">
                      APPLY NOW
                    </Link>
                  </Button>
                </div>
                
                <div className="border-t pt-8 space-y-4 text-center">
                   <div className="flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-3">
                     <div className="flex items-center gap-2">
                         <Phone className="w-5 h-5 text-primary" />
                         <span className="font-semibold">Mobile: <a href="tel:+916207639300" className="hover:underline">+91 6207639300</a>, <a href="tel:+919431974149" className="hover:underline">+91 9431974149</a></span>
                     </div>
                      <div className="flex items-center gap-2">
                         <MessageSquare className="w-5 h-5 text-green-500" />
                         <span className="font-semibold">WhatsApp: <a href="https://wa.me/919523496514" target="_blank" rel="noopener noreferrer" className="hover:underline">+91 9523496514</a></span>
                     </div>
                   </div>
                    <div className="flex items-center justify-center gap-2">
                     <Mail className="w-5 h-5 text-primary" />
                     <span className="font-semibold">Email: <a href="mailto:achievers0community@gmail.com" className="hover:underline">achievers0community@gmail.com</a></span>
                   </div>
                 </div>

              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
