
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
import { Users2, BookOpenCheck, PlusCircle, Copy, BarChart3, Loader2 } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type ClassType = {
  id: string;
  subject: string;
  classLevel: string;
  classCode: string;
  title: string;
};

type UserProfile = {
    name: string;
}

type Enrollment = {
  studentId: string;
};

type StudyMaterial = {
  id: string;
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

export default function TeacherPage() {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const [classSubject, setClassSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [batchTime, setBatchTime] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Get teacher's profile to access name
  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);


  // Queries for stats
  const classesQuery = useMemoFirebase(() => {
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
        where("teacherId", "==", user.uid),
        where("status", "==", "approved")
    );
  }, [firestore, user]);

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, "studyMaterials"),
        where("teacherId", "==", user.uid)
    );
  }, [firestore, user]);
  
  const { data: classes, isLoading: isLoadingClasses } = useCollection<ClassType>(classesQuery);
  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);
  const { data: materials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);
  
  const totalStudents = useMemo(() => {
    if (!enrollments) return 0;
    const uniqueStudentIds = new Set(enrollments.map(e => e.studentId));
    return uniqueStudentIds.size;
  }, [enrollments]);


  const handleCreateClass = async () => {
    if (!classSubject || !classLevel || !firestore || !user || !userProfile) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide subject, level, and ensure you are logged in.",
      });
      return;
    }
    setIsCreatingClass(true);
    
    const newClassData = {
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
    addDoc(classesCollection, newClassData)
    .then(() => {
        toast({ title: "Success!", description: "Class created successfully." });
        setClassSubject("");
        setClassLevel("");
        setBatchTime("");
    })
    .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: classesCollection.path,
            operation: 'create',
            requestResourceData: newClassData,
        }));
    })
    .finally(() => {
        setIsCreatingClass(false);
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Class code copied to clipboard." });
  }
  
  const isLoading = isUserLoading || isLoadingClasses || isLoadingEnrollments || isLoadingMaterials;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Teacher Dashboard'}
        </h1>
        <p className="text-muted-foreground">Here's a quick overview of your activities.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Classes" value={classes?.length ?? 0} icon={<Users2 className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingClasses} />
          <StatCard title="Total Students" value={totalStudents} icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingEnrollments} />
          <StatCard title="Materials Uploaded" value={materials?.length ?? 0} icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />} isLoading={isLoadingMaterials} />
       </div>


      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* CREATE CLASS */}
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary"/>Create a New Class</CardTitle>
            <CardDescription>
              Create a new class for students to join with a unique code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Class Subject (e.g. Physics)"
              value={classSubject}
              onChange={(e) => setClassSubject(e.target.value)}
              disabled={isCreatingClass}
            />
            <Input
              placeholder="Class Level (e.g. 11-12)"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              disabled={isCreatingClass}
            />
            <Input
              placeholder="Batch Time (e.g. 7:00 AM)"
              value={batchTime}
              onChange={(e) => setBatchTime(e.target.value)}
              disabled={isCreatingClass}
            />
            <Button
              onClick={handleCreateClass}
              className="w-full"
              disabled={isCreatingClass || !classLevel || !classSubject}
            >
              {isCreatingClass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingClass ? "Creating..." : "Create Class"}
            </Button>
          </CardContent>
        </Card>

        {/* CLASS LIST */}
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle>Your Classes</CardTitle>
            <CardDescription>
              Share the code with students to let them enroll.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingClasses ? (
                 <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : classes && classes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                You haven't created any classes yet.
              </p>
            ) : (
              <div className="space-y-3">
                {classes?.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="border p-3 rounded-lg bg-muted/30 flex justify-between items-center transition-colors"
                  >
                    <div>
                        <p className="font-semibold text-base">
                        {c.title}
                        </p>
                         <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Join Code:</p>
                        <div className="flex items-center gap-2">
                             <p className="font-mono text-lg text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-md">{c.classCode}</p>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyCode(c.classCode)}>
                                <Copy className="h-4 w-4"/>
                             </Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {classes && classes.length > 0 && (
             <CardFooter>
                 <Button variant="outline" asChild className="w-full mt-4">
                    <Link href="/dashboard/teacher/batches">Manage All Classes</Link>
                </Button>
              </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
