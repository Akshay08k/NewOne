
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

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
            <h1 className="text-3xl font-semibold text-foreground mb-6">All Tasks</h1>
            <CreateTask />
            {/* Display all tasks here. TaskList component can be reused or a new one created */}
            <TaskList />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
