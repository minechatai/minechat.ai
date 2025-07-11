
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User } from 'lucide-react';

export function SwitchBackBanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if in switched mode
  const { data: switchStatus } = useQuery({
    queryKey: ['/api/admin/switch-status'],
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Switch back mutation
  const switchBackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/switch-back', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Switched back to admin account",
      });
      // Redirect to admin panel
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch back",
        variant: "destructive",
      });
    },
  });

  if (!switchStatus?.isSwitched) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">
          Admin Mode: Viewing as "{switchStatus.businessName}"
        </span>
        <span className="text-xs bg-blue-500 px-2 py-1 rounded">
          User ID: {switchStatus.switchedUser?.id}
        </span>
      </div>
      
      <Button
        onClick={() => switchBackMutation.mutate()}
        variant="outline"
        size="sm"
        className="bg-white text-blue-600 hover:bg-gray-100 border-white"
        disabled={switchBackMutation.isPending}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {switchBackMutation.isPending ? "Switching..." : "Return to Admin"}
      </Button>
    </div>
  );
}
