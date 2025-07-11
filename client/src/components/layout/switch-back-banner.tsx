
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User } from 'lucide-react';

export function SwitchBackBanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if in impersonation mode
  const { data: viewStatus } = useQuery({
    queryKey: ['/api/admin/view-status'],
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Stop viewing mutation
  const stopViewingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        '/api/admin/stop-viewing'
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Returned to admin view",
      });
      // Redirect to admin panel
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return to admin view",
        variant: "destructive",
      });
    },
  });

  if (!viewStatus?.isViewing) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">
          Admin View: Viewing as "{viewStatus.businessName}"
        </span>
        <span className="text-xs bg-blue-500 px-2 py-1 rounded">
          User: {viewStatus.viewedUser?.name}
        </span>
      </div>
      
      <Button
        onClick={() => stopViewingMutation.mutate()}
        variant="outline"
        size="sm"
        className="bg-white text-blue-600 hover:bg-gray-100 border-white"
        disabled={stopViewingMutation.isPending}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {stopViewingMutation.isPending ? "Returning..." : "Return to Admin"}
      </Button>
    </div>
  );
}
