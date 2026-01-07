
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const studentFeatures = [
    {
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        title: "Personalized Dashboard",
        description: "Your central hub for everything related to your studies. See your schedule, new materials, and pending assignments at a glance."
    },
    {
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        title: "Access Study Materials",
        description: "Instantly access and download notes, daily practice papers (DPPs), and other resources uploaded by your teacher."
    },
    {
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        title: "Track Your Performance",
        description: "Monitor your test scores and attendance over time to see your progress and identify areas for improvement."
    },
    {
        icon: <CheckCircle className="h-6 w-6 text-primary" />,
        title: "Stay on Schedule",
        description: "Never miss a class with an up-to-date schedule of your upcoming online and offline classes."
    }
]

export default function StudentsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        {/* Hero Section for Students */}
        <section className="w-full py-20 md:py-32 bg-card">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight text-foreground">
              Your Personalized Learning Hub
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              Connect with your teacher, access all your study materials, and track your academic progress in one place.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard/student">Go to My Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need to Succeed</h2>
                  <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                    EduConnect Pro provides students with the tools to stay organized and excel in their studies.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {studentFeatures.map(feature => (
                        <Card key={feature.title} className="shadow-lg">
                            <CardHeader className="flex flex-row items-center gap-4">
                                {feature.icon}
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="py-6 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EduConnect Pro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
