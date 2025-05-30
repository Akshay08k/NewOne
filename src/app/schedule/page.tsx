"use client";

import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { SidebarContent } from "@/components/sidebar-content";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp, // Import Timestamp
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Import db instance
import { toast, useToast } from "@/hooks/use-toast";
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Date;
  completed: boolean;
  reminder?: Date;
  notified?: boolean; 
}

// Mock tasks data - replace with actual data fetching

export default function SchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // const [tasks, setTasks] = React.useState<Task[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );
  const [tasks, setTasks] = React.useState<Task[]>([]); // Use fetched tasks

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false); // Stop loading if no user
      setTasks([]); // Clear tasks if no user
      return;
    }

    setIsLoading(true);
    const tasksColRef = collection(db, "tasks");
    const q = query(
      tasksColRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    ); // Filter by userId and order

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            deadline: data.deadline ? data.deadline.toDate() : undefined, // <-- Convert
            reminder: data.reminder ? data.reminder.toDate() : undefined, // Optional
          } as Task;
        });
        setTasks(fetchedTasks);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching tasks: ", error);
        toast({
          title: "Error",
          description: "Could not fetch tasks.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, toast]); // Depend on user

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tasksForSelectedDate = tasks.filter(
    (task) =>
      task.deadline && selectedDate && isSameDay(task.deadline, selectedDate)
  );

  const getPriorityBadgeVariant = (
    priority: "low" | "medium" | "high"
  ): "secondary" | "default" | "destructive" => {
    switch (priority) {
      case "low":
        return "secondary";
      case "medium":
        return "default";
      case "high":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-foreground mb-6">
              Schedule
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calendar View */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    Select a date to view tasks due.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border p-0" // Adjusted styling
                    modifiers={{
                      // Highlight days with deadlines
                      deadline: tasks
                        .filter((task) => task.deadline)
                        .map((task) => task.deadline!),
                    }}
                    modifiersStyles={{
                      deadline: {
                        border: "2px solid hsl(var(--primary))",
                        borderRadius: "50%",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              {/* Tasks for Selected Date */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Tasks for{" "}
                    {selectedDate
                      ? format(selectedDate, "PPP")
                      : "Selected Date"}
                  </CardTitle>
                  <CardDescription>
                    Tasks due on the selected date.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksForSelectedDate.length > 0 ? (
                    <ul className="space-y-3">
                      {tasksForSelectedDate.map((task) => (
                        <li
                          key={task.id}
                          className={`flex items-center justify-between p-3 rounded-md border ${
                            task.completed ? "bg-muted/50" : "bg-card"
                          }`}
                        >
                          <span
                            className={`text-sm ${
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <Badge
                            variant={getPriorityBadgeVariant(task.priority)}
                          >
                            {task.priority}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tasks due on this date.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
