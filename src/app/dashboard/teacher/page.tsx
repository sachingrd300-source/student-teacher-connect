"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { createClass } from "@/firebase/class";
import { uploadMaterial } from "@/firebase/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type ClassType = {
  id: string;
  subject: string;
  classLevel: string;
  isActive: boolean;
};

type MaterialType = {
  id: string;
  title: string;
  classId: string;
};

export default function TeacherPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [classSubject, setClassSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");

  const [materialTitle, setMaterialTitle] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Real-time classes list
  const classesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "classes"), where("teacherId", "==", user.uid));
  }, [firestore, user]);

  useEffect(() => {
    if (!classesQuery) {
        setClasses([]);
        return;
    };
    
    const unsub = onSnapshot(classesQuery, (snap) => {
      setClasses(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ClassType, "id">),
        }))
      );
      setIsLoading(false);
    }, (error) => {
      console.error("Class list error:", error);
      toast({ variant: "destructive", title: "Error fetching classes", description: error.message });
      setIsLoading(false);
    });
    return () => unsub();
  }, [classesQuery, toast]);

  // Real-time materials list
   const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "studyMaterials"), where("teacherId", "==", user.uid));
  }, [firestore, user]);
  
  useEffect(() => {
    if (!materialsQuery) {
        setMaterials([]);
        return;
    }
    const unsub = onSnapshot(materialsQuery, (snap) => {
      setMaterials(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MaterialType, "id">),
        }))
      );
    }, (error) => {
        console.error("Material list error:", error);
        toast({ variant: "destructive", title: "Error fetching materials", description: error.message });
    });
    return () => unsub();
  }, [materialsQuery, toast]);

  const handleCreateClass = async () => {
    if(!classSubject || !classLevel) {
        toast({variant: 'destructive', title: 'Missing fields', description: 'Please provide subject and level.'});
        return;
    }
    try {
        await createClass(classSubject, classLevel);
        toast({title: 'Success!', description: 'Class created successfully.'});
        setClassSubject('');
        setClassLevel('');
    } catch (e: any) {
        toast({variant: 'destructive', title: 'Error', description: e.message });
    }
  }
  
  const handleUploadMaterial = async () => {
      if(!materialTitle || !selectedClass) {
          toast({variant: 'destructive', title: 'Missing fields', description: 'Please provide a title and select a class.'});
          return;
      }
      try {
          await uploadMaterial(materialTitle, selectedClass);
          toast({title: 'Success!', description: 'Material uploaded.'});
          setMaterialTitle('');
          setSelectedClass('');
      } catch (e: any) {
          toast({variant: 'destructive', title: 'Error', description: e.message});
      }
  }


  if (isLoading) {
    return <p>Loading dashboard...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
         {/* CREATE CLASS */}
        <Card>
            <CardHeader>
                <CardTitle>Create Class</CardTitle>
                <CardDescription>Create a new class for students to join.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Input
                    placeholder="Class Subject (e.g. Physics)"
                    value={classSubject}
                    onChange={(e) => setClassSubject(e.target.value)}
                />
                <Input
                    placeholder="Class Level (e.g. 11-12)"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                />
                <Button onClick={handleCreateClass} className="w-full">
                    Create Class
                </Button>
            </CardContent>
        </Card>

        {/* UPLOAD MATERIAL */}
        <Card>
            <CardHeader>
                <CardTitle>Upload Study Material</CardTitle>
                <CardDescription>Share a new resource with your students.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    placeholder="Material title"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                />

                <Select
                    value={selectedClass}
                    onValueChange={(e) => setSelectedClass(e)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a class"/>
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.subject} - {c.classLevel}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={handleUploadMaterial}
                    disabled={!selectedClass}
                    className="w-full"
                >
                    Upload Material
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* CLASS LIST */}
        <Card>
            <CardHeader>
                <CardTitle>Your Classes</CardTitle>
            </CardHeader>
            <CardContent>
                {classes.length === 0 && <p className="text-muted-foreground text-sm">No classes found.</p>}
                <div className="space-y-2">
                    {classes.map((c) => (
                        <div key={c.id} className="border p-3 rounded-md">
                        <p className="font-semibold">{c.subject} - {c.classLevel}</p>
                        <p className="text-xs text-muted-foreground">Active: {c.isActive ? "Yes" : "No"}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

         {/* MATERIAL LIST */}
         <Card>
            <CardHeader>
                <CardTitle>Uploaded Materials</CardTitle>
            </CardHeader>
            <CardContent>
                {materials.length === 0 && <p className="text-muted-foreground text-sm">No materials uploaded yet.</p>}
                <div className="space-y-2">
                     {materials.map((m) => (
                        <div key={m.id} className="border p-3 rounded-md">
                            <p className="font-semibold">{m.title}</p>
                            <p className="text-xs text-muted-foreground">Class ID: {m.classId}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
