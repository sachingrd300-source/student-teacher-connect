
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { teacherData as initialTeacherData } from '@/lib/data';

type TeacherProfileData = {
    id: string;
    name: string;
    className: string;
    subjects: string;
    experience: string;
    address: string;
    email: string;
    mobileNumber: string;
    avatarUrl: string;
    qualification: string;
};

export default function TeacherProfilePage() {
    const { toast } = useToast();
    const [isEditOpen, setEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [experience, setExperience] = useState('');
    const [address, setAddress] = useState('');
    const [qualification, setQualification] = useState('');

    useEffect(() => {
        // Simulate fetching data for a newly registered user
        setTimeout(() => {
            const profile: TeacherProfileData = {
                id: initialTeacherData.id,
                name: 'New Tutor', // Default name
                className: "Your Coaching Center", // Default
                subjects: 'Your Subjects', // Default
                experience: '', // Empty initially
                address: '', // Empty initially
                email: 'new.tutor@example.com',
                mobileNumber: '123-456-7890',
                avatarUrl: initialTeacherData.avatarUrl,
                qualification: '' // Empty initially
            };
            setTeacherProfile(profile);

            // Populate form fields for the edit dialog
            setName(profile.name);
            setClassName(profile.className);
            setSubjects(profile.subjects);
            setExperience(profile.experience);
            setAddress(profile.address);
            setQualification(profile.qualification);

            setIsLoading(false);
        }, 1000);
    }, []);

    const handleProfileUpdate = () => {
        if (!teacherProfile) return;

        const updatedProfile = { ...teacherProfile, name, className, subjects, experience, address, qualification };
        setTeacherProfile(updatedProfile);

        toast({ title: 'Profile Updated', description: 'Your information has been successfully saved.' });
        setEditOpen(false);
    };
    
    const isProfileIncomplete = !experience || !address || !qualification;

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
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. B.Sc. Physics" />
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
                    <AvatarImage src={teacherProfile?.avatarUrl} alt={teacherProfile?.name} />
                    <AvatarFallback className="text-3xl">{teacherProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-headline">{teacherProfile?.name}</CardTitle>
                <CardDescription className="text-base">{teacherProfile?.className}</CardDescription>
                <div className="flex gap-2 mt-2">
                    {teacherProfile?.subjects?.split(',').map(sub => <Badge key={sub} variant="secondary">{sub.trim()}</Badge>)}
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
