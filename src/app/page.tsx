'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Briefcase, Search, GraduationCap, BookOpen, UserCheck, TrendingUp, Target, Users, Book, LayoutDashboard, BarChart3, Trophy, BookCopy, Wallet, ClipboardCheck, Megaphone, BookCheck, School, Award, Building2, User } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images.json';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { translations } from "@/lib/translations";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, limit, query, where, getCountFromServer } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const staggerContainer = (staggerChildren: number, delayChildren: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerChildren,
      delayChildren: delayChildren,
    },
  },
});

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const testimonialsData = [
  {
    name: "Priya Sharma",
    roleKey: "testimonialRoleMathsTeacher",
    avatar: "https://picsum.photos/seed/priya/100/100",
    text: "EduConnect Pro has been a game-changer. I get a steady stream of students, and the platform makes management effortless."
  },
  {
    name: "Rohan Mehra",
    roleKey: "testimonialRoleStudent",
    avatar: "https://picsum.photos/seed/rohan/100/100",
    text: "The free notes and PYQs for the Jharkhand Board were incredibly helpful for my exam preparation. My tutor is also excellent!"
  },
  {
    name: "Amit Kumar",
    roleKey: "testimonialRoleScienceTeacher",
    avatar: "https://picsum.photos/seed/amit/100/100",
    text: "Joining was the best decision. I can focus on teaching, and the community handles the logistics. The platform is very easy to use."
  }
];

interface TeacherProfile {
    id: string;
    name: string;
    subject?: string;
    bio?: string;
}


export default function HomePage() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const t = translations[language];

  const features = [
      {
          icon: <Briefcase className="w-8 h-8 text-primary" />,
          title: t.feature1Title,
          description: t.feature1Description
      },
      {
          icon: <GraduationCap className="w-8 h-8 text-primary" />,
          title: t.feature3Title,
          description: t.feature3Description
      }
  ];

  const howItWorks = {
      students: [
          {
              icon: '01',
              title: t.studentStep1Title,
              description: t.studentStep1Description
          },
          {
              icon: '02',
              title: t.studentStep2Title,
              description: t.studentStep2Description
          },
          {
              icon: '03',
              title: t.studentStep3Title,
              description: t.studentStep3Description
          }
      ],
      teachers: [
          {
              icon: '01',
              title: t.teacherStep1Title,
              description: t.teacherStep1Description
          },
          {
              icon: '02',
              title: t.teacherStep2Title,
              description: t.teacherStep2Description
          },
          {
              icon: '03',
              title: t.teacherStep3Title,
              description: t.teacherStep3Description
          }
      ]
  }
  
  const platformFeatures = {
    students: [
      { icon: <LayoutDashboard className="w-5 h-5 mr-3 text-primary"/>, text: t.platformStudentFeature1 },
      { icon: <BookCopy className="w-5 h-5 mr-3 text-primary"/>, text: t.platformStudentFeature2 },
      { icon: <BarChart3 className="w-5 h-5 mr-3 text-primary"/>, text: t.platformStudentFeature3 },
      { icon: <Trophy className="w-5 h-5 mr-3 text-primary"/>, text: t.platformStudentFeature4 },
    ],
    teachers: [
      { icon: <Users className="w-5 h-5 mr-3 text-primary"/>, text: t.platformTeacherFeature1 },
      { icon: <Wallet className="w-5 h-5 mr-3 text-primary"/>, text: t.platformTeacherFeature2 },
      { icon: <ClipboardCheck className="w-5 h-5 mr-3 text-primary"/>, text: t.platformTeacherFeature3 },
      { icon: <Megaphone className="w-5 h-5 mr-3 text-primary"/>, text: t.platformTeacherFeature4 },
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader currentLanguage={language} onLanguageChange={setLanguage} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 md:pt-32 lg:pt-40 pb-16 md:pb-24 overflow-hidden">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/5 rounded-full -z-10"></div>
            <div className="container px-4 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer(0.3, 0)}
                    className="text-center lg:text-left"
                >
                    <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-serif">
                        {t.heroTitle}
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="mt-4 max-w-lg mx-auto lg:mx-0 text-muted-foreground md:text-xl">
                        {t.heroDescription}
                    </motion.p>
                    <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button asChild size="lg">
                        <Link href="/signup">
                            {t.teacherApplyButton} <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/signup/student">
                                {t.studentFindButton}
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="relative w-full max-w-xl mx-auto"
                >
                    <Image
                        src={placeholderImages.hero.src}
                        alt={placeholderImages.hero.alt}
                        width={placeholderImages.hero.width}
                        height={placeholderImages.hero.height}
                        priority
                        className="rounded-xl shadow-2xl"
                        data-ai-hint={placeholderImages.hero.hint}
                    />
                </motion.div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeInUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.featuresSectionTitle}</h2>
                    <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.featuresSectionDescription}</p>
                </motion.div>
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer(0.2, 0)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={fadeInUp}>
                            <Card className="p-8 h-full text-center hover:shadow-xl transition-shadow duration-300 rounded-2xl shadow-lg">
                                <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                                    {feature.icon}
                                </div>
                                <CardHeader className="p-0">
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 mt-2">
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
        
        {/* How it Works Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeInUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.howItWorksTitle}</h2>
                    <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.howItWorksDescription}</p>
                </motion.div>
                <div className="grid md:grid-cols-2 gap-16">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.3, 0)}>
                        <h3 className="text-2xl font-bold mb-8">{t.forStudentsTitle}</h3>
                        <div className="flex flex-col gap-8">
                            {howItWorks.students.map((item, index) => (
                                <motion.div key={index} variants={fadeInUp} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl z-10">{item.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-lg">{item.title}</h4>
                                        <p className="text-muted-foreground mt-1">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer(0.3, 0)}>
                        <h3 className="text-2xl font-bold mb-8">{t.forTeachersTitle}</h3>
                        <div className="flex flex-col gap-8">
                            {howItWorks.teachers.map((item, index) => (
                                <motion.div key={index} variants={fadeInUp} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl z-10">{item.icon}</div>
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
        
        {/* New Comprehensive Offerings Section */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeInUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.comprehensiveCoverageTitle}</h2>
                    <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.comprehensiveCoverageDescription}</p>
                </motion.div>
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer(0.2, 0)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <motion.div variants={fadeInUp}>
                        <Card className="p-8 h-full shadow-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                            <User className="w-10 h-10 text-primary mb-4" />
                            <CardHeader className="p-0">
                                <CardTitle>{t.individualTuitionTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-2">
                                <p className="text-muted-foreground">{t.individualTuitionDescription}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                         <Card className="p-8 h-full shadow-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                            <Building2 className="w-10 h-10 text-primary mb-4" />
                            <CardHeader className="p-0">
                                <CardTitle>{t.coachingCenterTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-2">
                                <p className="text-muted-foreground">{t.coachingCenterDescription}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </section>

        {/* Platform Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.platformTitle}</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.platformDescription}</p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mt-12">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeInUp}
                >
                    <Image 
                        src={placeholderImages.dashboardPreview.src} 
                        alt={placeholderImages.dashboardPreview.alt}
                        width={placeholderImages.dashboardPreview.width}
                        height={placeholderImages.dashboardPreview.height}
                        className="rounded-lg shadow-2xl"
                        data-ai-hint={placeholderImages.dashboardPreview.hint}
                    />
                </motion.div>
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }} 
                    variants={staggerContainer(0.2, 0.2)}
                >
                    <Tabs defaultValue="students" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="students">{t.forStudentsTitle}</TabsTrigger>
                            <TabsTrigger value="teachers">{t.forTeachersTitle}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="students" className="mt-6">
                            <ul className="space-y-4 text-lg">
                              {platformFeatures.students.map((feature, index) => (
                                <motion.li key={index} variants={fadeInUp} className="flex items-center">
                                  {feature.icon}
                                  <span className="flex-1">{feature.text}</span>
                                </motion.li>
                              ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="teachers" className="mt-6">
                            <ul className="space-y-4 text-lg">
                              {platformFeatures.teachers.map((feature, index) => (
                                <motion.li key={index} variants={fadeInUp} className="flex items-center">
                                  {feature.icon}
                                  <span className="flex-1">{feature.text}</span>
                                </motion.li>
                              ))}
                            </ul>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
          </div>
        </section>
        
        {/* Numbers Section */}
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.numbersTitle}</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.numbersDescription}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer(0.2, 0)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8"
            >
              <motion.div variants={fadeInUp} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Briefcase className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-5xl font-bold">50+</p>
                <p className="text-muted-foreground mt-2">{t.teachersLabel}</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-5xl font-bold">500+</p>
                <p className="text-muted-foreground mt-2">{t.studentsLabel}</p>
              </motion.div>
              <motion.div variants={fadeInUp} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Book className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-5xl font-bold">10+</p>
                <p className="text-muted-foreground mt-2">{t.subjectsLabel}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.testimonialsTitle}</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.testimonialsDescription}</p>
            </motion.div>
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer(0.2, 0)}
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {testimonialsData.map((testimonial, index) => (
                 <motion.div key={index} variants={fadeInUp}>
                    <Card key={index} className="h-full flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl">
                        <CardContent className="p-6 flex-grow">
                            <div className="flex text-yellow-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <blockquote className="text-foreground/90 text-base italic">"{testimonial.text}"</blockquote>
                        </CardContent>
                         <CardHeader className="bg-muted/50 p-6 border-t mt-4">
                            <div className="flex items-center">
                                <Avatar className="h-12 w-12 mr-4">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{t[testimonial.roleKey as keyof typeof t]}</p>
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
        <section className="py-16 md:py-32 bg-muted/40">
            <div className="container px-4 md:px-6 text-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInUp}>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.ctaTitle}</h2>
                    <p className="mt-3 max-w-xl mx-auto text-muted-foreground md:text-lg">{t.ctaDescription}</p>
                    <div className="mt-8">
                        <Button asChild size="lg">
                            <Link href="/signup">
                                {t.ctaButton} <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container px-4 md:px-6 text-center text-muted-foreground">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInUp}>
            <p>© {new Date().getFullYear()} EduConnect Pro. All Rights Reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
