
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { TaskList } from '@/components/task-list';
import { CreateTask } from '@/components/create-task';
import { SidebarContent } from '@/components/sidebar-content';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-foreground mb-6">Task Board</h1>
            <CreateTask />
            <TaskList />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
