import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResizableTextarea } from "@/components/ui/resizable-textarea";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const aiAssistantSchema = z.object({
  name: z.string().min(1, "AI Assistant name is required"),
  introMessage: z.string().optional(),
  description: z.string().optional(),
  guidelines: z.string().optional(),
  responseLength: z.enum(["short", "normal", "long"]).default("normal"),
});

type AiAssistantFormData = z.infer<typeof aiAssistantSchema>;

export default function AiAssistant() {
  const [responseLength, setResponseLength] = useState<"short" | "normal" | "long">("short");
  const { toast } = useToast();

  const { data: aiAssistant, isLoading } = useQuery({
    queryKey: ["/api/ai-assistant"],
  });

  const form = useForm<AiAssistantFormData>({
    resolver: zodResolver(aiAssistantSchema),
    defaultValues: {
      name: "",
      introMessage: "",
      description: "",
      guidelines: "",
      responseLength: "normal",
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (aiAssistant) {
      form.reset({
        name: (aiAssistant as any).name || "",
        introMessage: (aiAssistant as any).introMessage || "",
        description: (aiAssistant as any).description || "",
        guidelines: (aiAssistant as any).guidelines || "",
        responseLength: (aiAssistant as any).responseLength || "normal",
      });
      setResponseLength((aiAssistant as any).responseLength || "normal");
    }
  }, [aiAssistant, form]);

  const mutation = useMutation({
    mutationFn: async (data: AiAssistantFormData) => {
      await apiRequest("POST", "/api/ai-assistant", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant"] });
      toast({
        title: "Success",
        description: "AI Assistant settings saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save AI Assistant settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AiAssistantFormData) => {
    mutation.mutate({ ...data, responseLength });
  };

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/ai-assistant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-assistant"] });
      form.reset({
        name: "",
        introMessage: "",
        description: "",
        guidelines: "",
        responseLength: "normal",
      });
      setResponseLength("normal");
      toast({
        title: "Success",
        description: "AI Assistant settings reset successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reset AI Assistant settings",
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    resetMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Persona</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Assistant Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter AI assistant name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="introMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intro Message</FormLabel>
                <FormControl>
                  <RichTextarea 
                    placeholder="Enter Intro Message" 
                    rows={4}
                    value={field.value}
                    onChange={field.onChange}
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
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <RichTextarea 
                    placeholder="Enter Description" 
                    rows={4}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guidelines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Guidelines</FormLabel>
                <FormControl>
                  <RichTextarea 
                    placeholder="Enter AI guidelines..." 
                    rows={6}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">Response Length</FormLabel>
            <div className="flex space-x-3">
              <Button
                type="button"
                className={responseLength === "short" ? "bg-primary text-white" : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"}
                onClick={() => setResponseLength("short")}
              >
                Short
              </Button>
              <Button
                type="button"
                className={responseLength === "normal" ? "bg-primary text-white" : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"}
                onClick={() => setResponseLength("normal")}
              >
                Normal
              </Button>
              <Button
                type="button"
                className={responseLength === "long" ? "bg-primary text-white" : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"}
                onClick={() => setResponseLength("long")}
              >
                Long
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? "Resetting..." : "Reset"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset AI Assistant</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all AI Assistant settings and cannot be undone. Do you still wish to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-primary-dark"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
