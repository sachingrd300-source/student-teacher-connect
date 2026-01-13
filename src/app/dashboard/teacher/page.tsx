"use client";

import { useState, useMemo } from "react";
import {
  collection,
  query,
  where,
} from "firebase/firestore";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { createClass } from "@/firebase/class";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

type ClassType = {
  id: string;
  subject: string;
  classLevel: string;
  classCode: string;
};

export default function TeacherPage() {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const [classSubject, setClassSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  const classesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "classes"),
      where("teacherId", "==", user.uid)
    );
  }, [firestore, user]);
  
  const { data: classes, isLoading: isLoadingClasses } = useCollection<ClassType>(classesQuery);

  const handleCreateClass = async () => {
    if (!classSubject || !classLevel) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide subject and level.",
      });
      return;
    }
    setIsCreatingClass(true);
    try {
      await createClass(classSubject, classLevel);
      toast({ title: "Success!", description: "Class created successfully." });
      setClassSubject("");
      setClassLevel("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsCreatingClass(false);
    }
  };
  
  const isLoading = isUserLoading || isLoadingClasses;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* CREATE CLASS */}
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle>Create a New Class</CardTitle>
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
            <Button
              onClick={handleCreateClass}
              className="w-full"
              disabled={isCreatingClass || !classLevel || !classSubject}
            >
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
            {isLoading && (
                 <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            )}
            {!isLoading && classes && classes.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                You haven't created any classes yet.
              </p>
            )}
            {!isLoading && classes && classes.length > 0 && (
              <div className="space-y-3">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="border p-3 rounded-md bg-muted/50 flex justify-between items-center"
                  >
                    <div>
                        <p className="font-semibold">
                        {c.subject} - {c.classLevel}
                        </p>
                         <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">Join Code:</p>
                        <p className="font-mono text-lg text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-md">{c.classCode}</p>
                    </div>
                  </div>
                ))}
                 <Button variant="link" asChild className="w-full mt-4">
                    <Link href="/dashboard/teacher/batches">Manage All Classes</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
