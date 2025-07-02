import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Globe, MessageCircle, Instagram, Send, MessageSquare, Slack, Hash, MoreHorizontal } from "lucide-react";
import { FaFacebookMessenger, FaTelegram, FaWhatsapp, FaViber, FaDiscord } from "react-icons/fa";

const channelSchema = z.object({
  websiteName: z.string().optional(),
  websiteUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  isActive: z.boolean().optional(),
});

const facebookSchema = z.object({
  pageId: z.string().optional(),
  facebookAccessToken: z.string().optional(),
});

type ChannelFormData = z.infer<typeof channelSchema>;
type FacebookFormData = z.infer<typeof facebookSchema>;

const channelIcons = [
  { name: "Website", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { name: "Messenger", icon: FaFacebookMessenger, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
  { name: "Telegram", icon: FaTelegram, color: "text-sky-500", bgColor: "bg-sky-50", borderColor: "border-sky-200" },
  { name: "WhatsApp", icon: FaWhatsapp, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  { name: "Slack", icon: Slack, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  { name: "Viber", icon: FaViber, color: "text-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  { name: "Discord", icon: FaDiscord, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
];



export default function Channels() {
  const [selectedChannel, setSelectedChannel] = useState("Website");
  const { toast } = useToast();

  const { data: channel, isLoading } = useQuery({
    queryKey: ["/api/channels"],
  });

  const { data: facebookConnection } = useQuery({
    queryKey: ["/api/facebook-connection"],
  });

  const channelForm = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      websiteName: "",
      websiteUrl: "",
      primaryColor: "#A53860",
      isActive: true,
    },
  });

  const facebookForm = useForm<FacebookFormData>({
    resolver: zodResolver(facebookSchema),
    defaultValues: {
      pageId: "",
      facebookAccessToken: "",
    },
  });

  useEffect(() => {
    if (channel && typeof channel === 'object' && 'websiteName' in channel) {
      channelForm.reset({
        websiteName: (channel as any).websiteName || "",
        websiteUrl: (channel as any).websiteUrl || "",
        primaryColor: (channel as any).primaryColor || "#A53860",
        isActive: (channel as any).isActive ?? true,
      });
    }
  }, [channel, channelForm]);

  useEffect(() => {
    if (facebookConnection && typeof facebookConnection === 'object' && 'facebookPageId' in facebookConnection) {
      facebookForm.reset({
        pageId: (facebookConnection as any).facebookPageId || "",
        facebookAccessToken: (facebookConnection as any).accessToken || "",
      });
    }
  }, [facebookConnection, facebookForm]);

  const channelMutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      console.log('Saving channel data:', data);
      await apiRequest("POST", "/api/channels", data);
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

  const facebookMutation = useMutation({
    mutationFn: async (data: FacebookFormData) => {
      console.log('Saving Facebook connection:', data);
      
      if (data.pageId && data.facebookAccessToken) {
        await apiRequest("POST", "/api/facebook/connect-real", {
          pageId: data.pageId,
          accessToken: data.facebookAccessToken,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
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

  const onChannelSubmit = (data: ChannelFormData) => {
    channelMutation.mutate(data);
  };

  const onFacebookSubmit = (data: FacebookFormData) => {
    facebookMutation.mutate(data);
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

        {/* Channel Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {channelIcons.map((channel) => {
            const IconComponent = channel.icon;
            const isSelected = selectedChannel === channel.name;
            return (
              <button
                key={channel.name}
                type="button"
                onClick={() => setSelectedChannel(channel.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  isSelected 
                    ? `${channel.bgColor} ${channel.borderColor} border` 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? channel.color : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                  {channel.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Website Settings */}
        {selectedChannel === "Website" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Website Integration</h3>
            <form onSubmit={channelForm.handleSubmit(onChannelSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Website Name</label>
                <Input 
                  placeholder="Enter your website name"
                  className="mt-1"
                  {...channelForm.register("websiteName")}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900">Website URL</label>
                <Input 
                  placeholder="https://example.com"
                  className="mt-1"
                  {...channelForm.register("websiteUrl")}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900">Primary Color</label>
                <Input 
                  type="color"
                  className="mt-1"
                  {...channelForm.register("primaryColor")}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit" disabled={channelMutation.isPending}>
                  {channelMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Facebook Messenger Settings */}
        {selectedChannel === "Messenger" && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Facebook Messenger Integration</h3>
            <form onSubmit={facebookForm.handleSubmit(onFacebookSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Facebook Page ID</label>
                <Input 
                  placeholder="Enter your Facebook Page ID"
                  className="mt-1"
                  {...facebookForm.register("pageId")}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900">Facebook Access Token</label>
                <Textarea 
                  placeholder="Enter your Facebook Page Access Token"
                  className="mt-1 h-20 font-mono text-sm resize-none"
                  rows={3}
                  {...facebookForm.register("facebookAccessToken")}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit" disabled={facebookMutation.isPending}>
                  {facebookMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Other channels placeholder */}
        {!["Website", "Messenger"].includes(selectedChannel) && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedChannel}</h3>
            <p className="text-gray-600">Integration coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
