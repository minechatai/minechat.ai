import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
      toast({
        title: "Success",
        description: "Facebook connection saved successfully",
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
        description: "Failed to save Facebook connection",
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Channel Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {channelIcons.map((channelIcon) => {
          const IconComponent = channelIcon.icon;
          const isSelected = selectedChannel === channelIcon.name;
          return (
            <Card
              key={channelIcon.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-[#A53860] border-[#A53860]' : ''
              }`}
              onClick={() => setSelectedChannel(channelIcon.name)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className={`p-3 rounded-full ${channelIcon.bgColor} ${channelIcon.borderColor} border-2 mb-2`}>
                  <IconComponent className={`h-6 w-6 ${channelIcon.color}`} />
                </div>
                <span className="text-sm font-medium">{channelIcon.name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Website Settings */}
      {selectedChannel === "Website" && (
        <Card>
          <CardHeader>
            <CardTitle>Website Settings</CardTitle>
            <CardDescription>Configure your website integration settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={channelForm.handleSubmit(onChannelSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="websiteName">Website Name</Label>
                <Input
                  id="websiteName"
                  {...channelForm.register("websiteName")}
                  placeholder="Enter your website name"
                />
              </div>
              
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  {...channelForm.register("websiteUrl")}
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  {...channelForm.register("primaryColor")}
                />
              </div>
              
              <Button type="submit" disabled={channelMutation.isPending}>
                {channelMutation.isPending ? "Saving..." : "Save Website Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Facebook Messenger Settings */}
      {selectedChannel === "Messenger" && (
        <Card>
          <CardHeader>
            <CardTitle>Facebook Messenger</CardTitle>
            <CardDescription>Connect your Facebook Page to receive messages</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={facebookForm.handleSubmit(onFacebookSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="pageId">Facebook Page ID</Label>
                <Input
                  id="pageId"
                  {...facebookForm.register("pageId")}
                  placeholder="Enter your Facebook Page ID"
                />
              </div>
              
              <div>
                <Label htmlFor="facebookAccessToken">Facebook Access Token</Label>
                <Textarea
                  id="facebookAccessToken"
                  {...facebookForm.register("facebookAccessToken")}
                  placeholder="Enter your Facebook Page Access Token"
                  rows={3}
                />
              </div>
              
              <Button type="submit" disabled={facebookMutation.isPending}>
                {facebookMutation.isPending ? "Saving..." : "Save Facebook Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Other channels placeholder */}
      {!["Website", "Messenger"].includes(selectedChannel) && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedChannel}</CardTitle>
            <CardDescription>Integration coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {selectedChannel} integration will be available in a future update.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}