
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
import { Edit, Trash2, Calendar as CalendarIcon, Bell } from "lucide-react";
import { format } from "date-fns";
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


interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Date;
  completed: boolean;
  reminder?: Date;
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design Landing Page",
    description: "Create mockups for the new landing page",
    priority: "high",
    deadline: new Date(2024, 7, 15),
    completed: false,
  },
  {
    id: "2",
    title: "Develop API Endpoints",
    description: "Implement user authentication endpoints",
    priority: "medium",
    deadline: new Date(2024, 7, 20),
    completed: false,
  },
  {
    id: "3",
    title: "Write Documentation",
    description: "Document the API usage",
    priority: "low",
    completed: true,
  },
  {
    id: '4',
    title: 'Deploy to Staging',
    priority: 'medium',
    deadline: new Date(2024, 7, 25),
    completed: false,
    reminder: new Date(2024, 7, 24, 9, 0)
  },
];

export function TaskList() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const { toast } = useToast();
  const [reminderDate, setReminderDate] = React.useState<Date>();
  const [reminderTime, setReminderTime] = React.useState<string>("09:00");


  const handleToggleComplete = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    const task = tasks.find(t => t.id === taskId);
    toast({
      title: `Task ${task && !task.completed ? 'Completed' : 'Marked Incomplete'}`,
      description: `Task "${task?.title}" status updated.`,
    });
  };

  const handleDeleteTask = (taskId: string) => {
     const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
     toast({
      title: "Task Deleted",
      description: `Task "${taskToDelete?.title}" has been removed.`,
      variant: "destructive",
    });
  };

   const handleSetReminder = (taskId: string) => {
    if (!reminderDate) {
      toast({ title: "Please select a reminder date.", variant: "destructive" });
      return;
    }

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const reminderDateTime = new Date(reminderDate);
    reminderDateTime.setHours(hours, minutes, 0, 0);


    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, reminder: reminderDateTime } : task
      )
    );

    const task = tasks.find(t => t.id === taskId);
    toast({
      title: "Reminder Set",
      description: `Reminder set for task "${task?.title}" on ${format(reminderDateTime, "PPP p")}.`,
    });

    // Basic notification simulation
    const now = new Date();
    const timeUntilReminder = reminderDateTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
       console.log(`Scheduling notification for task "${task?.title}" at ${reminderDateTime}`);
       // In a real app, you'd use browser notifications API or a service worker
       setTimeout(() => {
         alert(`Reminder: Task "${task?.title}" is due soon!`);
          // Or use new Notification(...) if permission granted
       }, timeUntilReminder);
    } else {
       console.warn(`Reminder time for task "${task?.title}" is in the past.`);
    }

    // Reset date/time picker state if needed, and close popover
    // Assuming the popover closes automatically on action, otherwise manage its state
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

  const getPriorityTextColor = (priority: "low" | "medium" | "high"): string => {
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
  }

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
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Deadline</TableHead>
           <TableHead>Reminder</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} data-state={task.completed ? "completed" : ""}>
            <TableCell>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggleComplete(task.id)}
                aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
              />
            </TableCell>
            <TableCell className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </TableCell>
             <TableCell className={`hidden md:table-cell ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.description || '-'}
            </TableCell>
            <TableCell>
              <Badge variant={getPriorityBadgeVariant(task.priority)} className={`${getPriorityTextColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className={task.completed ? 'line-through text-muted-foreground' : ''}>
              {task.deadline ? format(task.deadline, "PPP") : "No deadline"}
            </TableCell>
             <TableCell className={task.completed ? 'line-through text-muted-foreground' : ''}>
                {task.reminder ? format(task.reminder, "Pp") : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Set Reminder" disabled={task.completed}>
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
                          <Button size="sm" onClick={() => handleSetReminder(task.id)} className="w-full">Set</Button>
                      </PopoverContent>
                    </Popover>
                )}
              </TableCell>
            <TableCell className="text-right space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" aria-label="Edit Task" disabled={task.completed}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Task</p>
                </TooltipContent>
              </Tooltip>

              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Delete Task">
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
                      This action cannot be undone. This will permanently delete the task "{task.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TooltipProvider>
    </CardContent>
    </Card>
  );
}

// Added Card components for better structure
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
