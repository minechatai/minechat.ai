import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Globe, MessageCircle, Instagram, Send, MessageSquare, Slack, Hash, MoreHorizontal, ExternalLink, Check, X, Facebook, Loader2 } from "lucide-react";
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
          <FacebookMessengerIntegration />
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

// Facebook Messenger Integration Component
function FacebookMessengerIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Check connection status
  const { data: facebookConnection, isLoading } = useQuery({
    queryKey: ["/api/facebook-connection"],
  });

  // Get available pages after OAuth
  const { data: facebookPages } = useQuery({
    queryKey: ["/api/facebook/pages"],
    enabled: showPageSelector,
  });

  // Start OAuth flow
  const startOAuthMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      const response = await apiRequest("/api/facebook/oauth/start");
      return response;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      setIsConnecting(false);
      console.error("Facebook OAuth Error:", error);
      
      toast({
        title: "Connection Error",
        description: "Unable to connect to Facebook. Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  // Connect to specific page
  const connectPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await apiRequest("/api/facebook/connect-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
      setShowPageSelector(false);
      toast({
        title: "Success",
        description: "Facebook page connected successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Facebook page",
        variant: "destructive",
      });
    },
  });

  // Disconnect Facebook
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/facebook/disconnect", {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
      toast({
        title: "Success",
        description: "Facebook page disconnected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Facebook page",
        variant: "destructive",
      });
    },
  });

  // Handle URL parameters for page selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("step") === "select_page") {
      setShowPageSelector(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Show page selector if OAuth completed
  if (showPageSelector && facebookPages?.pages?.length > 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FaFacebookMessenger className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Select Facebook Page</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Choose which Facebook page you want to connect to your AI assistant:
        </p>

        <div className="space-y-3 mb-6">
          {facebookPages.pages.map((page: any) => (
            <div
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPageId === page.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={page.picture?.data?.url || "/default-page-avatar.png"}
                  alt={page.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{page.name}</h4>
                  <p className="text-sm text-gray-500">Page ID: {page.id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPageSelector(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => connectPageMutation.mutate(selectedPageId)}
            disabled={!selectedPageId || connectPageMutation.isPending}
          >
            {connectPageMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Page"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show connected status
  if (facebookConnection?.isConnected) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Facebook Messenger Connected</h3>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={facebookConnection.facebookPagePictureUrl || "/default-page-avatar.png"}
              alt={facebookConnection.facebookPageName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-medium text-gray-900">{facebookConnection.facebookPageName}</h4>
              <p className="text-sm text-gray-500">Page ID: {facebookConnection.facebookPageId}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">
              Your AI assistant is now responding to messages on Facebook Messenger
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show connect button
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <FaFacebookMessenger className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Facebook Messenger Integration</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Connect your Facebook page in just one click. Your AI assistant will automatically respond to Facebook Messenger inquiries using your business knowledge.
      </p>

      <div className="bg-white rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">What happens next:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click "Connect Facebook Page" below</li>
          <li>• Allow Minechat AI to manage your Facebook page</li>
          <li>• Select which business page to connect</li>
          <li>• Start receiving automatic AI responses immediately</li>
        </ul>
      </div>



      <div className="flex justify-end">
        <Button
          onClick={() => startOAuthMutation.mutate()}
          disabled={startOAuthMutation.isPending || isConnecting}
        >
          {startOAuthMutation.isPending || isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Facebook Page
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
