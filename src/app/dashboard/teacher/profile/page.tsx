
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserCircle, Mail, Phone, Badge, Book, Award, Briefcase, MapPin, MessageSquare, Edit, Save, DollarSign, Percent } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfile {
    name: string;
    email: string;
    role: 'tutor' | 'student';
    mobileNumber?: string;
    coachingName?: string;
    address?: string;
    whatsappNumber?: string;
    subjects?: string[];
    qualification?: string;
    experience?: string;
    fee?: string;
    discount?: string;
}

const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | string[] }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <div className="flex items-start gap-4">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{Array.isArray(value) ? value.join(', ') : value}</p>
            </div>
        </div>
    );
};

export default function TeacherProfilePage() {
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
            setFormData({
                ...userProfile,
                subjects: userProfile.subjects || [],
            });
        }
    }, [userProfile]);

    useEffect(() => {
        if (!isAuthLoading && !isProfileLoading) {
            if (!user) {
                router.replace('/login');
            } else if (userProfile && userProfile.role !== 'tutor') {
                router.replace('/dashboard/student');
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
        
        const subjectsArray = typeof formData.subjects === 'string'
            ? formData.subjects.split(',').map(s => s.trim()).filter(Boolean)
            : formData.subjects;
            
        const dataToSave = { ...formData, subjects: subjectsArray };
        
        updateDocumentNonBlocking(userProfileRef, dataToSave);
        setIsEditing(false);
    };

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center"><p>Loading profile...</p></div>
            </div>
        );
    }

    if (userProfile.role !== 'tutor') {
        return (
            <div className="flex flex-col min-h-screen">
                 <DashboardHeader userName={userProfile.name} userRole="student" />
                <div className="flex-1 flex items-center justify-center"><p>Unauthorized. Redirecting...</p></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                    <Card className="max-w-3xl mx-auto">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <UserCircle className="h-8 w-8 text-primary" />
                                    {isEditing ? 'Edit Profile' : userProfile.name}
                                </CardTitle>
                                <CardDescription>
                                    {isEditing ? 'Update your professional details below.' : 'Your personal and professional details.'}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                                            <Input id="mobileNumber" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="coachingName">Coaching Name</Label>
                                            <Input id="coachingName" name="coachingName" value={formData.coachingName || ''} onChange={handleInputChange} placeholder="e.g., Apex Tutorials" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                                            <Input id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber || ''} onChange={handleInputChange} placeholder="For student communication" />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" name="address" value={formData.address || ''} onChange={handleInputChange} placeholder="e.g., Ranchi, Jharkhand" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="subjects">Subjects Taught</Label>
                                            <Input id="subjects" name="subjects" value={Array.isArray(formData.subjects) ? formData.subjects.join(', ') : ''} onChange={handleInputChange} placeholder="e.g., Physics, Mathematics, Chemistry" />
                                             <p className="text-xs text-muted-foreground">Enter subjects separated by a comma.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qualification">Highest Qualification</Label>
                                            <Input id="qualification" name="qualification" value={formData.qualification || ''} onChange={handleInputChange} placeholder="e.g., M.Sc. in Physics" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="experience">Years of Experience</Label>
                                            <Input id="experience" name="experience" value={formData.experience || ''} onChange={handleInputChange} placeholder="e.g., 5 Years" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fee">Fee Structure</Label>
                                            <Input id="fee" name="fee" value={formData.fee || ''} onChange={handleInputChange} placeholder="e.g., 500/month per subject" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="discount">Discount Information</Label>
                                            <Input id="discount" name="discount" value={formData.discount || ''} onChange={handleInputChange} placeholder="e.g., 10% off for early birds" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-end gap-2">
                                    <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit">
                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                    </Button>
                                </CardFooter>
                            </form>
                        ) : (
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2">Personal Details</h3>
                                    <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={userProfile.email} />
                                    <ProfileItem icon={<Phone className="h-5 w-5" />} label="Mobile Number" value={userProfile.mobileNumber} />
                                    <ProfileItem icon={<Badge className="h-5 w-5" />} label="Role" value={userProfile.role} />
                                    
                                    <h3 className="md:col-span-2 text-lg font-semibold border-b pb-2 pt-4">Professional Details</h3>
                                    <ProfileItem icon={<Briefcase className="h-5 w-5" />} label="Coaching Name" value={userProfile.coachingName} />
                                    <ProfileItem icon={<MessageSquare className="h-5 w-5" />} label="WhatsApp Number" value={userProfile.whatsappNumber} />
                                    <ProfileItem icon={<MapPin className="h-5 w-5" />} label="Address" value={userProfile.address} />
                                    <ProfileItem icon={<Book className="h-5 w-5" />} label="Subjects" value={userProfile.subjects} />
                                    <ProfileItem icon={<Award className="h-5 w-5" />} label="Qualification" value={userProfile.qualification} />
                                    <ProfileItem icon={<UserCircle className="h-5 w-5" />} label="Experience" value={userProfile.experience} />
                                    <ProfileItem icon={<DollarSign className="h-5 w-5" />} label="Fee Structure" value={userProfile.fee} />
                                    <ProfileItem icon={<Percent className="h-5 w-5" />} label="Discounts" value={userProfile.discount} />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
