import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MainLayout from "@/components/layout/main-layout";
import MetricsCards from "@/components/dashboard/metrics-cards";
import Charts from "@/components/dashboard/charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  });

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

  // FAQ Analysis query
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ["/api/faq-analysis", dateRange.startDate, dateRange.endDate],
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
    unreadMessages: (analytics as any)?.unreadMessages || 0,
    moneySaved: (analytics as any)?.moneySaved || "0",
    leads: (analytics as any)?.leads || 0,
    opportunities: (analytics as any)?.opportunities || 0,
    followUps: (analytics as any)?.followUps || 0,
  };

  const messagesData = {
    human: (analytics as any)?.messagesHuman || 0,
    ai: (analytics as any)?.messagesAi || 0,
  };

  const hourlyData = (analytics as any)?.hourlyData || generateHourlyData();

  // Handle date range changes
  const handleShowToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({
      startDate: today,
      endDate: today
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
    
    return `${startDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })}`;
  };

  return (
    <MainLayout title="Dashboard">
      <div className="p-6">
        {/* Date Range Selector */}
        <div className="flex justify-end items-center space-x-3 mb-6">
          <Button 
            onClick={handleShowToday}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Show Today
          </Button>
          <Card className="border border-gray-300">
            <CardContent className="flex items-center space-x-2 p-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {formatDateRange(dateRange.startDate, dateRange.endDate)}
              </span>
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
          faqData={(faqData as any) || []}
          faqLoading={faqLoading}
        />
      </div>
    </MainLayout>
  );
}
