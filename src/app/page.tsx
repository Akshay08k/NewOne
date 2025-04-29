
'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { TaskList } from '@/components/task-list';
import { CreateTask } from '@/components/create-task';
import { SidebarContent } from '@/components/sidebar-content';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to login if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Show loading indicator or handle redirection
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  // If logged in, show the dashboard content
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-foreground mb-6">Dashboard</h1>
             <Card>
              <CardHeader>
                <CardTitle>Welcome, {user.displayName || user.email}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is your TaskFlow dashboard. You can manage your tasks using the sidebar.</p>
              </CardContent>
            </Card>
            <CreateTask />
            <TaskList />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
