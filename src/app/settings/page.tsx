
'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { SidebarContent } from '@/components/sidebar-content';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState(''); // Needed for email/password changes
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isUpdatingAuth, setIsUpdatingAuth] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user, loading, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);

    try {
      await updateProfile(user, { displayName });
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been updated.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your display name.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

   const handleReauthenticate = async (): Promise<boolean> => {
    if (!user || !user.email || !currentPassword) {
        toast({ title: "Error", description: "Current password is required to update email or password.", variant: "destructive"});
        return false;
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("Reauthentication failed:", error);
      toast({ title: "Reauthentication Failed", description: "Incorrect current password.", variant: "destructive"});
      return false;
    }
  };

  const handleAuthUpdate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
     setIsUpdatingAuth(true);

     const reauthenticated = await handleReauthenticate();
     if (!reauthenticated) {
         setIsUpdatingAuth(false);
         return;
     }

    try {
        // Update Email if changed
        if (email !== user.email) {
            await updateEmail(user, email);
             toast({
                title: 'Email Updated',
                description: 'Your email address has been updated.',
             });
             // Reset email state just in case
             setEmail(user.email || '');
        }

        // Update Password if provided
        if (newPassword) {
            await updatePassword(user, newPassword);
            toast({
                title: 'Password Updated',
                description: 'Your password has been updated.',
            });
            setNewPassword(''); // Clear password field
        }
         setCurrentPassword(''); // Clear current password field after successful updates


    } catch (error: any) {
        console.error('Failed to update authentication details:', error);
         let errorDesc = 'Could not update your authentication details.';
         if (error.code === 'auth/requires-recent-login') {
             errorDesc = 'This operation requires recent login. Please log out and log back in.';
         } else if (error.code === 'auth/email-already-in-use') {
            errorDesc = 'This email address is already in use by another account.';
         } else if (error.code === 'auth/weak-password') {
             errorDesc = 'The new password is too weak.';
         }
        toast({
            title: 'Update Failed',
            description: errorDesc,
            variant: 'destructive',
        });
    } finally {
        setIsUpdatingAuth(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-foreground mb-6">Settings</h1>

             <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your display name.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isUpdatingProfile}
                        />
                    </div>
                    <Button type="submit" disabled={isUpdatingProfile || displayName === user.displayName}>
                         {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Profile
                    </Button>
                    </form>
                </CardContent>
                </Card>

                 {/* Authentication Settings */}
                <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Update your email or password. Requires current password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuthUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                         disabled={isUpdatingAuth}
                         required // Make required for email/password change
                        />
                    </div>
                     <hr/>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                         disabled={isUpdatingAuth}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password (optional)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isUpdatingAuth}
                        />
                         <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>
                    </div>
                    <Button type="submit" disabled={isUpdatingAuth || (!newPassword && email === user.email)}>
                         {isUpdatingAuth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Authentication
                    </Button>
                    </form>
                </CardContent>
                </Card>


                {/* Appearance Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                       <Label htmlFor="theme">Theme</Label>
                       <ThemeToggle />
                     </div>
                     {/* Add other appearance settings here if needed */}
                  </CardContent>
                </Card>

             </div>

          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
