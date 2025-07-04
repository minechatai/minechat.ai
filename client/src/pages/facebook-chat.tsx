import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, MessageCircle, User, Bot, Facebook, Clock } from "lucide-react";

interface FacebookConversation {
  id: number;
  customerName: string;
  customerProfilePicture: string | null;
  facebookSenderId: string;
  lastMessageAt: string;
  source: string;
  status: string;
  messageCount?: number;
  lastMessage?: string;
}

interface FacebookMessage {
  id: number;
  content: string;
  senderType: string;
  senderId: string;
  createdAt: string;
  messageType: string;
}

export default function FacebookChat() {
  const [selectedConversation, setSelectedConversation] = useState<FacebookConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: conversations = [], isLoading: conversationsLoading, error } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedConversation?.id],
    enabled: !!selectedConversation,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Filter for Facebook conversations only
  const facebookConversations = conversations.filter((conv: any) => conv.source === "facebook");

  // Filter conversations based on search query
  const filteredConversations = facebookConversations.filter((conv: any) =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading || conversationsLoading) {
    return (
      <MainLayout title="Facebook Chat">
        <div className="flex h-full">
          <div className="w-80 bg-white border-r border-gray-200 animate-pulse">
            <div className="p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 animate-pulse">
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Facebook Chat">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Facebook className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Facebook Chat</h2>
            </div>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No Facebook conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Conversations will appear here when customers message your Facebook page
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation: FacebookConversation) => (
                  <Card 
                    key={conversation.id} 
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation?.id === conversation.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={conversation.customerProfilePicture || undefined} 
                              alt={conversation.customerName}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.customerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <Facebook className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.customerName}
                            </h3>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage || "No messages yet"}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              Facebook
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={selectedConversation.customerProfilePicture || undefined} 
                          alt={selectedConversation.customerName}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {selectedConversation.customerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <Facebook className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConversation.customerName}</h3>
                      <p className="text-sm text-gray-500">Facebook Messenger</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: FacebookMessage) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.senderType === 'user' ? (
                          <div
                            className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-600 text-white"
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs mt-1 text-blue-200">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        ) : (
                          <div className="max-w-xs lg:max-w-md">
                            <div className={`px-4 py-3 rounded-lg ${
                              message.senderType === 'human' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-[#E1E1EB] text-gray-900'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                  {message.senderType === 'human' ? (
                                    <User className="w-3 h-3 text-blue-600" />
                                  ) : (
                                    <Bot className="w-3 h-3 text-gray-600" />
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${
                                  message.senderType === 'human' 
                                    ? 'text-white/80' 
                                    : 'text-gray-600'
                                }`}>
                                  {message.senderType === 'human' ? 'Human Agent' : 'AI Assistant'}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs mt-1 text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input - Read Only for now */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="AI responses are handled automatically"
                    disabled
                    className="flex-1 bg-gray-50"
                  />
                  <Button disabled variant="outline">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Messages from Facebook Messenger are automatically responded to by your AI assistant
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a Facebook conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}