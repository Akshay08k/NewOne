
"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent as SidebarMainContent, // Renamed to avoid naming conflict
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, ListTodo, CalendarDays, Settings, LogOut, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context"; // Import useAuth hook
import { useToast } from "@/hooks/use-toast";

export function SidebarContent() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth(); // Get user, loading state and logout function
  const router = useRouter();
  const { toast } = useToast();

  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-4 w-4" />;
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };


  return (
    <>
      <SidebarHeader>
        {/* Optional: Add Logo or App Name here if needed */}
      </SidebarHeader>

      <SidebarMainContent className="p-2 flex-1">
        <SidebarMenu>
          {(loading || !user) ? ( // Show skeleton if loading or no user
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
            </>
          ) : (
            <>
              <SidebarMenuItem>
                <Link href="/" passHref>
                  <SidebarMenuButton isActive={isActive("/")} tooltip="Dashboard">
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/tasks" passHref>
                  <SidebarMenuButton isActive={isActive("/tasks")} tooltip="All Tasks">
                    <ListTodo />
                    <span>All Tasks</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/schedule" passHref>
                  <SidebarMenuButton isActive={isActive("/schedule")} tooltip="Schedule">
                    <CalendarDays />
                    <span>Schedule</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {(loading || !user) ? ( // Show skeleton if loading or no user
              <SidebarMenuSkeleton showIcon />
            ) : (
              <SidebarMenuItem>
                <Link href="/settings" passHref>
                  <SidebarMenuButton isActive={isActive("/settings")} tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarMainContent>

      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
        {(loading || isLoggingOut) ? ( // Show skeleton or spinner during loading/logout
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            {isLoggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        ) : user ? ( // Show user info and logout if logged in
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate" title={user.displayName || user.email || 'User'}>
                 {user.displayName || user.email}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log Out</span>
            </Button>
          </div>
        ) : ( // Show login link if not logged in
          <div className="p-2">
            <Link href="/login" passHref>
               <Button variant="outline" className="w-full">Login / Register</Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </>
  );
}
