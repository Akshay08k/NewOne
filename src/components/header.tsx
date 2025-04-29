
"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Package2 } from 'lucide-react'; // Using Package2 for logo placeholder


export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
       <SidebarTrigger className="sm:hidden" /> {/* Only show trigger on small screens */}
      <div className="flex items-center gap-2">
         <Package2 className="h-6 w-6 text-primary" />
         <h1 className="text-xl font-semibold text-foreground">TaskFlow</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
