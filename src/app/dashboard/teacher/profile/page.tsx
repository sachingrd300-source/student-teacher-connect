
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Book, Briefcase, MapPin, Mail, Phone, Edit, Info } from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type UserProfile = {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    avatarUrl?: string;
};

type TeacherProfile = {
    id: string;
    userId: string;
    className: string;
    subjects: string;
    experience: string;
    address: string;
};

export default function TeacherProfilePage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditOpen, setEditOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [experience, setExperience] = useState('');
    const [address, setAddress] = useState('');

    // Fetch user profile
    const userDocRef = useMemoFirebase(() => 
        authUser ? doc(firestore, 'users', authUser.uid) : null
    , [firestore, authUser]);
    const { data: userProfile, isLoading: isLoadingUser } = useDoc<UserProfile>(userDocRef);

    // Fetch teacher profile
    const teacherQuery = useMemoFirebase(() => 
        authUser ? query(collection(firestore, 'teachers'), where('userId', '==', authUser.uid), 1) : null
    , [firestore, authUser]);
    const { data: teacherDocs, isLoading: isLoadingTeacher } = useCollection<TeacherProfile>(teacherQuery);
    const teacherProfile = teacherDocs?.[0];

    const isProfileIncomplete = teacherProfile?.experience === 'Not set' || teacherProfile?.address === 'Not set';

    // Effect to populate form when data is loaded
    useEffect(() => {
        if (userProfile) setName(userProfile.name);
        if (teacherProfile) {
            setClassName(teacherProfile.className);
            setSubjects(teacherProfile.subjects);
            setExperience(teacherProfile.experience);
            setAddress(teacherProfile.address);
        }
    }, [userProfile, teacherProfile]);

    const handleProfileUpdate = () => {
        if (!firestore || !userProfile || !teacherProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update profile.' });
            return;
        }

        // Update user document
        const userRef = doc(firestore, 'users', userProfile.id);
        updateDocumentNonBlocking(userRef, { name });

        // Update teacher document
        const teacherRef = doc(firestore, 'teachers', teacherProfile.id);
        updateDocumentNonBlocking(teacherRef, {
            className,
            subjects,
            experience,
            address,
        });

        toast({ title: 'Profile Updated', description: 'Your information has been successfully saved.' });
        setEditOpen(false);
    };

    if (isUserLoading || isLoadingUser || isLoadingTeacher) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-5 w-80 mt-2" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-24 w-24 rounded-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </CardContent>
                 </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground">View and manage your personal and professional details.</p>
            </div>
             <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Your Profile</DialogTitle>
                        <DialogDescription>Update your details below. Click save when you're done.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="className">Coaching Name</Label>
                            <Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subjects">Subjects</Label>
                            <Input id="subjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="e.g. Physics, Chemistry" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 Years" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your coaching or home address" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleProfileUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      
        {isProfileIncomplete && (
            <Card className="bg-primary/10 border-primary/20">
                <CardHeader className="flex-row items-center gap-4">
                    <Info className="h-6 w-6 text-primary"/>
                    <div>
                        <CardTitle className="text-lg">Welcome to EduConnect Pro!</CardTitle>
                        <CardDescription className="text-primary/80">Complete your profile to help students and parents learn more about you.</CardDescription>
                    </div>
                </CardHeader>
                <CardFooter>
                     <Button onClick={() => setEditOpen(true)}>Complete Profile Now</Button>
                </CardFooter>
            </Card>
        )}

        <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
                    <AvatarFallback className="text-3xl">{userProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-headline">{userProfile?.name}</CardTitle>
                <CardDescription className="text-base">{teacherProfile?.className}</CardDescription>
                <div className="flex gap-2 mt-2">
                    {teacherProfile?.subjects?.split(',').map(sub => <Badge key={sub} variant="secondary">{sub.trim()}</Badge>)}
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Professional Details</h3>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <span>Experience: <span className="font-medium">{teacherProfile?.experience || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                        <span>Address: <span className="font-medium">{teacherProfile?.address || 'N/A'}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Book className="h-5 w-5 text-muted-foreground" />
                        <span>Verification Code: <Badge variant="default">{teacherProfile?.id}</Badge></span>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{userProfile?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{userProfile?.mobileNumber}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
