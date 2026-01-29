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
    role: 'student' | 'teacher' | 'admin' | 'parent';
    subject?: string;
    bio?: string;
    coachingCenterName?: string;
    address?: string;
    whatsappNumber?: string;
    fee?: string;
    mobileNumber?: string;
    fatherName?: string;
    class?: string;
    coins?: number;
    streak?: number;
}

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ address?: string }>({});
    
    // Form state
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [address, setAddress] = useState('');
    
    // Teacher state
    const [subject, setSubject] = useState('');
    const [coachingCenterName, setCoachingCenterName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [fee, setFee] = useState('');

    // Student state
    const [mobileNumber, setMobileNumber] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [studentClass, setStudentClass] = useState('');


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
            setBio(userProfile.bio || '');
            setAddress(userProfile.address || '');

            if (userProfile.role === 'teacher') {
                setSubject(userProfile.subject || '');
                setCoachingCenterName(userProfile.coachingCenterName || '');
                setWhatsappNumber(userProfile.whatsappNumber || '');
                setFee(userProfile.fee || '');
            } else if (userProfile.role === 'student') {
                setMobileNumber(userProfile.mobileNumber || '');
                setFatherName(userProfile.fatherName || '');
                setStudentClass(userProfile.class || '');
            }
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!userProfileRef || !userProfile) return;

        const newErrors: { address?: string } = {};
        if (userProfile.role === 'teacher' && !address.trim()) {
            newErrors.address = 'Address is mandatory for teachers to be listed.';
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsSaving(true);
        try {
            const dataToUpdate: { [key: string]: any } = {
                name: name.trim(),
                bio: bio.trim(),
                address: address.trim(),
            };

            if (userProfile.role === 'teacher') {
                dataToUpdate.subject = subject.trim();
                dataToUpdate.coachingCenterName = coachingCenterName.trim();
                dataToUpdate.whatsappNumber = whatsappNumber.trim();
                dataToUpdate.fee = fee.trim();
            } else if (userProfile.role === 'student') {
                dataToUpdate.mobileNumber = mobileNumber.trim();
                dataToUpdate.fatherName = fatherName.trim();
                dataToUpdate.class = studentClass.trim();
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
            setBio(userProfile.bio || '');
            setAddress(userProfile.address || '');
            setErrors({}); // Clear errors

            if (userProfile.role === 'teacher') {
                setSubject(userProfile.subject || '');
                setCoachingCenterName(userProfile.coachingCenterName || '');
                setWhatsappNumber(userProfile.whatsappNumber || '');
                setFee(userProfile.fee || '');
            } else if (userProfile.role === 'student') {
                setMobileNumber(userProfile.mobileNumber || '');
                setFatherName(userProfile.fatherName || '');
                setStudentClass(userProfile.class || '');
            }
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
            <DashboardHeader userProfile={userProfile} />
            <main className="flex-1 p-4 md:p-8 bg-muted/20">
                <div className="max-w-2xl mx-auto">
                     <Card className="rounded-2xl shadow-lg">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className='w-full'>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>View and edit your personal information.</CardDescription>
                            </div>
                            {!isEditing && (
                               <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} className="self-end sm:self-center flex-shrink-0">
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
                            
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                {isEditing ? (
                                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a little about yourself" />
                                ) : (
                                    <p className="text-sm font-medium whitespace-pre-wrap">{bio || <span className="text-muted-foreground">Not set</span>}</p>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="address">
                                    {userProfile.role === 'teacher' ? 'Tuition Address' : 'Home Address'}
                                    {userProfile.role === 'teacher' && <span className="text-destructive"> *</span>}
                                </Label>
                                {isEditing ? (
                                    <>
                                        <Textarea
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder={
                                                userProfile.role === 'teacher' 
                                                ? "Your tuition center or primary teaching location. This is required." 
                                                : "Your home address for finding local tutors."
                                            }
                                            required={userProfile.role === 'teacher'}
                                            className={errors.address ? 'border-destructive' : ''}
                                        />
                                        {errors.address && <p className="text-sm font-medium text-destructive">{errors.address}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            {userProfile.role === 'teacher' 
                                                ? "This address will be visible to students to help them find you."
                                                : "Your address is kept private and only used to find nearby tutors."
                                            }
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm font-medium whitespace-pre-wrap">{address || <span className="text-muted-foreground">Not set</span>}</p>
                                )}
                            </div>

                             {userProfile.role === 'student' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                                        {isEditing ? (
                                            <Input id="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="e.g., +91..." />
                                        ) : (
                                            <p className="text-sm font-medium">{mobileNumber || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fatherName">Father's Name</Label>
                                        {isEditing ? (
                                            <Input id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Enter your father's name" />
                                        ) : (
                                            <p className="text-sm font-medium">{fatherName || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="studentClass">Class</Label>
                                        {isEditing ? (
                                            <Input id="studentClass" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} placeholder="e.g., 12th Grade" />
                                        ) : (
                                            <p className="text-sm font-medium">{studentClass || <span className="text-muted-foreground">Not set</span>}</p>
                                        )}
                                    </div>
                                </>
                             )}

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