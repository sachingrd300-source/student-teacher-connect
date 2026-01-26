'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserCircle, Mail, Home, Edit, Save } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfile {
    name: string;
    email: string;
    role: 'tutor' | 'student';
    address?: string;
}

const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
};

export default function StudentProfilePage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    useEffect(() => {
        if (userProfile) {
            setFormData(userProfile);
        }
    }, [userProfile]);

    useEffect(() => {
        if (!isAuthLoading && !isProfileLoading) {
            if (!user) {
                router.replace('/login');
            } else if (userProfile && userProfile.role !== 'student') {
                router.replace('/dashboard/teacher');
            }
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        if (!userProfileRef) return;
        
        updateDocumentNonBlocking(userProfileRef, formData);
        setIsEditing(false);
    };

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center"><p>Loading profile...</p></div>
            </div>
        );
    }
    
    if (userProfile.role !== 'student') {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={formData.name} userRole="student" />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader className="flex flex-row items-start justify-between">
                             <div>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <UserCircle className="h-8 w-8 text-primary" />
                                     {isEditing ? 'Edit Profile' : userProfile.name}
                                </CardTitle>
                                <CardDescription>
                                    {isEditing ? 'Update your personal details below.' : 'Your personal details on EduConnect Pro.'}
                                </CardDescription>
                            </div>
                             {!isEditing && (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                                </Button>
                            )}
                        </CardHeader>
                        {isEditing ? (
                             <form onSubmit={handleSave}>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" name="address" value={formData.address || ''} onChange={handleInputChange} placeholder="e.g. Ranchi, Jharkhand"/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="email">Email (Cannot be changed)</Label>
                                            <Input id="email" name="email" value={formData.email || ''} disabled />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-end gap-2">
                                    <Button variant="ghost" type="button" onClick={() => { setIsEditing(false); setFormData(userProfile); }}>Cancel</Button>
                                    <Button type="submit">
                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                    </Button>
                                </CardFooter>
                            </form>
                        ) : (
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={userProfile.email} />
                                    <ProfileItem icon={<Home className="h-5 w-5" />} label="Address" value={userProfile.address} />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
