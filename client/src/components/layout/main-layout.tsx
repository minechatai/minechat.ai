import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "./header";
import Sidebar from "./sidebar";
import SwitchBackBanner from "./switch-back-banner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the current view status to show the switch back banner
  const { data: viewStatus } = useQuery({
    queryKey: ['/api/admin/view-status'],
    refetchInterval: 5000,
    retry: false,
  });

  // Stop viewing mutation
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* God Mode Admin Banner */}
      {viewStatus?.isViewing && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">
              🚀 God Mode Admin: Currently viewing as {viewStatus.viewedUser?.firstName} {viewStatus.viewedUser?.lastName} ({viewStatus.viewedUser?.email})
            </div>
          </div>
          <Button
            onClick={() => stopViewingMutation.mutate()}
            disabled={stopViewingMutation.isPending}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            {stopViewingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Returning...
              </>
            ) : (
              "Return to Admin"
            )}
          </Button>
        </div>
      )}

      <div className="flex h-full">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col h-full ml-64 ${viewStatus?.isViewing ? 'pt-[56px]' : ''}`}>
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}