import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SwitchBackBannerProps {
  userName: string;
}

export default function SwitchBackBanner({ userName }: SwitchBackBannerProps) {
  const { toast } = useToast();

  // Get the current view status to show who we're viewing as
  const { data: viewStatus } = useQuery({
    queryKey: ['/api/admin/view-status'],
    refetchInterval: 5000,
  });

  const stopViewingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/stop-viewing');
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

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="text-sm font-medium">
          🚀 God Mode Admin: Currently viewing user account
        </div>
      </div>

      <Button
        onClick={() => stopViewingMutation.mutate()}
        disabled={stopViewingMutation.isPending}
        size="sm"
        variant="ghost"
        className="text-white hover:bg-blue-700 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {stopViewingMutation.isPending ? "Returning..." : "Return to Admin"}
      </Button>
    </div>
  );
}