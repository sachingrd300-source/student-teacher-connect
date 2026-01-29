
'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Briefcase, Search, GraduationCap, BookOpen, UserCheck, TrendingUp, Target, Users, Book, LayoutDashboard, BarChart3, Trophy, BookCopy, Wallet, ClipboardCheck, Megaphone, BookCheck, School, Award, Facebook, Twitter, Instagram, Building2 } from "lucide-react";
import placeholderImages from '@/lib/placeholder-images';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { translations } from "@/lib/translations";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
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

  const { user } = useUser();
  const firestore = useFirestore();

  const [teacherCount, setTeacherCount] = useState<number>();
  const [studentCount, setStudentCount] = useState<number>();

  const featuredTeachersQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(
          collection(firestore, 'users'),
          where('role', '==', 'teacher'),
          limit(3)
      );
  }, [firestore, user]);
  const { data: featuredTeachers } = useCollection<TeacherProfile>(featuredTeachersQuery);

  useEffect(() => {
    if (user && firestore) {
      const teachersQuery = query(collection(firestore, 'users'), where('role', '==', 'teacher'));
      const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'student'));

      getCountFromServer(teachersQuery)
        .then(snapshot => setTeacherCount(snapshot.data().count))
        .catch(err => console.error("Error getting teacher count:", err));
      
      getCountFromServer(studentsQuery)
        .then(snapshot => setStudentCount(snapshot.data().count))
        .catch(err => console.error("Error getting student count:", err));
    } else {
      // Reset counts if user logs out
      setTeacherCount(undefined);
      setStudentCount(undefined);
    }
  }, [user, firestore]);

  const features = [
      {
          icon: <Briefcase className="w-8 h-8 text-primary" />,
          title: t.feature1Title,
          description: t.feature1Description
      },
      {
          icon: <Building2 className="w-8 h-8 text-primary" />,
          title: t.feature2Title,
          description: t.feature2Description
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
              icon: <Search className="w-6 h-6 text-primary-foreground"/>,
              title: t.studentStep1Title,
              description: t.studentStep1Description
          },
          {
              icon: <BookOpen className="w-6 h-6 text-primary-foreground"/>,
              title: t.studentStep2Title,
              description: t.studentStep2Description
          },
          {
              icon: <Target className="w-6 h-6 text-primary-foreground"/>,
              title: t.studentStep3Title,
              description: t.studentStep3Description
          }
      ],
      teachers: [
          {
              icon: <UserCheck className="w-6 h-6 text-primary-foreground"/>,
              title: t.teacherStep1Title,
              description: t.teacherStep1Description
          },
          {
              icon: <Briefcase className="w-6 h-6 text-primary-foreground"/>,
              title: t.teacherStep2Title,
              description: t.teacherStep2Description
          },
          {
              icon: <TrendingUp className="w-6 h-6 text-primary-foreground"/>,
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
        <motion.section 
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.3, 0)}
            className="relative min-h-[85vh] flex items-center justify-center text-center text-white overflow-hidden"
        >
            <Image
                src={placeholderImages.heroFull.src}
                alt={placeholderImages.heroFull.alt}
                fill
                priority
                className="object-cover"
                data-ai-hint={placeholderImages.heroFull.hint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent"></div>
            <div className="relative z-10 container px-4 md:px-6">
                <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter font-serif [text-shadow:0_3px_6px_rgba(0,0,0,0.5)]">
                    {t.heroTitle}
                </motion.h1>
                <motion.p variants={fadeInUp} className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-white/90 [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                    {t.heroDescription}
                </motion.p>
                <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                    <Link href="/signup">
                        {t.teacherApplyButton} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                    <Link href="/signup">
                        {t.studentFindButton}
                    </Link>
                    </Button>
                </motion.div>
            </div>
        </motion.section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer(0.2, 0)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                >
                    {features.map((feature, index) => (
                        <motion.div 
                            key={index}
                            variants={fadeInUp}
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-8 bg-card rounded-2xl shadow-lg border border-transparent hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300"
                        >
                            <div className="flex justify-center mb-5">
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
                        <div className="relative flex flex-col gap-12">
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10"></div>
                            {howItWorks.students.map((item, index) => (
                                <motion.div key={index} variants={fadeInUp} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold z-10 shadow-lg shadow-primary/30">{item.icon}</div>
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
                        <div className="relative flex flex-col gap-12">
                             <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10"></div>
                            {howItWorks.teachers.map((item, index) => (
                                <motion.div key={index} variants={fadeInUp} className="flex items-start gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold z-10 shadow-lg shadow-primary/30">{item.icon}</div>
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

        {/* Join as Teacher CTA Section */}
        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={fadeInUp}
                >
                    <Card className="rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary">
                        <div className="p-8 md:p-12 text-center text-primary-foreground">
                            <Award className="h-12 w-12 mx-auto mb-4" />
                            <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.joinTeacherTitle}</h2>
                            <p className="mt-3 max-w-2xl mx-auto text-lg text-primary-foreground/90">{t.joinTeacherDescription}</p>
                            <Button asChild size="lg" variant="secondary" className="mt-8">
                                <Link href="/signup">
                                    {t.joinTeacherButton} <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
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
                    <Card className="overflow-hidden rounded-2xl shadow-2xl">
                        <Image 
                            src={placeholderImages.dashboardPreview.src} 
                            alt={placeholderImages.dashboardPreview.alt}
                            width={placeholderImages.dashboardPreview.width}
                            height={placeholderImages.dashboardPreview.height}
                            className="w-full"
                            data-ai-hint={placeholderImages.dashboardPreview.hint}
                        />
                    </Card>
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
                            <ul className="space-y-4">
                              {platformFeatures.students.map((feature, index) => (
                                <motion.li key={index} variants={fadeInUp} className="flex items-start">
                                  {feature.icon}
                                  <span className="flex-1">{feature.text}</span>
                                </motion.li>
                              ))}
                            </ul>
                        </TabsContent>
                        <TabsContent value="teachers" className="mt-6">
                            <ul className="space-y-4">
                              {platformFeatures.teachers.map((feature, index) => (
                                <motion.li key={index} variants={fadeInUp} className="flex items-start">
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
              <motion.div variants={fadeInUp} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Briefcase className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-4xl font-bold">{user && teacherCount !== undefined ? teacherCount : '50+'}</p>
                <p className="text-muted-foreground mt-2">{t.teachersLabel}</p>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-4xl font-bold">{user && studentCount !== undefined ? studentCount : '500+'}</p>
                <p className="text-muted-foreground mt-2">{t.studentsLabel}</p>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-8 bg-card rounded-2xl shadow-lg text-center">
                <Book className="h-10 w-10 text-primary mx-auto mb-4"/>
                <p className="text-4xl font-bold">10+</p>
                <p className="text-muted-foreground mt-2">{t.subjectsLabel}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* New Study Hub Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.studyHubTitle}</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.studyHubDescription}</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer(0.2, 0)}>
                <h3 className="text-2xl font-bold mb-6 flex items-center"><BookCopy className="w-7 h-7 mr-3 text-primary"/> {t.freeResourcesTitle}</h3>
                <p className="text-muted-foreground mb-6">{t.freeResourcesDescription}</p>
                <div className="flex flex-wrap gap-3">
                  {['Notes', 'PYQs', 'Books', 'DPPs'].map((item, index) => (
                    <motion.div key={index} variants={fadeInUp} className="bg-background rounded-full px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-muted transition-colors">
                      {item}
                    </motion.div>
                  ))}
                </div>
                <Button asChild className="mt-8">
                    <Link href="/signup">
                        {t.accessResourcesButton} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer(0.2, 0)}>
                <h3 className="text-2xl font-bold mb-6 flex items-center"><BookCheck className="w-7 h-7 mr-3 text-primary"/> {t.subjectsCoveredTitle}</h3>
                <p className="text-muted-foreground mb-6">{t.subjectsCoveredDescription}</p>
                <div className="flex flex-wrap gap-3">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'History', 'Geography', 'Economics', 'Accountancy', 'Business Studies'].map((item, index) => (
                    <motion.div key={index} variants={fadeInUp} className="bg-background rounded-full px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-muted transition-colors">
                      {item}
                    </motion.div>
                  ))}
                </div>
                 <Button asChild variant="outline" className="mt-8">
                    <Link href="/dashboard/student/find-teachers">
                        {t.findSubjectTutorButton} <Search className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Tutors Section */}
        {user && featuredTeachers && featuredTeachers.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeInUp}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold font-serif">{t.featuredTutorsTitle}</h2>
                <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">{t.featuredTutorsDescription}</p>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer(0.2, 0)}
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {featuredTeachers.map((teacher, index) => (
                   <motion.div 
                        key={teacher.id} 
                        variants={fadeInUp} 
                        className="h-full"
                        whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                        whileTap={{ scale: 0.98 }}
                    >
                     <Card className="flex flex-col h-full rounded-2xl shadow-lg overflow-hidden">
                        <CardHeader className="items-center text-center p-6 bg-card">
                            <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                                <AvatarFallback className="text-3xl">{getInitials(teacher.name)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="font-serif text-xl">{teacher.name}</CardTitle>
                            {teacher.subject && (
                                <p className="text-primary font-semibold">{teacher.subject}</p>
                            )}
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between text-center p-6">
                             <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{teacher.bio || 'An experienced and dedicated educator.'}</p>
                            <Button asChild variant="outline" className="mt-auto w-full">
                                <Link href={`/teachers/${teacher.id}`}>
                                    {t.viewProfileButton}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                   </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

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
                 <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="h-full"
                    whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px -5px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Card key={index} className="h-full flex flex-col bg-card border shadow-sm rounded-xl overflow-hidden">
                        <CardContent className="p-6 flex-grow">
                            <div className="flex text-yellow-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <blockquote className="text-foreground/90 text-base">"{testimonial.text}"</blockquote>
                        </CardContent>
                         <CardHeader className="bg-muted/50 p-6 border-t">
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
                        <Button asChild size="lg" className="shadow-lg shadow-primary/30">
                            <Link href="/signup">
                                {t.ctaButton} <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
      </main>

      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container px-4 md:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInUp}>
            <Link className="flex items-center justify-center gap-2 mb-6" href="/">
                <School className="h-7 w-7 text-primary" />
                <span className="text-2xl font-semibold font-serif text-white">EduConnect Pro</span>
            </Link>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-white transition-colors">
                <span>+91 12345 67890</span>
                </a>
                <a href="mailto:contact@educonnectpro.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <span>contact@educonnectpro.com</span>
                </a>
                <div className="flex items-center gap-2">
                <span>Giridih, Jharkhand</span>
                </div>
            </div>
             <div className="flex justify-center gap-4 mt-8">
                <a href="#" className="text-gray-400 hover:text-white"><Facebook className="h-6 w-6"/></a>
                <a href="#" className="text-gray-400 hover:text-white"><Twitter className="h-6 w-6"/></a>
                <a href="#" className="text-gray-400 hover:text-white"><Instagram className="h-6 w-6"/></a>
            </div>
            <p className="mt-8 text-gray-500 text-sm">
                © {new Date().getFullYear()} EduConnect Pro. All Rights Reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
