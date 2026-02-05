
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, where, query, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useEffect, useState, useMemo, Fragment } from 'react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';

import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Clipboard, Users, Book, User as UserIcon, Building2, PlusCircle, Trash2, UserPlus, FilePlus, X, Pen, Save, UserX, GraduationCap, Wallet, CheckCircle, XCircle, Menu, LayoutDashboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchoolFeeManagementDialog } from '@/components/school-fee-management-dialog';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';


// Interfaces
interface UserProfile {
    name: string;
    role?: 'teacher' | 'admin' | 'student' | 'parent';
}
interface FeeEntry {
    feeMonth: number;
    feeYear: number;
    status: 'paid' | 'unpaid';
    paidOn?: string;
}

interface StudentEntry {
    id: string;
    name:string;
    rollNumber?: string;
    fatherName?: string;
    mobileNumber?: string;
    address?: string;
    admissionDate?: string;
    fees?: FeeEntry[];
}

interface ClassEntry {
    id: string;
    name: string;
    section: string;
    students?: StudentEntry[];
    teacherId?: string;
    teacherName?: string;
}

interface School {
    id: string;
    name: string;
    address: string;
    code: string;
    principalId: string;
    teacherIds?: string[];
    classes?: ClassEntry[];
    academicYear?: string;
}

interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    role: 'teacher';
}

type SchoolView = 'dashboard' | 'teachers' | 'classes' | 'students' | 'fees';

const getInitials = (name = '') => name.split(' ').map((n) => n[0]).join('');

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const staggerContainer = (staggerChildren: number, delayChildren: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerChildren,
      delayChildren: delayChildren,
    },
  },
});

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function SchoolDetailsPage() {
    const { user, isUserLoading }