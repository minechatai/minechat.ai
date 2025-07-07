import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Paperclip, Image, Mic, Send, MessageCircle, X } from "lucide-react";
import { Message, Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useActiveProfile } from "@/hooks/useActiveProfile";
import chatbotIcon from "@assets/Frame_1751633918219.png";
import aiModeImage from "@assets/AI_1751717516599.png";
import humanModeImage from "@assets/Human_1751717521808.png";

interface ChatViewProps {
  conversationId: number | null;
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const [message, setMessage] = useState("");
  const [isAiMode, setIsAiMode] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeProfile } = useActiveProfile();

  const { data: conversation, isLoading: conversationLoading } = useQuery<Conversation>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark conversation as read when viewing it
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest('POST', '/api/notifications/mark-read', { conversationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Sync toggle state with conversation mode from database
  useEffect(() => {
    if (conversation) {
      setIsAiMode(conversation.mode === 'ai' || !conversation.mode);
    }
  }, [conversation]);

  // Auto-scroll to bottom when messages change or conversation changes
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages, conversationId]);

  // Mark conversation as read when conversation changes
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const hasUnreadCustomerMessages = messages.some(
        msg => msg.senderType === 'customer' && (!msg.readByAdmin || msg.readByAdmin === false)
      );
      if (hasUnreadCustomerMessages) {
        markAsReadMutation.mutate(conversationId);
      }
    }
  }, [conversationId, messages]);

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

  const sendMessageWithAttachments = async (messageText: string, files: File[]) => {
    if (!conversationId) return;

    try {
      // If there are files, send them first
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', conversationId.toString());
          formData.append('senderType', conversation?.mode === 'ai' ? 'assistant' : 'human');
          
          const response = await fetch('/api/messages/file', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to send file: ${file.name}`);
          }
        }
      }

      // Then send text message if there's any text
      if (messageText.trim()) {
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: messageText,
          senderType: conversation?.mode === 'ai' ? 'assistant' : 'human'
        });
      }

      // Clear attachments and message after successful send
      setAttachedFiles([]);
      setMessage("");
      
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Add files to attachment list instead of sending immediately
      setAttachedFiles(prev => [...prev, ...files]);
    }
    // Reset the input so the same files can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachedFiles.length === 0) || !conversationId) return;
    
    // Send message with attachments using the new combined function
    sendMessageWithAttachments(message.trim(), attachedFiles);
  };

  const handleModeToggle = (mode: 'ai' | 'human') => {
    if (!conversationId) return;
    
    setIsAiMode(mode === 'ai');
    updateModeMutation.mutate({
      conversationId,
      mode
    });
  };

  const handleViewProfile = () => {
    if (conversation?.facebookSenderId) {
      // Note: Facebook PSIDs (Page-Scoped IDs) cannot be used to access user profiles directly
      // This is a privacy feature - businesses cannot access customer profiles via page interactions
      // We'll try the search approach as a fallback
      window.open(`https://www.facebook.com/search/people/?q=${conversation.customerName || conversation.facebookSenderId}`, '_blank');
    }
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
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
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
              <h3 className="font-semibold text-gray-900">{conversation?.customerName || 'Loading...'}</h3>
              <p 
                className="text-sm text-blue-600 cursor-pointer hover:underline"
                onClick={handleViewProfile}
              >
                View profile
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleModeToggle((conversation?.mode === 'ai' || !conversation?.mode) ? 'human' : 'ai')}
                disabled={updateModeMutation.isPending}
                className="transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <img 
                  src={(conversation?.mode === 'ai' || !conversation?.mode) ? aiModeImage : humanModeImage}
                  alt={(conversation?.mode === 'ai' || !conversation?.mode) ? "AI Mode Enabled - Click to switch to Human Mode" : "Human Mode - Click to switch to AI Mode"}
                  className="w-20 h-10 object-contain"
                />
              </button>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Mode Indicator */}
      <div className="bg-gray-50 border-t border-gray-200 py-2 px-4">
        <div className="text-center">
          <span className="text-sm px-3 py-1 rounded-full shadow-sm border-2" style={{color: '#b33054', borderColor: '#b33054'}}>
            {(conversation?.mode === 'ai' || !conversation?.mode) ? 'AI Enabled' : 'Human Mode'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="max-w-none mx-auto space-y-4 pr-4">
          
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <img 
                src={chatbotIcon} 
                alt="AI Assistant" 
                className="w-12 h-12 mx-auto mb-4 opacity-30"
              />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">Send a message to start the conversation</p>

            </div>
          ) : (
            messages.map((msg: Message) => (
              <div key={msg.id} className={`flex ${msg.senderType === 'customer' || msg.senderType === 'user' ? 'justify-start' : 'justify-end'}`}>
                {msg.senderType === 'customer' || msg.senderType === 'user' ? (
                  <div className="flex space-x-3 max-w-md lg:max-w-lg">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage 
                        src={conversation?.customerProfilePicture} 
                        alt={conversation?.customerName || 'Customer'}
                        onError={(e) => {
                          console.log('Avatar image failed to load:', conversation?.customerProfilePicture);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {conversation?.customerName?.charAt(0).toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        {msg.messageType === 'file' ? (
                          <div>
                            {/* Check if it's an image */}
                            {(msg as any).fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test((msg as any).fileName) ? (
                              <div className="space-y-2">
                                <img 
                                  src={(msg as any).fileUrl} 
                                  alt={(msg as any).fileName}
                                  className="max-w-xs rounded-lg shadow-sm cursor-pointer"
                                  onClick={() => window.open((msg as any).fileUrl, '_blank')}
                                />
                                <div className="flex items-center space-x-2">
                                  <Image className="w-3 h-3 text-gray-500" />
                                  <p className="text-xs text-gray-600">{(msg as any).fileName}</p>
                                  {(msg as any).fileSize && (
                                    <p className="text-xs text-gray-500">
                                      {((msg as any).fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-900 font-medium">{(msg as any).fileName || msg.content}</p>
                                  {(msg as any).fileSize && (
                                    <p className="text-xs text-gray-500">
                                      {((msg as any).fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  )}
                                </div>
                                {(msg as any).fileUrl && (
                                  <a
                                    href={(msg as any).fileUrl}
                                    download={(msg as any).fileName}
                                    className="text-primary hover:text-primary-dark text-xs underline"
                                  >
                                    Download
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-900">{msg.content}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md lg:max-w-lg">
                    <div className="p-4 rounded-lg shadow-sm bg-[#E1E1EB] text-gray-900">
                      <div className="flex items-center space-x-2 mb-2">
                        {msg.senderType === 'human' ? (
                          // Show the actual sender's profile for human messages
                          <Avatar className="w-6 h-6">
                            <AvatarImage 
                              src={(msg as any).humanSenderProfileImageUrl || undefined} 
                              alt={(msg as any).humanSenderName || 'Team Member'}
                            />
                            <AvatarFallback className="bg-minechat-red text-white text-xs">
                              {((msg as any).humanSenderName?.charAt(0).toUpperCase()) || 'T'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <img 
                              src={chatbotIcon} 
                              alt="AI Assistant" 
                              className="w-4 h-4"
                            />
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-600">
                          {msg.senderType === 'human' ? ((msg as any).humanSenderName || 'Team Member') : 'AI Assistant'}
                        </span>
                      </div>
                      {msg.messageType === 'file' ? (
                        <div>
                          {/* Check if it's an image */}
                          {(msg as any).fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test((msg as any).fileName) ? (
                            <div className="space-y-2">
                              <img 
                                src={(msg as any).fileUrl} 
                                alt={(msg as any).fileName}
                                className="max-w-xs rounded-lg shadow-sm cursor-pointer"
                                onClick={() => window.open((msg as any).fileUrl, '_blank')}
                              />
                              <div className="flex items-center space-x-2">
                                <Image className="w-3 h-3 text-gray-500" />
                                <p className="text-xs text-gray-600">{(msg as any).fileName}</p>
                                {(msg as any).fileSize && (
                                  <p className="text-xs text-gray-500">
                                    {((msg as any).fileSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">{(msg as any).fileName || msg.content}</p>
                                {(msg as any).fileSize && (
                                  <p className="text-xs text-gray-500">
                                    {((msg as any).fileSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                              {(msg as any).fileUrl && (
                                <a
                                  href={(msg as any).fileUrl}
                                  download={(msg as any).fileName}
                                  className="text-primary hover:text-primary-dark text-xs underline"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdAt)}</p>
                  </div>
                )}
              </div>
            ))
          )}
          {/* Scroll anchor for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-3">
          <div className="mb-2">
            <span className="text-xs text-gray-600 font-medium">
              Attached Files ({attachedFiles.length})
            </span>
          </div>
          <div className="space-y-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                  onClick={() => removeAttachedFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input - Smaller */}
      <div className="bg-white border-t border-gray-200 p-3 mt-auto">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={(conversation?.mode === 'ai' || !conversation?.mode) ? "AI mode is enabled - switch to Human mode to send messages" : attachedFiles.length > 0 ? "Add a caption for your files..." : "Send a message"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-20 h-9"
              disabled={conversation?.mode === 'ai' || !conversation?.mode}
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                multiple
                disabled={conversation?.mode === 'ai' || !conversation?.mode}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="p-0 w-4 h-4" 
                disabled={conversation?.mode === 'ai' || !conversation?.mode}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="bg-primary hover:bg-primary-dark h-9"
            disabled={(conversation?.mode === 'ai' || !conversation?.mode) || sendMessageMutation.isPending}
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
