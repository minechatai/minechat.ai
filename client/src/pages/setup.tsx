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
    } else if (!["ai-assistant", "business-info", "channels"].includes(section)) {
      setLocation("/setup/ai-assistant");
    }
  }, [section, setLocation]);

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "ai-assistant":
        return "AI Assistant";
      case "business-info":
        return "Business Information";
      case "channels":
        return "Channels";
      default:
        return "AI Assistant";
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case "ai-assistant":
        return <AiAssistant />;
      case "business-info":
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
          <div className="w-96 bg-white border-l border-gray-200 animate-pulse">
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
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <nav className="text-sm text-gray-500 mb-2 flex items-center">
                  <span>Setup</span>
                  <ChevronRight className="w-4 h-4 mx-2" />
                  <span className="text-gray-900">{getSectionTitle(currentSection)}</span>
                </nav>
              </div>
              <Button className="bg-primary text-white hover:bg-primary-dark">
                Save
              </Button>
            </div>

            {renderSection()}
          </div>
        </div>

        {/* AI Testing Panel - only show for AI Assistant and Business Information */}
        {(currentSection === "ai-assistant" || currentSection === "business-info") && (
          <AiTestingPanel />
        )}
      </div>
    </MainLayout>
  );
}
