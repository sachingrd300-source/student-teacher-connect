
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Book, MessageSquare, Star } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TeacherProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  subjects?: string[];
  qualification?: string;
  coachingName?: string;
  address?: string;
  whatsappNumber?: string;
};

function TutorCard({ tutor }: { tutor: TeacherProfile }) {
  const whatsappLink = tutor.whatsappNumber
    ? `https://wa.me/${tutor.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hello ${tutor.name}, I found you on EduConnect Pro and I'm interested in your classes.`
      )}`
    : '#';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="h-16 w-16 border">
          <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
          <AvatarFallback className="text-xl">
            {tutor.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl font-bold">{tutor.name}</CardTitle>
          <CardDescription>{tutor.qualification || 'N/A'}</CardDescription>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />{' '}
            {tutor.address || 'Location not specified'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Book className="h-4 w-4" /> Subjects</h4>
          <div className="flex flex-wrap gap-2">
            {tutor.subjects?.map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            ))}
             {tutor.subjects?.length === 0 && <p className="text-xs text-muted-foreground">No subjects listed.</p>}
          </div>
        </div>
        <Button asChild className="w-full" disabled={!tutor.whatsappNumber}>
          <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="mr-2 h-4 w-4" /> Connect on WhatsApp
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FindTutorPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  const tutorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for all approved tutors
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'tutor'),
      where('status', '==', 'approved')
    );
  }, [firestore]);

  const { data: tutors, isLoading } = useCollection<TeacherProfile>(tutorsQuery);

  const filteredTutors = useMemo(() => {
    if (!tutors) return [];
    return tutors.filter(
      (tutor) =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.subjects?.some((s) =>
          s.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        tutor.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tutors, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Search for verified tutors near you.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, subject, or location..."
          className="pl-10 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        {filteredTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
       {!isLoading && filteredTutors.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold">No tutors found.</p>
            <p>Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}
