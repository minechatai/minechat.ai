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
          <main className="flex-1">
            {children}
          </main>

          {/* Switch Back Banner - shows at bottom when admin is viewing as user */}
          {viewStatus?.isViewing && (
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <SwitchBackBanner userName={viewStatus.viewedUser?.firstName || 'Unknown User'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}