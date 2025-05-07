"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config"; // Adjust path as needed
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AuthContextProps {
  user: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null); // Explicitly set user to null
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally handle error state or display message
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Handle specific errors like popup closed by user, etc.
      if ((error as any).code === "auth/popup-closed-by-user") {
        // Optionally show a toast message
        toast({
          title: "Sign-in Failed",
          description: "Google Sign-in popup closed by user.",
          variant: "destructive",
        });
      } else {
        // Handle other errors
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = { user, loading, logout, loginWithGoogle };

  // Render loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
