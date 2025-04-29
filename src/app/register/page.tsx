
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterFormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { loginWithGoogle, user, loading: authLoading } = useAuth(); // Use auth context
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

 // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // Update user profile with first and last name
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created.',
      });
      router.push('/'); // Redirect to dashboard after successful registration
    } catch (error: any) {
      console.error('Registration failed:', error);
       let errorMessage = 'Registration failed. Please try again.';
       if (error.code === 'auth/email-already-in-use') {
         errorMessage = 'This email address is already in use.';
       } else if (error.code === 'auth/weak-password') {
         errorMessage = 'Password is too weak. Please choose a stronger password.';
       }
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
       setIsLoading(false);
    }
  }

   const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const loggedInUser = await loginWithGoogle();
       if (loggedInUser) {
         // Check if it's a new user signup via Google or existing user login
         // Firebase handles this automatically, user object will contain the info.
         // We might want to add custom logic here if needed (e.g., saving user data to Firestore on first Google signup).
        toast({
          title: 'Login Successful',
          description: `Welcome, ${loggedInUser.displayName || loggedInUser.email}!`,
        });
        router.push('/');
      } else {
        // Handle popup closed case if needed
      }
    } catch (error) {
       console.error("Google login initiation failed:", error);
        toast({
          title: 'Google Login Failed',
          description: 'Could not initiate Google Sign-in. Please try again.',
          variant: 'destructive',
        });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }

   if (user) {
       return (
        <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
           <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.4 109.8 11.8 244 11.8c72.4 0 135.6 30.8 180.5 79.5L377.4 144.6C340.2 112.3 295.4 93.4 244 93.4c-91.1 0-167.2 69.6-179.5 160.8H12.4c12.3-100.8 101.4-179.4 211.6-179.4 53.9 0 102.7 20.8 138.6 56.4l45.2-45.2C386.6 30.8 322.8 0 252.4 0 114.8 0 0 114.8 0 252.4c0 72.4 30.8 135.6 79.5 180.5l69.1-53.4c-12.3 10.5-26.7 19.1-42.5 26.7-19.1 9.3-40.6 15.6-63.6 15.6z"></path></svg>
            )}
            Sign up with Google
          </Button>
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2">
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Robinson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2" disabled={isLoading || isGoogleLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create an account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
