"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, Loader2 } from "lucide-react"; // Added Loader2
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context"; // Import useAuth
import { db } from "@/lib/firebase/config"; // Import db instance
import { collection, addDoc, Timestamp } from "firebase/firestore"; // Import Firestore functions

// Updated schema to match Firestore structure (optional deadline/reminder)
const formSchema = z.object({
  title: z.string().min(1, { message: "Task title is required" }),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  deadline: z.date().optional(), // Keep as date for picker, convert before saving
});

type TaskFormValues = z.infer<typeof formSchema>;

// Define the structure for Firestore document (excluding id)
interface TaskData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline?: Timestamp; // Use Timestamp for Firestore
  completed: boolean;
  reminder?: Timestamp; // Reminder not in form, added for consistency
  userId: string; // Added userId
  createdAt: Timestamp; // Added createdAt
}

export function CreateTask() {
  const { user } = useAuth(); // Get user from auth context
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Loading state

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      deadline: undefined,
    },
  });

  async function onSubmit(data: TaskFormValues) {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to create tasks.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Prepare data for Firestore
    const taskData: TaskData = {
      ...data,
      deadline: data.deadline ? Timestamp.fromDate(data.deadline) : undefined, // Convert Date to Timestamp
      completed: false, // Default completed status
      userId: user.uid, // Associate task with the logged-in user
      createdAt: Timestamp.now(), // Set creation timestamp
    };

    // Remove undefined fields before saving to Firestore
    Object.keys(taskData).forEach((key) => {
      if (taskData[key as keyof TaskData] === undefined) {
        delete taskData[key as keyof TaskData];
      }
    });

    try {
      const tasksColRef = collection(db, "tasks");
      await addDoc(tasksColRef, taskData); // Add document to 'tasks' collection

      toast({
        title: "Task Created",
        description: `Task "${data.title}" has been added.`,
      });
      form.reset(); // Reset form fields
      setIsOpen(false); // Close the popover
    } catch (error) {
      console.error("Error adding task: ", error);
      toast({
        title: "Error",
        description: "Could not create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" disabled={!user || isSubmitting}>
          {" "}
          {/* Disable if not logged in */}
          <Plus className="mr-2 h-4 w-4" /> Add New Task
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {user ? ( // Only show form if user is logged in
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter task title"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={isSubmitting}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Task
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            Please log in to create tasks.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
