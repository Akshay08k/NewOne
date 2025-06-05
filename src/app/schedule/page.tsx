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
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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

export default function SchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setTasks([]);
      return;
    }

    setIsLoading(true);
    const tasksColRef = collection(db, "tasks");
    const q = query(
      tasksColRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            deadline: data.deadline ? data.deadline.toDate() : undefined,
            reminder: data.reminder ? data.reminder.toDate() : undefined,
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

    return () => unsubscribe();
  }, [user, toast]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calendar helper functions
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) => task.deadline && isSameDay(task.deadline, date)
    );
  };

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

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { completed: !completed });
      toast({
        title: "Success",
        description: `Task ${
          !completed ? "completed" : "marked as incomplete"
        }.`,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Could not update task.",
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <SidebarProvider>
      <Sidebar className="hidden lg:block">
        <SidebarContent />
      </Sidebar>
      <SidebarInset className="w-full">
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4 sm:mb-6">
                Schedule
              </h1>

              <Card className="w-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">
                        {format(currentDate, "MMMM yyyy")}
                      </CardTitle>
                      <CardDescription>
                        Full calendar view with your tasks - click any task to
                        view details
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="text-xs px-3"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth("next")}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-2 sm:p-6">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Week day headers */}
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground border-b"
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.slice(0, 1)}</span>
                      </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                      const dayTasks = getTasksForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isTodayDate = isToday(day);

                      return (
                        <div
                          key={index}
                          className={`min-h-[70px] sm:min-h-[80px] p-1 sm:p-2 border border-border/50 ${
                            !isCurrentMonth
                              ? "bg-muted/30 text-muted-foreground"
                              : "bg-card hover:bg-accent/50"
                          } ${
                            isTodayDate
                              ? "ring-2 ring-primary/50 bg-primary/5"
                              : ""
                          } transition-colors`}
                        >
                          <div className="flex flex-col h-full">
                            <div
                              className={`text-xs sm:text-sm font-medium mb-1 ${
                                isTodayDate ? "text-primary" : ""
                              }`}
                            >
                              {format(day, "d")}
                            </div>

                            <div className="flex-1 space-y-1">
                              {dayTasks.slice(0, 3).map((task) => (
                                <div
                                  key={task.id}
                                  onClick={(e) => handleTaskClick(task, e)}
                                  className={`text-[10px] sm:text-xs p-1 rounded truncate cursor-pointer transition-all hover:scale-105 hover:shadow-sm ${
                                    task.completed
                                      ? "bg-muted/50 text-muted-foreground line-through hover:bg-muted/70"
                                      : task.priority === "high"
                                      ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                                      : task.priority === "medium"
                                      ? "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                                  title={`Click to view details: ${task.title}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {task.priority === "high" && (
                                      <div className="w-1 h-1 bg-destructive rounded-full flex-shrink-0" />
                                    )}
                                    <span className="truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {dayTasks.length > 3 && (
                                <div
                                  className="text-[10px] text-muted-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => {
                                    // You could show a modal with all tasks for this day
                                    setSelectedTask(dayTasks[3]); // Show first hidden task for now
                                    setIsTaskDialogOpen(true);
                                  }}
                                >
                                  +{dayTasks.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Task List - Show on small screens */}
              <div className="mt-6 lg:hidden">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                    <CardDescription>
                      All tasks with deadlines this month - tap to view details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tasks.filter(
                      (task) =>
                        task.deadline && isSameMonth(task.deadline, currentDate)
                    ).length > 0 ? (
                      <div className="space-y-3">
                        {tasks
                          .filter(
                            (task) =>
                              task.deadline &&
                              isSameMonth(task.deadline, currentDate)
                          )
                          .sort(
                            (a, b) =>
                              a.deadline!.getTime() - b.deadline!.getTime()
                          )
                          .map((task) => (
                            <div
                              key={task.id}
                              onClick={(e) => handleTaskClick(task, e)}
                              className={`flex items-start justify-between p-3 rounded-md border cursor-pointer transition-all hover:shadow-md ${
                                task.completed
                                  ? "bg-muted/50 hover:bg-muted/70"
                                  : "bg-card hover:bg-accent/50"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-medium ${
                                    task.completed
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }`}
                                >
                                  {task.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Due: {format(task.deadline!, "MMM d, yyyy")}
                                </div>
                              </div>
                              <Badge
                                variant={getPriorityBadgeVariant(task.priority)}
                                className="ml-2 flex-shrink-0"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tasks scheduled for this month.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>

        {/* Task Details Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            {selectedTask && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl flex items-center gap-2">
                        {getPriorityIcon(selectedTask.priority)}
                        <span
                          className={
                            selectedTask.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {selectedTask.title}
                        </span>
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={getPriorityBadgeVariant(
                            selectedTask.priority
                          )}
                        >
                          {selectedTask.priority} priority
                        </Badge>
                        <Badge
                          variant={
                            selectedTask.completed ? "default" : "secondary"
                          }
                        >
                          {selectedTask.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Description */}
                  {selectedTask.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Description
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Deadline */}
                  {selectedTask.deadline && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Deadline
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="text-sm bg-muted/50 p-2 rounded-md">
                          {format(selectedTask.deadline, "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          at {format(selectedTask.deadline, "h:mm a")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reminder */}
                  {selectedTask.reminder && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Reminder
                      </h4>
                      <div className="text-sm bg-muted/50 p-2 rounded-md">
                        {format(
                          selectedTask.reminder,
                          "EEEE, MMMM d, yyyy at h:mm a"
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() =>
                        handleToggleComplete(
                          selectedTask.id,
                          selectedTask.completed
                        )
                      }
                      variant={selectedTask.completed ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                    >
                      {selectedTask.completed ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Mark Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsTaskDialogOpen(false)}
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
