
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

  // Return just the button data for use in admin user detail page
  if (!viewStatus?.isViewing) {
    return null;
  }

  return {
    viewStatus,
    stopViewingMutation,
    isViewing: viewStatus.isViewing
  };
}
