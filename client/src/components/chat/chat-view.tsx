import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, MoreVertical, Paperclip, Image, Mic, Send } from "lucide-react";
import { Message } from "@shared/schema";

interface ChatViewProps {
  conversationId: number | null;
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const [message, setMessage] = useState("");
  const [isAiMode, setIsAiMode] = useState(true);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // TODO: Implement message sending
    console.log("Sending message:", message);
    setMessage("");
  };

  const formatTime = (date: Date | string) => {
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
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-white">
                GS
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">Grace Spencer</h3>
              <p className="text-sm text-blue-600 cursor-pointer hover:underline">View profile</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                className={`${isAiMode ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700'}`}
                onClick={() => setIsAiMode(true)}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Button 
                className={`${!isAiMode ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700'}`}
                onClick={() => setIsAiMode(false)}
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
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
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
              <div key={msg.id} className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
                {msg.senderType === 'customer' ? (
                  <div className="flex space-x-3 max-w-xs lg:max-w-md">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-white text-xs">GS</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-900">{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-primary text-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium">{msg.content}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdAt)}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Send a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-32"
            />
            <div className="absolute right-3 top-3 flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm" className="p-0 w-5 h-5">
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="p-0 w-5 h-5">
                <Image className="w-4 h-4 text-gray-400" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="p-0 w-5 h-5">
                <Mic className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary-dark">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
