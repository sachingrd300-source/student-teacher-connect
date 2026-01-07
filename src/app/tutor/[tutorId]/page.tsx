
'use client';

import { notFound } from 'next/navigation';
import { tutorsData } from '@/lib/data';
import { LandingHeader } from '@/components/landing-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Book, Briefcase, MapPin, MessageSquare, Award, Clock, DollarSign, BadgeCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TutorProfilePage({ params }: { params: { tutorId: string } }) {
  const tutor = tutorsData.find(t => t.id === params.tutorId);

  if (!tutor) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-12">
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left p-6 md:p-8 bg-muted/20">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
                    <AvatarFallback className="text-4xl">{tutor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <CardTitle className="text-4xl font-headline">{tutor.name}</CardTitle>
                        {tutor.isVerified && <BadgeCheck className="h-7 w-7 text-primary" />}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-500 mt-2">
                        <Star className="h-5 w-5 fill-current"/>
                        <Star className="h-5 w-5 fill-current"/>
                        <Star className="h-5 w-5 fill-current"/>
                        <Star className="h-5 w-5 fill-current"/>
                        <Star className="h-5 w-5 fill-current/50"/>
                        <span className="text-muted-foreground ml-2 text-sm">(4.5 stars from 23 reviews)</span>
                    </div>
                     <CardDescription className="mt-4">
                        A passionate and experienced educator dedicated to helping students achieve their full potential. With a proven track record of success, I specialize in making complex topics understandable and engaging.
                     </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="font-bold text-xl text-primary font-headline">Details</h3>
                    <div className="flex items-start gap-4">
                        <Award className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Qualification</h4>
                            <p className="text-muted-foreground text-base">{tutor.qualification}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Book className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Subjects</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tutor.subjects.map(sub => <Badge key={sub} variant="secondary" className="text-base">{sub}</Badge>)}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Briefcase className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Experience</h4>
                            <p className="text-muted-foreground text-base">{tutor.experience}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Location</h4>
                            <p className="text-muted-foreground text-base">{tutor.location}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Users className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Gender</h4>
                            <p className="text-muted-foreground text-base">{tutor.gender}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Clock className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Availability</h4>
                            <p className="text-muted-foreground text-base">{tutor.availableTime}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <DollarSign className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-lg">Fees</h4>
                            <p className="text-muted-foreground text-base">{tutor.fees}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="font-bold text-xl text-primary font-headline mb-4">Interested?</h3>
                    <p className="text-muted-foreground mb-6">
                        Contact {tutor.name.split(' ')[0]} to schedule a demo class or inquire about availability.
                    </p>
                    <Button size="lg" className="w-full">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Send a Message
                    </Button>
                     <p className="text-xs text-center text-muted-foreground mt-4">
                        For security, all initial communication is handled through the EduConnect Pro platform.
                    </p>
                </div>
            </CardContent>
             <CardFooter className="p-6 bg-muted/20 border-t">
                <Link href="/#find-tutor">
                    &larr; Back to all tutors
                </Link>
             </CardFooter>
        </Card>
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
