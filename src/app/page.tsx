
'use client';

import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, UserCog, Users } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";

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

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white overflow-hidden">
          <Image
            src={placeholderImages.hero.src}
            alt={placeholderImages.hero.alt}
            fill
            className="object-cover"
            priority
            data-ai-hint={placeholderImages.hero.hint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="relative z-10 p-4"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
              The Future of Education, Connected.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
              Empowering students, teachers, and admins with a unified platform for learning, management, and growth.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Join as a Student <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup/teacher">Join as a Teacher</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">A Platform for Everyone</h2>
              <p className="mt-2 text-muted-foreground md:text-lg">Tailored experiences for every role in education.</p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              <FeatureCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="For Teachers"
                description="Manage batches, upload materials, track student progress, handle fees, and post announcements with ease. Focus on what you do best: teaching."
                image={placeholderImages.featureTeacher}
              />
              <FeatureCard
                icon={<BookOpen className="w-8 h-8 text-primary" />}
                title="For Students"
                description="Join batches, access study materials, track your test results, and stay updated. Engage in a gamified learning journey with daily rewards."
                image={placeholderImages.featureStudent}
              />
              <FeatureCard
                icon={<UserCog className="w-8 h-8 text-primary" />}
                title="For Admins"
                description="Oversee the entire platform. Manage users, handle home tutor bookings, add free resources, and manage the platform's shop."
                image={placeholderImages.featureAdmin}
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 border-t">
        <div className="container text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} EduConnect Pro. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, image }: { icon: React.ReactNode, title: string, description: string, image: { src: string, alt: string, width: number, height: number, hint: string } }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeIn}
      className="flex flex-col items-center text-center"
    >
      <div className="relative w-full h-56 mb-6 rounded-lg overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          data-ai-hint={image.hint}
        />
      </div>
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  )
}
