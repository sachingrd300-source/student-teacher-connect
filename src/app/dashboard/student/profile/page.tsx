'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type UserProfileData = {
    name: string;
    email: string;
    mobileNumber?: string;
    avatarUrl?: string; // assuming avatar might be added later
};

type ProfileFormData = {
    name: string;
    mobileNumber: string;
};

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card className="shadow-soft-shadow">
                <CardHeader className="items-center text-center p-8 bg-muted/20">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-7 w-32 mt-4" />
                    <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function StudentProfilePage() {
    const { toast } = useToast();
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const [isEditOpen, setEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfileData>(userProfileQuery);
    
    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        mobileNumber: '',
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                mobileNumber: userProfile.mobileNumber || '',
            });
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleProfileUpdate = () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const userRef = doc(firestore, 'users', user.uid);
        
        const updatedData = {
            name: formData.name,
            mobileNumber: formData.mobileNumber,
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
    
    const isLoading = isUserLoading || isLoadingProfile;

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!userProfile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Profile Not Found</CardTitle>
                    <CardDescription>We couldn't load your profile data.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><User className="h-8 w-8" /> My Profile</h1>
                <p className="text-muted-foreground">View and manage your personal details.</p>
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
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="Your contact number"/>
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

        <Card className="shadow-soft-shadow">
             <CardHeader className="items-center text-center p-8 bg-muted/20">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
                        <AvatarFallback className="text-3xl">{userProfile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-1 pt-4">
                        <h2 className="text-2xl font-bold font-headline">{userProfile?.name}</h2>
                        <p className="text-base text-muted-foreground">{userProfile?.email}</p>
                    </div>
                </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-base p-3 rounded-lg bg-muted/40">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="font-medium">Mobile Number:</span>
                    <span className="text-muted-foreground">{userProfile?.mobileNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-4 text-base p-3 rounded-lg bg-muted/40">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="font-medium">Email Address:</span>
                    <span className="text-muted-foreground">{userProfile?.email}</span>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
