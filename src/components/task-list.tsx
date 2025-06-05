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
  MoreVertical,
  Clock,
  AlertCircle,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase/config";
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

// Define Task interface matching Firestore structure
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Timestamp;
  completed: boolean;
  reminder?: Timestamp;
  userId: string;
  createdAt: Timestamp;
  notified?: boolean;
}

interface TaskUpdateData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Date | Timestamp | null;
  reminder?: Date | Timestamp | null;
  notified?: boolean;
}

function toDateOrNull(dateOrTimestamp?: Date | Timestamp | null): Date | null {
  if (!dateOrTimestamp) return null;
  if (dateOrTimestamp instanceof Timestamp) {
    return dateOrTimestamp.toDate();
  }
  return dateOrTimestamp;
}

export function TaskList() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [reminderDate, setReminderDate] = React.useState<Date>();
  const [reminderTime, setReminderTime] = React.useState<string>("09:00");
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);
  const [editForm, setEditForm] = React.useState({
    title: "",
    description: "",
    priority: "low" as "low" | "medium" | "high",
  });

  // Fetch tasks from Firestore
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
        const fetchedTasks = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Task)
        );
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

  async function handleUpdateTask(
    taskId: string,
    data: TaskUpdateData,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ) {
    try {
      const taskDocRef = doc(db, "tasks", taskId);

      const updateData: any = {
        title: data.title,
        description: data.description ?? "",
        priority: data.priority,
        notified: data.notified ?? false,
        deadline: toDateOrNull(data.deadline)
          ? Timestamp.fromDate(toDateOrNull(data.deadline)!)
          : null,
        reminder: toDateOrNull(data.reminder)
          ? Timestamp.fromDate(toDateOrNull(data.reminder)!)
          : null,
      };

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(taskDocRef, updateData);

      toast({
        title: "Task Updated",
        description: `Task "${data.title}" updated successfully!`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Update Failed",
        description: "Could not update task. Please try again.",
        variant: "destructive",
      });
      if (onError) onError(error);
    }
  }

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
        variant: "destructive",
      });
      setTaskToDelete(null);
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
    const reminderTimestamp = Timestamp.fromDate(reminderDateTime);

    try {
      await updateDoc(taskRef, { reminder: reminderTimestamp });
      toast({
        title: "Reminder Set",
        description: `Reminder set for task "${task.title}" on ${format(
          reminderDateTime,
          "PPP p"
        )}.`,
      });
      setReminderDate(undefined);
      setReminderTime("09:00");
    } catch (error) {
      console.error("Error setting reminder: ", error);
      toast({
        title: "Error",
        description: "Could not set reminder.",
        variant: "destructive",
      });
    }
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (
    timestamp: Timestamp | undefined,
    formatString: string
  ): string => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate();
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting timestamp: ", error);
      return "Invalid Date";
    }
  };

  // Mobile Card Component
  const MobileTaskCard = ({ task }: { task: Task }) => (
    <Card className={`mb-3 ${task.completed ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggleComplete(task.id)}
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-medium text-sm truncate ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </h3>
                <Badge
                  variant={getPriorityBadgeVariant(task.priority)}
                  className="h-5 text-xs flex-shrink-0"
                >
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(task.priority)}
                    {task.priority}
                  </div>
                </Badge>
              </div>

              {task.description && (
                <p
                  className={`text-xs text-muted-foreground mb-2 line-clamp-2 ${
                    task.completed ? "line-through" : ""
                  }`}
                >
                  {task.description}
                </p>
              )}

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {task.deadline && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      Due: {formatTimestamp(task.deadline, "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {task.reminder && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    <span>
                      Reminder:{" "}
                      {formatTimestamp(task.reminder, "MMM d, h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingTask(task);
                  setEditForm({
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority,
                  });
                }}
                disabled={task.completed}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {!task.reminder && (
                <DropdownMenuItem disabled={task.completed}>
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTaskToDelete(task)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your upcoming tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <TooltipProvider>
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
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
                              onCheckedChange={() =>
                                handleToggleComplete(task.id)
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
                            className={
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {task.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getPriorityBadgeVariant(task.priority)}
                            >
                              <div className="flex items-center gap-1">
                                {getPriorityIcon(task.priority)}
                                {task.priority.charAt(0).toUpperCase() +
                                  task.priority.slice(1)}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
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
                            {task.reminder ? (
                              formatTimestamp(task.reminder, "Pp")
                            ) : (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={task.completed}
                                  >
                                    <Bell className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4 space-y-2">
                                  <p className="text-sm font-medium">
                                    Set Reminder
                                  </p>
                                  <Calendar
                                    mode="single"
                                    selected={reminderDate}
                                    onSelect={setReminderDate}
                                    initialFocus
                                  />
                                  <Input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) =>
                                      setReminderTime(e.target.value)
                                    }
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setEditForm({
                                      title: task.title,
                                      description: task.description || "",
                                      priority: task.priority,
                                    });
                                  }}
                                  disabled={task.completed}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Task</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setTaskToDelete(task)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Task</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tasks found. Add a new task to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <MobileTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Task description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    priority: e.target.value as "low" | "medium" | "high",
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTask) {
                  handleUpdateTask(editingTask.id, editForm, () =>
                    setEditingTask(null)
                  );
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={() => setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task "{taskToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

