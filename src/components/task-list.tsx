"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Bell,
  Loader2,
} from "lucide-react"; // Added Loader2
import { format, toDate } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { db } from "@/lib/firebase/config"; // Import db instance
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

// Define Task interface matching Firestore structure
interface Task {
  id: string; // Document ID from Firestore
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Timestamp; // Use Firestore Timestamp
  completed: boolean;
  reminder?: Timestamp; // Use Firestore Timestamp
  userId: string; // To associate tasks with users
  createdAt: Timestamp; // Track creation time
}

export function TaskList() {
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // Loading state for tasks
  const { toast } = useToast();
  const [reminderDate, setReminderDate] = React.useState<Date>();
  const [reminderTime, setReminderTime] = React.useState<string>("09:00");

  // Fetch tasks from Firestore
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
        const fetchedTasks = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Task)
        ); // Map Firestore data to Task interface
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

  // --- Handlers for Task Actions (Update Firestore) ---

  const handleToggleComplete = async (taskId: string) => {
    const taskRef = doc(db, "tasks", taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;

    try {
      await updateDoc(taskRef, { completed: newCompletedStatus });
      toast({
        title: `Task ${newCompletedStatus ? "Completed" : "Marked Incomplete"}`,
        description: `Task "${task.title}" status updated.`,
      });
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({
        title: "Error",
        description: "Could not update task status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    const taskRef = doc(db, "tasks", taskId);
    try {
      await deleteDoc(taskRef);
      toast({
        title: "Task Deleted",
        description: `Task "${taskToDelete.title}" has been removed.`,
        variant: "destructive", // Keep variant destructive for deletion confirmation
      });
    } catch (error) {
      console.error("Error deleting task: ", error);
      toast({
        title: "Error",
        description: "Could not delete task.",
        variant: "destructive",
      });
    }
  };

  const handleSetReminder = async (taskId: string) => {
    const taskRef = doc(db, "tasks", taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!reminderDate) {
      toast({
        title: "Please select a reminder date.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = reminderTime.split(":").map(Number);
    const reminderDateTime = new Date(reminderDate);
    reminderDateTime.setHours(hours, minutes, 0, 0);
    const reminderTimestamp = Timestamp.fromDate(reminderDateTime); // Convert to Firestore Timestamp

    try {
      await updateDoc(taskRef, { reminder: reminderTimestamp });
      toast({
        title: "Reminder Set",
        description: `Reminder set for task "${task.title}" on ${format(
          reminderDateTime,
          "PPP p"
        )}.`,
      });
      // Reset picker state - you might need to manage Popover open state manually
      setReminderDate(undefined);
      setReminderTime("09:00");
      // Basic notification simulation (keep or remove based on preference)
      const now = new Date();
      const timeUntilReminder = reminderDateTime.getTime() - now.getTime();
      if (timeUntilReminder > 0) {
        setTimeout(() => {
          alert(`Reminder: Task "${task?.title}" is due soon!`);
        }, timeUntilReminder);
      } else {
        console.warn(`Reminder time for task "${task?.title}" is in the past.`);
      }
    } catch (error) {
      console.error("Error setting reminder: ", error);
      toast({
        title: "Error",
        description: "Could not set reminder.",
        variant: "destructive",
      });
    }
  };

  // --- Utility Functions ---

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

  const getPriorityTextColor = (
    priority: "low" | "medium" | "high"
  ): string => {
    switch (priority) {
      case "low":
        return "text-green-600 dark:text-green-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "high":
        return "text-red-600 dark:text-red-400";
      default:
        return "";
    }
  };

  // Convert Firestore Timestamp to Date object safely
  const formatTimestamp = (
    timestamp: Timestamp | undefined,
    formatString: string
  ): string => {
    if (!timestamp) return "N/A"; // Or "No Date", etc.
    try {
      const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting timestamp: ", error);
      return "Invalid Date";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>Manage your upcoming tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No tasks found. Add a new task to get started!
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    data-state={task.completed ? "completed" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task.id)}
                        aria-label={
                          task.completed
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={`font-medium ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </TableCell>
                    <TableCell
                      className={`hidden md:table-cell ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getPriorityBadgeVariant(task.priority)}
                        className={`${getPriorityTextColor(task.priority)}`}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {/* Use formatTimestamp helper */}
                      {task.deadline
                        ? formatTimestamp(task.deadline, "PPP")
                        : "No deadline"}
                    </TableCell>
                    <TableCell
                      className={
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {/* Use formatTimestamp helper */}
                      {task.reminder ? (
                        formatTimestamp(task.reminder, "Pp")
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Set Reminder"
                              disabled={task.completed}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4 space-y-2">
                            <p className="text-sm font-medium">Set Reminder</p>
                            <Calendar
                              mode="single"
                              selected={reminderDate}
                              onSelect={setReminderDate}
                              initialFocus
                            />
                            <Input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSetReminder(task.id)}
                              className="w-full"
                            >
                              Set
                            </Button>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* TODO: Implement Edit Functionality */}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit Task"
                            disabled={
                              task.completed || true /* Disable edit for now */
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Task (Coming Soon)</p>
                        </TooltipContent>
                      </Tooltip>

                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete Task"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Task</p>
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the task "{task.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
