import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "./header";
import Sidebar from "./sidebar";
import SwitchBackBanner from "./switch-back-banner";
import { useQuery } from "@tanstack/react-query";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();

  // Get the current view status to show the switch back banner
  const { data: viewStatus } = useQuery({
    queryKey: ['/api/admin/view-status'],
    refetchInterval: 5000,
    retry: false,
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />

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

          <div className={`flex min-h-screen ${viewStatus?.isViewing ? 'pt-[56px]' : ''}`}>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}