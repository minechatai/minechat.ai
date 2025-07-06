import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import ConversationList from "@/components/chat/conversation-list";
import ChatView from "@/components/chat/chat-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Conversation } from "@shared/schema";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-select most recent conversation
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      // Sort by lastMessageAt and select the most recent
      const sortedConversations = [...conversations].sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setSelectedConversation(sortedConversations[0].id);
    }
  }, [conversations, selectedConversation]);

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col h-full">
          {/* Title Bar Loading */}
          <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Chat Interface Loading */}
          <div className="flex flex-col md:flex-row flex-1">
            <div className="w-full md:w-72 lg:w-80 xl:w-96 bg-white border-r border-gray-200 animate-pulse">
              <div className="p-4 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 animate-pulse">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Title Bar */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Chat</h1>
          <Button className="bg-primary text-white hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col md:flex-row flex-1">
          <ConversationList 
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
          <div className="flex-1">
            <ChatView conversationId={selectedConversation} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
