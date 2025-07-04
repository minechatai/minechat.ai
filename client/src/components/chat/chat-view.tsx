import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, MoreVertical, Paperclip, Image, Mic, Send } from "lucide-react";
import { Message, Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ChatViewProps {
  conversationId: number | null;
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const [message, setMessage] = useState("");
  const [isAiMode, setIsAiMode] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversation, isLoading: conversationLoading } = useQuery<Conversation>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Sync toggle state with conversation mode from database
  useEffect(() => {
    if (conversation) {
      setIsAiMode(conversation.mode === 'ai' || !conversation.mode);
    }
  }, [conversation]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${conversationId}`],
    enabled: !!conversationId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const isLoading = conversationLoading || messagesLoading;

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { conversationId: number; content: string; senderType: string }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateModeMutation = useMutation({
    mutationFn: async (data: { conversationId: number; mode: string }) => {
      const response = await fetch(`/api/conversations/${data.conversationId}/mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: data.mode }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update conversation mode');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch conversation data
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update mode. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;
    
    // Send message from human agent (when in Human Mode)
    sendMessageMutation.mutate({
      conversationId,
      content: message.trim(),
      senderType: 'human'
    });
    
    setMessage("");
  };

  const handleModeToggle = (mode: 'ai' | 'human') => {
    if (!conversationId) return;
    
    setIsAiMode(mode === 'ai');
    updateModeMutation.mutate({
      conversationId,
      mode
    });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 bg-gray-50">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={conversation?.customerProfilePicture || undefined} 
                alt={conversation?.customerName || 'Customer'}
              />
              <AvatarFallback className="bg-primary text-white">
                {conversation?.customerName?.charAt(0).toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{conversation?.customerName || 'Customer'}</h3>
              <p className="text-sm text-blue-600 cursor-pointer hover:underline">View profile</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                className={`${isAiMode ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700'}`}
                onClick={() => handleModeToggle('ai')}
                disabled={updateModeMutation.isPending}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Button 
                className={`${!isAiMode ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700'}`}
                onClick={() => handleModeToggle('human')}
                disabled={updateModeMutation.isPending}
              >
                <User className="w-4 h-4 mr-2" />
                Human
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="max-w-none mx-auto space-y-4 pr-4">
          <div className="text-center">
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">Today</span>
          </div>
          
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg: Message) => (
              <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-start' : 'justify-end'}`}>
                {msg.senderType === 'user' ? (
                  <div className="flex space-x-3 max-w-md lg:max-w-lg">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage 
                        src={conversation?.customerProfilePicture || undefined} 
                        alt={conversation?.customerName || 'Customer'}
                      />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {conversation?.customerName?.charAt(0).toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-900">{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md lg:max-w-lg">
                    <div className={`p-4 rounded-lg shadow-sm ${
                      msg.senderType === 'human' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-primary text-white'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          {msg.senderType === 'human' ? (
                            <User className="w-3 h-3 text-blue-600" />
                          ) : (
                            <Bot className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-white/80">
                          {msg.senderType === 'human' ? 'Human Agent' : 'AI Assistant'}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdAt)}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Input - Smaller */}
      <div className="bg-white border-t border-gray-200 p-3 mt-auto">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={isAiMode ? "AI mode is enabled - switch to Human mode to send messages" : "Send a message"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-20 h-9"
              disabled={isAiMode}
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <Button type="button" variant="ghost" size="sm" className="p-0 w-4 h-4" disabled={isAiMode}>
                <Paperclip className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="bg-primary hover:bg-primary-dark h-9"
            disabled={isAiMode || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-3 h-3" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
