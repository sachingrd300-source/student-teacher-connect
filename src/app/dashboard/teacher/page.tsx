"use client";

import { useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  doc
} from "firebase/firestore";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Users2, BookOpenCheck, PlusCircle, Copy, BarChart3, Loader2, Clock, XCircle, Info, CalendarDays } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type BatchType = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  batchTime: string;
  classCode: string;
  createdAt: { toDate: () => Date };
};

type UserProfile = {
    name: string;
    status: 'pending_verification' | 'approved' | 'denied';
}

type Enrollment = {
  studentId: string;
  classId: string;
  status: 'approved' | 'pending' | 'denied';
};

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card className="shadow-soft-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

function PendingVerificationCard() {
    return (
        <Card className="bg-amber-50 border-amber-200 shadow-soft-shadow">
            <CardHeader className="flex-row items-center gap-4">
                <Clock className="h-8 w-8 text-amber-600"/>
                <div>
                    <CardTitle className="text-xl text-amber-800">Application Pending Review</CardTitle>
                    <CardDescription className="text-amber-700">
                        Your profile has been submitted for verification. An administrator will review it shortly. You will be able to access the dashboard once your profile is approved.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}

function DeniedVerificationCard() {
     return (
        <Card className="bg-destructive/10 border-destructive/20 shadow-soft-shadow">
            <CardHeader className="flex-row items-center gap-4">
                <XCircle className="h-8 w-8 text-destructive"/>
                <div>
                    <CardTitle className="text-xl text-destructive">Application Not Approved</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Unfortunately, your application to become a tutor was not approved at this time. Please contact support if you believe this is an error.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
}

function TeacherDashboardContent({ userProfile }: { userProfile: UserProfile }) {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const [classSubject, setClassSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [batchTime, setBatchTime] = useState("");
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Queries for stats
  const batchesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "classes"),
      where("teacherId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "enrollments"),
        where("teacherId", "==", user.uid)
    );
  }, [firestore, user]);

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "studyMaterials"),
        where("teacherId", "==", user.uid)
    );
  }, [firestore, user]);
  
  const { data: batches, isLoading: isLoadingBatches } = useCollection<BatchType>(batchesQuery);
  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);
  const { data: materials, isLoading: isLoadingMaterials } = useCollection<any>(materialsQuery);
  
  const totalStudents = useMemo(() => {
    if (!enrollments) return 0;
    const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
    const uniqueStudentIds = new Set(approvedEnrollments.map(e => e.studentId));
    return uniqueStudentIds.size;
  }, [enrollments]);


  const handleCreateBatch = async () => {
    if (!classSubject || !classLevel || !firestore || !user || !userProfile) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide subject, level, and ensure you are logged in.",
      });
      return;
    }
    setIsCreatingBatch(true);
    
    const newBatchData = {
        title: `${classSubject} - ${classLevel}`,
        subject: classSubject,
        classLevel,
        batchTime: batchTime,
        classCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        teacherId: user.uid,
        teacherName: userProfile.name,
        isActive: true,
        createdAt: serverTimestamp(),
    };
    
    const classesCollection = collection(firestore, "classes");
    addDoc(classesCollection, newBatchData)
    .then(() => {
        toast({
            title: "Batch Created!",
            description: `The code for your new batch is: ${newBatchData.classCode}`,
        });
        setClassSubject("");
        setClassLevel("");
        setBatchTime("");
    })
    .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: classesCollection.path,
            operation: 'create',
            requestResourceData: newBatchData,
        }));
    })
    .finally(() => {
        setIsCreatingBatch(false);
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Batch code ${code} copied to clipboard.` });
  }
  
  const isLoading = isUserLoading || isLoadingBatches || isLoadingEnrollments || isLoadingMaterials;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Teacher Dashboard'}
        </h1>
        <p className="text-muted-foreground">Here's a quick overview of your activities.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Batches" value={batches?.length ?? 0} icon={<Users2 className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingBatches} />
          <StatCard title="Total Students" value={totalStudents} icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingEnrollments} />
          <StatCard title="Materials Uploaded" value={materials?.length ?? 0} icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingMaterials} />
       </div>


      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* CREATE BATCH */}
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary"/>Create a New Batch</CardTitle>
            <CardDescription>
              Create a new batch for students to join with a unique code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Batch Subject (e.g. Physics)"
              value={classSubject}
              onChange={(e) => setClassSubject(e.target.value)}
              disabled={isCreatingBatch}
            />
            <Input
              placeholder="Batch Level (e.g. 11-12)"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              disabled={isCreatingBatch}
            />
            <Input
              placeholder="Batch Time (e.g. 7:00 AM)"
              value={batchTime}
              onChange={(e) => setBatchTime(e.target.value)}
              disabled={isCreatingBatch}
            />
            <Button
              onClick={handleCreateBatch}
              className="w-full"
              disabled={isCreatingBatch || !classLevel || !classSubject}
            >
              {isCreatingBatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingBatch ? "Creating..." : "Create Batch"}
            </Button>
          </CardContent>
        </Card>

        {/* BATCH LIST */}
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle>Your Batches</CardTitle>
            <CardDescription>
              Share the code with students to let them enroll.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBatches || isLoadingEnrollments ? (
                 <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : batches && batches.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                You haven't created any batches yet.
              </p>
            ) : (
              <div className="space-y-4">
                {batches?.slice(0, 5).map((batch) => {
                    const studentCount = enrollments?.filter(e => e.classId === batch.id && e.status === 'approved').length ?? 0;
                    return (
                        <div
                            key={batch.id}
                            className="border p-4 rounded-lg bg-muted/30 flex flex-col gap-3 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-lg">{batch.title}</p>
                                    <p className="text-sm text-muted-foreground">{batch.batchTime || "No time set"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-md">{batch.classCode}</p>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyCode(batch.classCode)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Created: {batch.createdAt ? batch.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users2 className="h-4 w-4" />
                                    <span>{studentCount} {studentCount === 1 ? 'Student' : 'Students'}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
              </div>
            )}
          </CardContent>
          {batches && batches.length > 5 && (
             <CardFooter>
                 <Button variant="outline" asChild className="w-full mt-4">
                    <Link href="/dashboard/teacher/batches">Manage All Batches</Link>
                </Button>
              </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}


export default function TeacherPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);
    
    const isLoading = isUserLoading || isLoadingProfile;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (userProfile?.status === 'pending_verification') {
        return <PendingVerificationCard />;
    }

    if (userProfile?.status === 'denied') {
        return <DeniedVerificationCard />;
    }
    
    if (userProfile?.status === 'approved') {
        return <TeacherDashboardContent userProfile={userProfile} />;
    }

    // Fallback case, though it shouldn't be reached if user profile is loaded
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
}
