
"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Home, ListTodo, CalendarDays, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function SidebarContent() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(true); // Simulate loading state

  React.useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader>
        {/* Optional: Add Logo or App Name here if needed */}
      </SidebarHeader>

      <SidebarMainContent className="p-2 flex-1">
        <SidebarMenu>
          {isLoading ? (
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
            {isLoading ? (
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
         {isLoading ? (
           <div className="flex items-center gap-2 p-2">
             <SidebarMenuSkeleton showIcon={false} className="h-10 w-10 rounded-full"/>
             <SidebarMenuSkeleton showIcon={false} className="h-6 flex-1" />
           </div>
         ) : (
            <div className="flex items-center justify-between p-2">
                 <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/id/237/40/40" alt="User Avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">User Name</span>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4"/>
                    <span className="sr-only">Log Out</span>
                </Button>
            </div>
        )}
      </SidebarFooter>
    </>
  );
}

