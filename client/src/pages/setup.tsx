import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import AiAssistant from "@/components/setup/ai-assistant";
import BusinessInfo from "@/components/setup/business-info";
import Channels from "@/components/setup/channels";
import AiTestingPanel from "@/components/setup/ai-testing-panel";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Setup() {
  const { section } = useParams<{ section?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Default to ai-assistant if no section specified
  const currentSection = section || "ai-assistant";

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

  // Redirect to ai-assistant if no section or invalid section
  useEffect(() => {
    if (!section) {
      setLocation("/setup/ai-assistant");
    } else if (!["ai-assistant", "business", "channels"].includes(section)) {
      setLocation("/setup/ai-assistant");
    }
  }, [section, setLocation]);

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "ai-assistant":
        return "AI Assistant";
      case "business":
        return "AI Knowledge";
      case "channels":
        return "Channels";
      default:
        return "AI Assistant";
    }
  };

  const getBreadcrumbContent = (section: string) => {
    switch (section) {
      case "ai-assistant":
        return { setupText: "Setup", sectionText: "AI Assistant" };
      case "business":
        return { setupText: "Setup", sectionText: "AI Knowledge" };
      case "channels":
        return { setupText: "Setup", sectionText: "Channels" };
      default:
        return { setupText: "Setup", sectionText: "AI Assistant" };
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case "ai-assistant":
        return <AiAssistant />;
      case "business":
        return <BusinessInfo />;
      case "channels":
        return <Channels />;
      default:
        return <AiAssistant />;
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Setup">
        <div className="flex h-full">
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-full sm:w-96 md:w-[400px] lg:w-[500px] xl:w-[600px] 2xl:w-[700px] bg-white border-l border-gray-200 animate-pulse">
            <div className="p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Setup">
      <div className="flex flex-col xl:flex-row h-full min-h-screen xl:min-h-0">
        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0" style={{ marginRight: (currentSection === "ai-assistant" || currentSection === "business") ? '400px' : '0' }}>
          <div className="max-w-none sm:max-w-4xl">
            {/* Page Title with Breadcrumb */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <h1 className="flex items-baseline gap-2 text-gray-900 dark:text-white">
                    <span className="text-2xl font-semibold">
                      {getBreadcrumbContent(currentSection).setupText}
                    </span>
                    <span className="text-base font-semibold">
                      &gt;
                    </span>
                    <span className="text-base font-semibold">
                      {getBreadcrumbContent(currentSection).sectionText}
                    </span>
                  </h1>
                  {currentSection === "channels" && (
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                      (watch tutorial video)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {renderSection()}
          </div>
        </div>

        {/* AI Testing Panel - Fixed Position - only show for AI Assistant and Business */}
        {(currentSection === "ai-assistant" || currentSection === "business") && (
          <div className="fixed top-[73px] right-8 w-full xl:w-96 2xl:w-[32rem] h-[calc(100vh-73px)] z-40 flex flex-col min-h-0 p-4 xl:pl-6">
            <AiTestingPanel />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
