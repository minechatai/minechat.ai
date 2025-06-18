import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MainLayout from "@/components/layout/main-layout";
import MetricsCards from "@/components/dashboard/metrics-cards";
import Charts from "@/components/dashboard/charts";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: analytics, isLoading: analyticsLoading, error } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || analyticsLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-64"></div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-64"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Generate sample hourly data
  const generateHourlyData = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`;
      hours.push({
        hour,
        messages: Math.floor(Math.random() * 15) + 5,
        aiMessages: Math.floor(Math.random() * 10) + 2,
      });
    }
    return hours;
  };

  const metricsData = {
    unreadMessages: analytics?.unreadMessages || 0,
    moneySaved: analytics?.moneySaved || "0",
    leads: analytics?.leads || 0,
    opportunities: analytics?.opportunities || 0,
    followUps: analytics?.followUps || 0,
  };

  const messagesData = {
    human: analytics?.messagesHuman || 0,
    ai: analytics?.messagesAi || 0,
  };

  const hourlyData = analytics?.hourlyData || generateHourlyData();

  const faqData = [
    { question: "Do you provide demos?", count: 26 },
    { question: "Will this work on mobile or just in desktop?", count: 22 },
    { question: "What are your pricing plans?", count: 18 },
    { question: "Do you offer customer support?", count: 15 },
    { question: "Can I integrate with my existing tools?", count: 12 },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="p-6">
        {/* Date Range Selector */}
        <div className="flex justify-end mb-6">
          <Card className="border border-gray-300">
            <CardContent className="flex items-center space-x-2 p-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">1 Jan 2025 - 31 Dec 2025</span>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Cards */}
        <div className="mb-8">
          <MetricsCards data={metricsData} />
        </div>

        {/* Charts */}
        <Charts 
          messagesData={messagesData}
          hourlyData={hourlyData}
          faqData={faqData}
        />
      </div>
    </MainLayout>
  );
}
