
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
import { User, Book, Briefcase, Mail, Phone, Edit, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type TeacherProfileData = {
    id: string;
    name: string;
    email: string;
    mobileNumber?: string;
    avatarUrl?: string;
    qualification?: string;
    experience?: string;
    experienceType?: string;
    address?: string;
    subjects?: string[];
    classLevels?: string[];
    coachingName?: string;
};

export default function TeacherProfilePage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const [isEditOpen, setEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    
    const { data: teacherProfile, isLoading: isLoadingProfile } = useDoc<TeacherProfileData>(userProfileQuery);
    
    const [formData, setFormData] = useState<Partial<TeacherProfileData>>({});

    useEffect(() => {
        if (teacherProfile) {
            setFormData({
                name: teacherProfile.name || '',
                coachingName: teacherProfile.coachingName || 'Your Coaching Center',
                subjects: teacherProfile.subjects || [],
                qualification: teacherProfile.qualification || '',
                experience: teacherProfile.experience || '',
                address: teacherProfile.address || '',
            });
        }
    }, [teacherProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleProfileUpdate = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, {
                name: formData.name,
                coachingName: formData.coachingName,
                // For simplicity, we are not updating array fields like subjects in this form
                qualification: formData.qualification,
                experience: formData.experience,
                address: formData.address,
            });
            toast({ title: 'Profile Updated', description: 'Your information has been successfully saved.' });
            setEditOpen(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save your changes.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isProfileIncomplete = !teacherProfile?.experience || !teacherProfile?.address || !teacherProfile?.qualification;
    const isLoading = isUserLoading || isLoadingProfile;

    if (isLoading || !teacherProfile) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-5 w-80 mt-2" />
                 <Card>
                    <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-5 w-32 mt-2" />
                    </CardHeader>
                    <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                        </div>
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
                            <Input id="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="coachingName">Coaching Name</Label>
                            <Input id="coachingName" value={formData.coachingName} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subjects">Subjects</Label>
                            <Input id="subjects" value={formData.subjects?.join(', ')} disabled placeholder="e.g. Physics, Chemistry" />
                             <p className="text-xs text-muted-foreground">Subjects can be changed during sign up.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. B.Sc. Physics" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" value={formData.experience} onChange={handleInputChange} placeholder="e.g. 5 Years" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Your coaching or home address" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleProfileUpdate} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
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
                    <AvatarImage src={teacherProfile?.avatarUrl} alt={teacherProfile?.name} />
                    <AvatarFallback className="text-3xl">{teacherProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-headline">{teacherProfile?.name}</CardTitle>
                <CardDescription className="text-base">{teacherProfile?.coachingName || 'Coaching Center'}</CardDescription>
                <div className="flex gap-2 mt-2">
                    {teacherProfile?.subjects?.map(sub => <Badge key={sub} variant="secondary">{sub.trim()}</Badge>)}
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Professional Details</h3>
                     <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-1" />
                        <span>Qualification: <span className="font-medium">{teacherProfile?.qualification || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <span>Experience: <span className="font-medium">{teacherProfile?.experience || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-start gap-3">
                         <Book className="h-5 w-5 text-muted-foreground" />
                        <span>Address: <span className="font-medium">{teacherProfile?.address || 'N/A'}</span></span>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{teacherProfile?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{teacherProfile?.mobileNumber}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}

