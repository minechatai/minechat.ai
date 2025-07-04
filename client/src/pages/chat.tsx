import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import ConversationList from "@/components/chat/conversation-list";
import ChatView from "@/components/chat/chat-view";
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
      <MainLayout title="Chat">
        <div className="flex h-full">
          <div className="w-80 bg-white border-r border-gray-200 animate-pulse">
            <div className="p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
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
    <MainLayout title="Chat">
      <div className="flex h-full">
        <ConversationList 
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />
        <div className="flex-1 bg-gray-50">
          {/* Middle expanded space */}
        </div>
        <div className="w-1/2">
          <ChatView conversationId={selectedConversation} />
        </div>
      </div>
    </MainLayout>
  );
}
