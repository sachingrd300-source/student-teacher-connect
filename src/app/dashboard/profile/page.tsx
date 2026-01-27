'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit, Save } from 'lucide-react';

interface UserProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher';
    subject?: string;
    bio?: string;
    coachingCenterName?: string;
    address?: string;
    whatsappNumber?: string;
    fee?: string;
}

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [bio, setBio] = useState('');
    const [coachingCenterName, setCoachingCenterName] = useState('');
    const [address, setAddress] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [fee, setFee] = useState('');


    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);
    
    // Effect to populate form when profile data loads
    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setSubject(userProfile.subject || '');
            setBio(userProfile.bio || '');
            setCoachingCenterName(userProfile.coachingCenterName || '');
            setAddress(userProfile.address || '');
            setWhatsappNumber(userProfile.whatsappNumber || '');
            setFee(userProfile.fee || '');
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!userProfileRef || !userProfile) return;
        setIsSaving(true);
        try {
            const dataToUpdate: { [key: string]: any } = {
                name: name.trim(),
                bio: bio.trim(),
            };

            if (userProfile.role === 'teacher') {
                dataToUpdate.subject = subject.trim();
                dataToUpdate.coachingCenterName = coachingCenterName.trim();
                dataToUpdate.address = address.trim();
                dataToUpdate.whatsappNumber = whatsappNumber.trim();
                dataToUpdate.fee = fee.trim();
            }
            
            await updateDoc(userProfileRef, dataToUpdate);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile: ", error);
            // Optionally: show an error toast
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset state to original profile data
        if (userProfile) {
            setName(userProfile.name || '');
            setSubject(userProfile.subject || '');
            setBio(userProfile.bio || '');
            setCoachingCenterName(userProfile.coachingCenterName || '');
            setAddress(userProfile.address || '');
            setWhatsappNumber(userProfile.whatsappNumber || '');
            setFee(userProfile.fee || '');
        }
        setIsEditing(false);
    };

    const isLoading = isUserLoading || profileLoading;

    if (isLoading || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>View and edit your personal information.</CardDescription>
                            </div>
                            {!isEditing && (
                               <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit Profile</span>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="grid gap-6">
                           <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                {isEditing ? (
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                ) : (
                                    <p className="text-sm font-medium">{name}</p>
                                )}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <p className="text-sm text-muted-foreground">{userProfile.email} (Cannot be changed)</p>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <p className="text-sm font-medium capitalize">{userProfile.role}</p>
                            </div>
                             {userProfile.role === 'teacher' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="coachingCenterName">Coaching Center Name</Label>
                                        {isEditing ? (
                                            <Input id="coachingCenterName" value={coachingCenterName} onChange={(e) => setCoachingCenterName(e.target.value)} placeholder="e.g., Success Tutorials" />
                                        ) : (
                                            <p className="text-sm font-medium">{coachingCenterName || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        {isEditing ? (
                                            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Physics, Mathematics" />
                                        ) : (
                                            <p className="text-sm font-medium">{subject || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        {isEditing ? (
                                            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address" />
                                        ) : (
                                            <p className="text-sm font-medium whitespace-pre-wrap">{address || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                                        {isEditing ? (
                                            <Input id="whatsappNumber" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g., +91..." />
                                        ) : (
                                            <p className="text-sm font-medium">{whatsappNumber || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fee">Fee Structure</Label>
                                        {isEditing ? (
                                            <Input id="fee" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g., 500/month" />
                                        ) : (
                                            <p className="text-sm font-medium">{fee || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                </>
                             )}

                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                {isEditing ? (
                                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about yourself" />
                                ) : (
                                    <p className="text-sm font-medium whitespace-pre-wrap">{bio || <span className="text-muted-foreground">Not set</span>}</p>
                                )}
                            </div>
                        </CardContent>
                        {isEditing && (
                            <CardFooter className="justify-end gap-2">
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    )
}