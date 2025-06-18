import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Globe, MessageCircle, Instagram, Send, MessageSquare, Slack, Hash, MoreHorizontal } from "lucide-react";
import { FaFacebookMessenger, FaTelegram, FaWhatsapp, FaViber, FaDiscord } from "react-icons/fa";

const channelSchema = z.object({
  websiteName: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().default("#A53860"),
});

type ChannelFormData = z.infer<typeof channelSchema>;

const channelIcons = [
  { name: "Website", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-100" },
  { name: "Messenger", icon: FaFacebookMessenger, color: "text-blue-600", bgColor: "bg-blue-100" },
  { name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-100" },
  { name: "Telegram", icon: FaTelegram, color: "text-blue-500", bgColor: "bg-blue-100" },
  { name: "WhatsApp", icon: FaWhatsapp, color: "text-green-600", bgColor: "bg-green-100" },
  { name: "Slack", icon: Slack, color: "text-purple-600", bgColor: "bg-purple-100" },
  { name: "Viber", icon: FaViber, color: "text-purple-500", bgColor: "bg-purple-100" },
  { name: "Discord", icon: FaDiscord, color: "text-indigo-600", bgColor: "bg-indigo-100" },
];

const colorOptions = [
  "#DC2626", // red-600
  "#EAB308", // yellow-500
  "#7C3AED", // violet-600
  "#EF4444", // red-500
  "#3B82F6", // blue-500
  "#10B981", // green-500
  "#A53860", // primary
];

export default function Channels() {
  const [selectedColor, setSelectedColor] = useState("#A53860");
  const { toast } = useToast();

  const { data: channel, isLoading } = useQuery({
    queryKey: ["/api/channels"],
  });

  const form = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      websiteName: "",
      websiteUrl: "",
      primaryColor: "#A53860",
    },
  });

  useEffect(() => {
    if (channel) {
      form.reset({
        websiteName: channel.websiteName || "",
        websiteUrl: channel.websiteUrl || "",
        primaryColor: channel.primaryColor || "#A53860",
      });
      setSelectedColor(channel.primaryColor || "#A53860");
    }
  }, [channel, form]);

  const mutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      await apiRequest("POST", "/api/channels", { ...data, primaryColor: selectedColor });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Success",
        description: "Channel settings saved successfully",
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
        description: "Failed to save channel settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChannelFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-8">
        <div className="flex items-center space-x-2 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Channels</h2>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline">(watch tutorial video)</span>
        </div>

        {/* Channel Icons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {channelIcons.map((channel, index) => {
            const IconComponent = channel.icon;
            return (
              <div 
                key={channel.name}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  index === 0 ? 'bg-gray-100' : 'border border-gray-200'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${channel.color}`} />
                <span className="text-sm font-medium">{channel.name}</span>
              </div>
            );
          })}
        </div>

        {/* Website Configuration */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="websiteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Blissful Retreat"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://blissfulretreat.framer.website/"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">Color Theme</FormLabel>
              <div className="flex space-x-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded cursor-pointer ${
                      selectedColor === color ? 'ring-2 ring-gray-800 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div>
              <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">Embed Code</FormLabel>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-700">
                <code>
                  {channel?.embedCode || 
                    `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">`
                  }
                </code>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary text-white hover:bg-primary-dark"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
