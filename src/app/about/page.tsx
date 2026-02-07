'use client';

import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function AboutPage() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader currentLanguage={language} onLanguageChange={setLanguage} />
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-serif">About Achiever's Community</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Giridih’s premier educational platform dedicated to bridging the gap between quality education and aspiring students.
            </p>
          </div>

          <div className="grid gap-10">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  Humara mission simple hai: Har student ko kam se kam fee mein behtareen education, sahi guidance aur resources dena taaki wo apne sapno ko sach kar sakein. Chahe wo school exams hon ya competitive goals, hum education ko accessible aur result-oriented banane mein believe karte hain.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">What We Offer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Expert Home Tuitions</h3>
                    <p className="text-muted-foreground">Giridih ke top college students aur experienced teachers ko hum directly aapke ghar tak late hain, taaki personal attention se behtar learning ho sake.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Achievers Study Centers</h3>
                    <p className="text-muted-foreground">Humne aise offline centers design kiye hain jahan students ko ek focused environment aur expert mentorship milti hai.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Tech-Driven Learning</h3>
                    <p className="text-muted-foreground">Hum smart management systems ka use karte hain taaki students ki progress track ho sake aur unhe modern education mil sake.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">A Platform for Every Coaching Center</h3>
                    <p className="text-muted-foreground">Chhote se chhote private coaching centers bhi humare platform se judkar apne students ke liye hamari technology ka free mein upyog kar sakte hain. Isse teacher-student connectivity behtar hoti hai, management aasan ho jaata hai, aur aap samay par payment prapt kar sakte hain.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Why Choose Us?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                    Achiever's Community sirf ek coaching center nahi, ek movement hai. Humara focus sirf syllabus khatam karne par nahi, balki student ki overall growth aur confidence building par hota hai.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg bg-primary text-primary-foreground text-center">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold font-serif mb-2">Our Vision</h3>
                <p className="text-lg opacity-90">
                  Hum Giridih ke har gaon mein study centers kholkar ek aisi community banana chahte hain jahan har learner ek "Achiever" ban sake.
                </p>
                 <blockquote className="mt-6 text-xl font-semibold italic">
                    "Join us, and let’s achieve greatness together!"
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
