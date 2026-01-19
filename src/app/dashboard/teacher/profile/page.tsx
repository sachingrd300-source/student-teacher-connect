
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { User, BookOpenCheck, Mail, Phone, Edit, Info, MessageSquare, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

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
    whatsappNumber?: string;
    status: 'pending_verification' | 'approved' | 'denied';
};

type ProfileFormData = {
    name: string;
    coachingName: string;
    subjects: string;
    classLevels: string;
    qualification: string;
    experience: string;
    address: string;
    whatsappNumber: string;
};


function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-72 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card className="shadow-soft-shadow overflow-hidden">
                <CardHeader className="p-0">
                    <div className="bg-muted/30 p-8 flex flex-col md:flex-row items-center gap-6">
                        <Skeleton className="h-28 w-28 rounded-full" />
                        <div className="space-y-3 text-center md:text-left">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}


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
    
    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        coachingName: '',
        subjects: '',
        classLevels: '',
        qualification: '',
        experience: '',
        address: '',
        whatsappNumber: '',
    });

    useEffect(() => {
        if (teacherProfile) {
            setFormData({
                name: teacherProfile.name || '',
                coachingName: teacherProfile.coachingName || '',
                subjects: teacherProfile.subjects?.join(', ') || '',
                classLevels: teacherProfile.classLevels?.join(', ') || '',
                qualification: teacherProfile.qualification || '',
                experience: teacherProfile.experience || '',
                address: teacherProfile.address || '',
                whatsappNumber: teacherProfile.whatsappNumber || '',
            });
        }
    }, [teacherProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleProfileUpdate = () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const userRef = doc(firestore, 'users', user.uid);
        
        const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(Boolean);
        const classLevelsArray = formData.classLevels.split(',').map(s => s.trim()).filter(Boolean);

        const updatedData = {
            name: formData.name,
            coachingName: formData.coachingName,
            qualification: formData.qualification,
            experience: formData.experience,
            address: formData.address,
            whatsappNumber: formData.whatsappNumber,
            subjects: subjectsArray,
            classLevels: classLevelsArray,
        };

        updateDoc(userRef, updatedData)
        .then(() => {
            toast({ title: 'Profile Updated', description: 'Your information has been successfully saved.' });
            setEditOpen(false);
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                })
            );
        })
        .finally(() => {
            setIsSaving(false);
        });
    };
    
    const isProfileIncomplete = !teacherProfile?.experience || !teacherProfile?.address || !teacherProfile?.qualification || !teacherProfile.whatsappNumber;
    const isLoading = isUserLoading || isLoadingProfile;

    if (isLoading || !teacherProfile) {
        return <ProfileSkeleton />;
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
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="coachingName">Coaching/Institute Name</Label>
                            <Input id="coachingName" value={formData.coachingName} onChange={handleInputChange} placeholder="Your Coaching Center"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subjects">Subjects</Label>
                            <Input id="subjects" value={formData.subjects} onChange={handleInputChange} placeholder="e.g. Physics, Chemistry" />
                            <p className="text-xs text-muted-foreground">Separate subjects with a comma.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classLevels">Class Levels</Label>
                            <Input id="classLevels" value={formData.classLevels} onChange={handleInputChange} placeholder="e.g. 9-10, 11-12, Undergraduate" />
                            <p className="text-xs text-muted-foreground">Separate class levels with a comma.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="qualification">Highest Qualification</Label>
                            <Input id="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. B.Sc. Physics" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" value={formData.experience} onChange={handleInputChange} placeholder="e.g. 5 Years" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address / City</Label>
                            <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Your coaching or city" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                            <Input id="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="e.g. 919876543210" />
                            <p className="text-xs text-muted-foreground">Include country code (e.g. 91 for India).</p>
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

        {teacherProfile.status === 'pending_verification' && (
             <Card className="bg-amber-50 border-amber-200 shadow-soft-shadow">
                <CardHeader className="flex-row items-center gap-4">
                    <Clock className="h-8 w-8 text-amber-600"/>
                    <div>
                        <CardTitle className="text-xl text-amber-800">Profile Pending Review</CardTitle>
                        <CardDescription className="text-amber-700">
                            Your profile is currently being reviewed by an admin. You can still edit your details below while you wait.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        )}
      
        {isProfileIncomplete && teacherProfile.status === 'approved' && (
            <Card className="bg-primary/10 border-primary/20 shadow-soft-shadow">
                <CardHeader className="flex-row items-center gap-4">
                    <Info className="h-6 w-6 text-primary"/>
                    <div>
                        <CardTitle className="text-lg">Complete Your Profile</CardTitle>
                        <CardDescription className="text-primary/80">Add your address and WhatsApp number to be visible to students.</CardDescription>
                    </div>
                </CardHeader>
                <CardFooter>
                     <Button onClick={() => setEditOpen(true)}>Complete Profile Now</Button>
                </CardFooter>
            </Card>
        )}

        <Card className="shadow-soft-shadow overflow-hidden">
            <CardHeader className="p-0">
                <div className="bg-muted/30 p-8 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                        <AvatarImage src={teacherProfile?.avatarUrl} alt={teacherProfile?.name} />
                        <AvatarFallback className="text-4xl">{teacherProfile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold font-headline">{teacherProfile?.name}</h2>
                        <p className="text-lg text-muted-foreground">{teacherProfile?.coachingName || 'Independent Tutor'}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary"/>Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start">
                            <span className="font-semibold w-28 shrink-0">Qualification:</span>
                            <span className="text-muted-foreground">{teacherProfile?.qualification || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                            <span className="font-semibold w-28 shrink-0">Experience:</span>
                            <span className="text-muted-foreground">{teacherProfile?.experience || 'N/A'}</span>
                        </div>
                         <div className="flex items-start">
                            <span className="font-semibold w-28 shrink-0">Location:</span>
                            <span className="text-muted-foreground">{teacherProfile?.address || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/>Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                         <div className="flex items-center">
                            <span className="font-semibold w-24 shrink-0">Email:</span>
                            <span className="text-muted-foreground truncate">{teacherProfile?.email}</span>
                        </div>
                         <div className="flex items-center">
                            <span className="font-semibold w-24 shrink-0">Mobile:</span>
                            <span className="text-muted-foreground">{teacherProfile?.mobileNumber || 'N/A'}</span>
                        </div>
                         <div className="flex items-center">
                            <span className="font-semibold w-24 shrink-0">WhatsApp:</span>
                            {teacherProfile.whatsappNumber ? (
                                <Link href={`https://wa.me/${teacherProfile.whatsappNumber.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {teacherProfile.whatsappNumber}
                                </Link>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 lg:col-span-1">
                     <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary"/>Teaching Focus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold mb-2 text-sm">Subjects Taught</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                             {teacherProfile?.subjects && teacherProfile.subjects.length > 0 ? teacherProfile.subjects.map(sub => (
                                <Badge key={sub}>{sub.trim()}</Badge>
                             )) : <p className="text-sm text-muted-foreground">No subjects listed.</p>}
                        </div>
                         <h4 className="font-semibold mb-2 text-sm">Class Levels</h4>
                        <div className="flex flex-wrap gap-2">
                             {teacherProfile?.classLevels && teacherProfile.classLevels.length > 0 ? teacherProfile.classLevels.map(level => (
                                <Badge key={level} variant="outline">{level.trim()}</Badge>
                             )) : <p className="text-sm text-muted-foreground">No class levels listed.</p>}
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    </div>
  );
}
