import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MessageSquare } from "lucide-react";
import { Conversation } from "@shared/schema";

interface ConversationListProps {
  selectedConversation: number | null;
  onSelectConversation: (conversationId: number) => void;
}

export default function ConversationList({ selectedConversation, onSelectConversation }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const filteredConversations = conversations.filter((conversation: Conversation) => {
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
          <Button className="bg-primary text-white hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <MessageSquare className="w-4 h-4 absolute right-3 top-3 text-blue-500" />
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
          filteredConversations.map((conversation: Conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                selectedConversation === conversation.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
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
                  Start a conversation...
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
