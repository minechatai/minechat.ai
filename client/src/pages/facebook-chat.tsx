import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActiveProfile } from "@/hooks/useActiveProfile";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, MessageCircle, Facebook, Clock, ChevronDown, Globe, Mail, MessageSquare } from "lucide-react";
import chatbotIcon from "@assets/AI Chat Assistant_1751897744917.png";
import aiModeImage from "@assets/AI_1751717516599.png";
import humanModeImage from "@assets/Human_1751717521808.png";
import { FacebookIcon } from "@/components/icons/FacebookIcon";

type InboxSource = 'all' | 'facebook' | 'whatsapp' | 'email' | 'website';

interface InboxSourceOption {
  value: InboxSource;
  label: string;
  icon: React.ReactNode;
}

const inboxSources: InboxSourceOption[] = [
  { value: 'all', label: 'All Sources', icon: <Globe className="w-4 h-4" /> },
  { value: 'facebook', label: 'Facebook Messenger', icon: <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-black"></div> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'website', label: 'Website Chat', icon: <MessageCircle className="w-4 h-4" /> },
];

interface FacebookConversation {
  id: number;
  customerName: string;
  customerProfilePicture: string | null;
  facebookSenderId: string;
  lastMessageAt: string;
  source: string;
  status: string;
  mode: string;
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
  const [selectedSource, setSelectedSource] = useState<InboxSource>('all');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { activeProfile } = useActiveProfile();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleViewProfile = (facebookSenderId: string) => {
    if (facebookSenderId) {
      // Note: Facebook PSIDs (Page-Scoped IDs) cannot be used to access user profiles directly
      // This is a privacy feature - businesses cannot access customer profiles via page interactions
      // We'll try the search approach as a fallback
      const customerName = selectedConversation?.customerName;
      window.open(`https://www.facebook.com/search/people/?q=${customerName || facebookSenderId}`, '_blank');
    }
  };

  const updateModeMutation = useMutation({
    mutationFn: ({ conversationId, mode }: { conversationId: number; mode: string }) => 
      apiRequest(`/api/conversations/${conversationId}/mode`, {
        method: 'PUT',
        body: { mode }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Mode updated successfully",
        description: "Conversation mode has been updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating mode:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation mode. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleModeToggle = (conversationId: number, mode: string) => {
    updateModeMutation.mutate({ conversationId, mode });
  };

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter conversations based on selected source and search query
  const filteredConversations = conversations.filter((conv: any) => {
    // Filter by source - for now, only Facebook conversations exist
    const matchesSource = selectedSource === 'all' || selectedSource === 'facebook';
    
    // Filter by search query
    const matchesSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSource && matchesSearch && conv.source === "facebook";
  });

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
          <div className="px-4 py-3 border-b border-gray-200 h-[73px] flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <defs>
                  <linearGradient id="messenger-header-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00c6ff" />
                    <stop offset="25%" stopColor="#0072ff" />
                    <stop offset="50%" stopColor="#7928ca" />
                    <stop offset="75%" stopColor="#ff0080" />
                    <stop offset="100%" stopColor="#ff6b6b" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="12" fill="url(#messenger-header-gradient)" />
                <path d="M12 3C7.037 3 3 7.037 3 12c0 4.5 3.3 8.2 7.6 8.9v-6.3H8.5V12h2.1V9.8c0-2.1 1.2-3.2 3.1-3.2.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 2.6h-1.8v6.3C17.7 20.2 21 16.5 21 12c0-4.963-4.037-9-9-9z" fill="white"/>
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
            </div>
            
            {/* Facebook Messenger Connected Status */}
            <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <defs>
                  <linearGradient id="messenger-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00c6ff" />
                    <stop offset="25%" stopColor="#0072ff" />
                    <stop offset="50%" stopColor="#7928ca" />
                    <stop offset="75%" stopColor="#ff0080" />
                    <stop offset="100%" stopColor="#ff6b6b" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="12" fill="url(#messenger-gradient)" />
                <path d="M12 3C7.037 3 3 7.037 3 12c0 4.5 3.3 8.2 7.6 8.9v-6.3H8.5V12h2.1V9.8c0-2.1 1.2-3.2 3.1-3.2.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 2.6h-1.8v6.3C17.7 20.2 21 16.5 21 12c0-4.963-4.037-9-9-9z" fill="white"/>
              </svg>
              <span className="font-medium text-blue-800">Facebook Messenger Connected</span>
            </div>

            {/* Hidden Inbox Source Switcher */}
            <div className="mb-4 relative hidden" ref={dropdownRef}>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  {inboxSources.find(source => source.value === selectedSource)?.icon}
                  <span className="font-medium text-gray-900">
                    {inboxSources.find(source => source.value === selectedSource)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSourceDropdown ? 'transform rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showSourceDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {inboxSources.map((source) => (
                    <button
                      key={source.value}
                      onClick={() => {
                        setSelectedSource(source.value);
                        setShowSourceDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        selectedSource === source.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      {source.icon}
                      <span className="font-medium">{source.label}</span>
                      {source.value === 'facebook' && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Connected
                        </span>
                      )}
                      {source.value !== 'facebook' && source.value !== 'all' && (
                        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">f</span>
              </div>
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
              <div className="bg-white border-b border-gray-200 px-4 py-3 h-[73px] flex items-center">
                <div className="flex items-center justify-between w-full">
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
                      <p 
                        className="text-sm text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleViewProfile(selectedConversation.facebookSenderId)}
                      >
                        View profile
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 mr-2">
                        <defs>
                          <linearGradient id="messenger-chat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00c6ff" />
                            <stop offset="25%" stopColor="#0072ff" />
                            <stop offset="50%" stopColor="#7928ca" />
                            <stop offset="75%" stopColor="#ff0080" />
                            <stop offset="100%" stopColor="#ff6b6b" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="12" fill="url(#messenger-chat-gradient)" />
                        <path d="M12 3C7.037 3 3 7.037 3 12c0 4.5 3.3 8.2 7.6 8.9v-6.3H8.5V12h2.1V9.8c0-2.1 1.2-3.2 3.1-3.2.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 2.6h-1.8v6.3C17.7 20.2 21 16.5 21 12c0-4.963-4.037-9-9-9z" fill="white"/>
                      </svg>
                      <button 
                        onClick={() => handleModeToggle(selectedConversation.id, selectedConversation.mode === 'ai' ? 'human' : 'ai')}
                        className="transition-opacity hover:opacity-80"
                      >
                        <img 
                          src={selectedConversation.mode === 'ai' ? aiModeImage : humanModeImage}
                          alt={selectedConversation.mode === 'ai' ? "AI Mode Enabled" : "Human Mode"}
                          className="w-20 h-10 object-contain"
                        />
                      </button>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {selectedConversation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sticky Mode Indicator */}
              <div className="bg-gray-50 border-t border-gray-200 py-2 px-4">
                <div className="text-center">
                  <span className="text-sm px-3 py-1 rounded-full shadow-sm border-2" style={{color: '#b33054', borderColor: '#b33054'}}>
                    {selectedConversation.mode === 'ai' ? 'AI Enabled' : 'Human Mode'}
                  </span>
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
                            <div className="px-4 py-3 rounded-lg bg-[#E1E1EB] text-gray-900">
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs mt-1 text-gray-500">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Scroll anchor for auto-scroll */}
                    <div ref={messagesEndRef} />
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