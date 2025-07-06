import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, Plus, MessageSquare } from "lucide-react";
import { ConversationWithLastMessage } from "@shared/schema";
import facebookMessengerIcon from "@assets/Facebook_Messenger_logo_2020.svg_1751719200234.webp";

interface ConversationListProps {
  selectedConversation: number | null;
  onSelectConversation: (conversationId: number) => void;
}

export default function ConversationList({ selectedConversation, onSelectConversation }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const { toast } = useToast();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { data: facebookConnection, isLoading: facebookLoading } = useQuery({
    queryKey: ["/api/facebook-connection"],
  }) as { data: { isConnected?: boolean } | undefined, isLoading: boolean };

  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/facebook/connect");
      return await response.json() as { authUrl?: string };
    },
    onSuccess: (data) => {
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Success",
          description: "Facebook Messenger connected successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/facebook-connection"] });
      }
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
        description: "Failed to connect Facebook Messenger",
        variant: "destructive",
      });
    },
  });

  const handleFacebookConnect = () => {
    connectFacebookMutation.mutate();
  };

  const filteredConversations = conversations.filter((conversation: ConversationWithLastMessage) => {
    if (searchQuery) {
      return conversation.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conversation.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="w-full md:w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </div>
          
          {/* Facebook Messenger Integration */}
          <button
            onClick={handleFacebookConnect}
            disabled={connectFacebookMutation.isPending}
            className={`p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors ${
              facebookConnection?.isConnected ? 'bg-blue-50' : ''
            }`}
            title={facebookConnection?.isConnected ? "Facebook Messenger Connected" : "Connect Facebook Messenger"}
          >
            <img
              src={facebookMessengerIcon}
              alt="Facebook Messenger"
              className="w-6 h-6 object-contain"
            />
            {connectFacebookMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['Inbox', 'Unread', 'Follow-ups', 'Archived'].map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            size="sm"
            className={`flex-1 rounded-none border-b-2 ${
              activeTab === tab.toLowerCase() 
                ? 'border-primary text-gray-900' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a conversation to see it here</p>
          </div>
        ) : (
          filteredConversations.map((conversation: ConversationWithLastMessage) => (
            <div
              key={conversation.id}
              className={`flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                selectedConversation === conversation.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage 
                  src={conversation.customerProfilePicture || undefined} 
                  alt={conversation.customerName || 'Customer'}
                />
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(conversation.customerName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {conversation.customerName || 'Unknown Customer'}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageAt || conversation.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {(conversation as any).lastMessage || 'No messages yet'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
