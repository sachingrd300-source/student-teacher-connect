'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, Briefcase, Book, MapPin, MessageSquare } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

type TutorProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  qualification?: string;
  experience?: string;
  address?: string;
  subjects?: string[];
  whatsappNumber?: string;
  coachingName?: string;
};

const TutorCard = ({ tutor }: { tutor: TutorProfile }) => {
  const whatsappLink = tutor.whatsappNumber
    ? `https://wa.me/${tutor.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I found you on EduConnect Pro. I'm interested in your classes.`)}`
    : '#';

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="h-16 w-16 border">
          <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
          <AvatarFallback className="text-xl">{tutor.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-2xl font-headline">{tutor.name}</CardTitle>
          <CardDescription>{tutor.coachingName || 'Independent Tutor'}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{tutor.qualification || 'N/A'}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{tutor.experience || 'N/A'}</span>
        </div>
         <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{tutor.address || 'Location not specified'}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
            {tutor.subjects?.map((sub) => (
                <Badge key={sub} variant="secondary">{sub}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={!tutor.whatsappNumber}>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="mr-2 h-4 w-4" /> Connect on WhatsApp
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function FindTutorPage() {
  const firestore = useFirestore();

  const tutorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'tutor'),
      where('status', '==', 'approved')
    );
  }, [firestore]);

  const { data: tutors, isLoading } = useCollection<TutorProfile>(tutorsQuery);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Search className="w-8 h-8" />
          Find a Tutor
        </h1>
        <p className="text-muted-foreground">
          Browse and connect with our community of verified expert tutors.
        </p>
      </div>

       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by subject, name, or location..." className="pl-10" />
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        
        {tutors?.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
      {!isLoading && tutors?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
              <p className="font-semibold text-lg">No Tutors Found</p>
              <p>There are currently no approved tutors available. Please check back later.</p>
          </div>
      )}
    </div>
  );
}
