
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { tutorsData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LandingHeader } from '@/components/landing-header';
import { Search, MapPin, Star, Book, Briefcase, BadgeCheck } from 'lucide-react';

export default function TutorsPage() {
  const [locationFilter, setLocationFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const availableLocations = useMemo(() => {
    const locations = new Set(tutorsData.map(t => t.location));
    return ['all', ...Array.from(locations)];
  }, []);

  const availableSubjects = useMemo(() => {
    const subjects = new Set(tutorsData.flatMap(t => t.subjects));
    return ['all', ...Array.from(subjects)];
  }, []);

  const filteredTutors = useMemo(() => {
    return tutorsData.filter(tutor => {
      const locationMatch = locationFilter === 'all' || tutor.location === locationFilter;
      const subjectMatch = subjectFilter === 'all' || tutor.subjects.includes(subjectFilter);
      return locationMatch && subjectMatch;
    });
  }, [locationFilter, subjectFilter]);


  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-grow">
        <section id="find-tutor" className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold font-headline">Find Your Perfect Tutor</h2>
                  <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                    Search for expert tutors in your area by subject, grade, and more.
                  </p>
                </div>
                
                <div className="my-8 p-6 bg-card rounded-xl shadow-md border max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="location-filter">Location</Label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger id="location-filter">
                                    <SelectValue placeholder="Filter by location..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableLocations.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc === 'all' ? 'All Locations' : loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="subject-filter">Subject</Label>
                             <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger id="subject-filter">
                                    <SelectValue placeholder="Filter by subject..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSubjects.map(sub => (
                                        <SelectItem key={sub} value={sub}>{sub === 'all' ? 'All Subjects' : sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <Button className="self-end md:mt-5">
                            <Search className="mr-2 h-4 w-4"/>
                            Search
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {filteredTutors.map((tutor) => (
                        <Card key={tutor.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                                    <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
                                    <AvatarFallback>{tutor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl font-headline">{tutor.name}</CardTitle>
                                  {tutor.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                                </div>
                                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                    <Star className="h-4 w-4 fill-current"/>
                                    <Star className="h-4 w-4 fill-current"/>
                                    <Star className="h-4 w-4 fill-current"/>
                                    <Star className="h-4 w-4 fill-current"/>
                                    <Star className="h-4 w-4 fill-current/50"/>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow space-y-4">
                                <div className="flex items-start gap-3">
                                    <Book className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                        <h4 className="font-semibold">Subjects</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {tutor.subjects.map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-semibold">Experience</h4>
                                        <p className="text-muted-foreground">{tutor.experience}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-semibold">Location</h4>
                                        <p className="text-muted-foreground">{tutor.location}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-muted/50">
                                <Button asChild className="w-full">
                                  <Link href={`/tutor/${tutor.id}`}>View Profile</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 {filteredTutors.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">No tutors found for the selected filters.</p>
                    </div>
                 )}
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
