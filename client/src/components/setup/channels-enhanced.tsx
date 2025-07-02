import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, MessageCircle, Phone, Mail, Bot, Copy, Check, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const channelSchema = z.object({
  websiteName: z.string().min(1, "Website name is required"),
  websiteUrl: z.string().url("Please enter a valid URL"),
  primaryColor: z.string().optional(),
  isActive: z.boolean().default(true),
});

const facebookSchema = z.object({
  pageId: z.string().min(1, "Facebook Page ID is required"),
  accessToken: z.string().min(1, "Facebook Access Token is required"),
});

type ChannelFormData = z.infer<typeof channelSchema>;
type FacebookFormData = z.infer<typeof facebookSchema>;

interface Channel {
  id: number;
  websiteName: string;
  websiteUrl: string;
  primaryColor: string;
  embedCode: string;
  isActive: boolean;
}

function FacebookMessengerIntegration() {
  console.log('FacebookMessengerIntegration component rendered');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: facebookConnection } = useQuery({
    queryKey: ["/api/facebook-connection"],
  });

  const form = useForm<FacebookFormData>({
    resolver: zodResolver(facebookSchema),
    defaultValues: {
      pageId: facebookConnection?.facebookPageId || "",
      accessToken: facebookConnection?.accessToken || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FacebookFormData) => {
      return await apiRequest("POST", "/api/facebook/connect-real", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facebook Messenger connected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Facebook Messenger",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/facebook/disconnect");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facebook Messenger disconnected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
      form.reset({ pageId: "", accessToken: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Facebook Messenger",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FacebookFormData) => {
    console.log('Form submitted!');
    console.log('Submitting Facebook data:', { pageId: data.pageId ? 'PROVIDED' : 'MISSING', accessToken: data.accessToken ? 'PROVIDED' : 'MISSING' });
    console.log('Full data:', data);
    mutation.mutate(data);
  };

  const webhookUrl = `${window.location.origin}/api/facebook/webhook`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          Facebook Messenger
          {facebookConnection?.isConnected && (
            <Badge className="ml-auto bg-green-100 text-green-800">Connected</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Facebook Page to automatically respond to messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!facebookConnection?.isConnected ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageId">Facebook Page ID</Label>
              <Input
                id="pageId"
                placeholder="Enter your Facebook Page ID"
                {...form.register("pageId")}
              />
              {form.formState.errors.pageId && (
                <p className="text-sm text-red-500">{form.formState.errors.pageId.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accessToken">Page Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Page Access Token"
                {...form.register("accessToken")}
              />
              {form.formState.errors.accessToken && (
                <p className="text-sm text-red-500">{form.formState.errors.accessToken.message}</p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Webhook Setup</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Add this webhook URL to your Facebook App:
              </p>
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                <code className="flex-1 text-xs">{webhookUrl}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Verify Token: <code>minechat_webhook_verify_token</code>
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={mutation.isPending}
              onClick={() => console.log('Button clicked!')}
            >
              {mutation.isPending ? "Connecting..." : "Connect Facebook Messenger"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Connected Successfully
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Facebook Page: <strong>{facebookConnection.facebookPageName}</strong>
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your AI assistant will now respond to messages on your Facebook page automatically.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={() => disconnectMutation.mutate()} 
              disabled={disconnectMutation.isPending}
              className="w-full"
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Facebook Messenger"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChannelsEnhanced() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channel } = useQuery({
    queryKey: ["/api/channels"],
  });

  const form = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      websiteName: channel?.websiteName || "",
      websiteUrl: channel?.websiteUrl || "",
      primaryColor: channel?.primaryColor || "#A53860",
      isActive: channel?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      return apiRequest("POST", "/api/channels", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Success",
        description: "Channel configuration saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save channel configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChannelFormData) => {
    mutation.mutate(data);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    toast({
      title: "Copied!",
      description: `${type} code copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const channels = [
    {
      id: 'website',
      name: 'Website Widget',
      description: 'Embed a chat widget directly on your website',
      icon: Globe,
      color: 'bg-blue-500',
      isAvailable: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Connect your WhatsApp Business account',
      icon: MessageCircle,
      color: 'bg-green-500',
      isAvailable: true,
    },
    {
      id: 'messenger',
      name: 'Facebook Messenger',
      description: 'Integrate with Facebook Messenger',
      icon: MessageCircle,
      color: 'bg-blue-600',
      isAvailable: true,
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Create a Telegram bot for your business',
      icon: Bot,
      color: 'bg-sky-500',
      isAvailable: true,
    },
    {
      id: 'sms',
      name: 'SMS Integration',
      description: 'Handle customer inquiries via SMS',
      icon: Phone,
      color: 'bg-purple-500',
      isAvailable: true,
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Process email inquiries automatically',
      icon: Mail,
      color: 'bg-red-500',
      isAvailable: true,
    },
  ];

  const generateEmbedCode = (websiteName: string, websiteUrl: string, primaryColor: string) => {
    return `<!-- Minechat AI Widget -->
<script>
(function() {
  var chatWidget = document.createElement('div');
  chatWidget.id = 'minechat-widget';
  chatWidget.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000;';
  
  var chatButton = document.createElement('button');
  chatButton.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background-color: ${primaryColor}; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease;';
  chatButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.35L2 22l5.65-1.05C9.96 21.64 11.46 22 13 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>';
  
  var chatFrame = document.createElement('iframe');
  chatFrame.style.cssText = 'width: 350px; height: 500px; border: none; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); display: none; margin-bottom: 10px;';
  chatFrame.src = '${websiteUrl}/chat-widget?domain=' + encodeURIComponent(window.location.hostname);
  
  chatButton.onclick = function() {
    chatFrame.style.display = chatFrame.style.display === 'none' ? 'block' : 'none';
  };
  
  chatWidget.appendChild(chatFrame);
  chatWidget.appendChild(chatButton);
  document.body.appendChild(chatWidget);
})();
</script>
<!-- End Minechat AI Widget -->`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Communication Channels</h2>
        <p className="text-gray-600 dark:text-gray-400">Connect your AI assistant to multiple communication platforms to reach customers wherever they are.</p>
      </div>

      <Tabs defaultValue="website" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="website">Website Widget</TabsTrigger>
          <TabsTrigger value="messaging">Messaging Apps</TabsTrigger>
          <TabsTrigger value="other">Other Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Website Chat Widget
              </CardTitle>
              <CardDescription>
                Add a chat widget to your website to let visitors interact with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="websiteName">Website Name</Label>
                    <Input
                      id="websiteName"
                      {...form.register("websiteName")}
                      placeholder="My Business Website"
                    />
                    {form.formState.errors.websiteName && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.websiteName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      {...form.register("websiteUrl")}
                      placeholder="https://mybusiness.com"
                    />
                    {form.formState.errors.websiteUrl && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.websiteUrl.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Widget Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      {...form.register("primaryColor")}
                      className="h-12"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={form.watch("isActive")}
                      onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    />
                    <Label htmlFor="isActive">Enable Widget</Label>
                  </div>
                </div>

                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </form>

              {channel && (
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Embed Code</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Copy and paste this code into your website's HTML, just before the closing &lt;/body&gt; tag:
                    </p>
                    <div className="relative">
                      <Textarea
                        value={generateEmbedCode(channel.websiteName, channel.websiteUrl, channel.primaryColor)}
                        readOnly
                        className="font-mono text-sm h-32"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generateEmbedCode(channel.websiteName, channel.websiteUrl, channel.primaryColor), "Embed")}
                      >
                        {copiedCode === "Embed" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Widget Ready</span>
                    </div>
                    <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                      Your chat widget is configured and ready to be deployed on your website.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-6">
          <FacebookMessengerIntegration />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.filter(ch => ['whatsapp', 'telegram'].includes(ch.id)).map((channel) => (
              <Card key={channel.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${channel.color} rounded-lg flex items-center justify-center`}>
                      <channel.icon className="w-5 h-5 text-white" />
                    </div>
                    {channel.name}
                    <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                  </CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Connect {channel.name}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Integration with {channel.name} will be available in the next update.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="other" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.filter(ch => ['sms', 'email'].includes(ch.id)).map((channel) => (
              <Card key={channel.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${channel.color} rounded-lg flex items-center justify-center`}>
                      <channel.icon className="w-5 h-5 text-white" />
                    </div>
                    {channel.name}
                    <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                  </CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Connect {channel.name}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Integration with {channel.name} will be available in the next update.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
          <CardDescription>Follow these steps to get your AI assistant connected across all channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Configure your website widget</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up your website details and customize the widget appearance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Copy the embed code</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get the JavaScript code and add it to your website</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Test your setup</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visit your website and test the chat widget functionality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <h4 className="font-medium text-gray-500">Connect additional channels</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">More messaging platforms coming soon</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}