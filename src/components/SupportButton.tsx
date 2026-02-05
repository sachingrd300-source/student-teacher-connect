'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SupportDialog } from './SupportDialog';
import { MessageSquare } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface UserProfile {
  name?: string;
  role?: string;
}

export function SupportButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Help & Support"
      >
        <div className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
            <MessageSquare className="h-8 w-8" />
        </div>
      </button>
      <SupportDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userProfile={userProfile}
      />
    </>
  );
}
