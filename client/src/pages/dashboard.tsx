import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MainLayout from "@/components/layout/main-layout";
import MetricsCards from "@/components/dashboard/metrics-cards";
import Charts from "@/components/dashboard/charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // Date range state - initialize with today's date to show today by default
  const getCurrentDate = () => {
    // Get current date in Philippines timezone (UTC+8)
    const now = new Date();
    const philippinesTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return philippinesTime.toISOString().split('T')[0];
  };
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>(() => {
    const today = getCurrentDate();
    console.log("🔍 Dashboard initialization - Current date (Philippines time):", today);
    return {
      startDate: today,
      endDate: today
    };
  });

  // Date picker state - initialize with today's date
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  // Track whether we're selecting a new range (reset on first click)
  const [isSelectingNewRange, setIsSelectingNewRange] = useState(false);
  
  // Track manual click overrides
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  // Ensure we're always showing today's data on component mount
  useEffect(() => {
    const today = getCurrentDate();
    console.log("🔍 Dashboard mounted - Ensuring current date:", today);
    
    // Clear existing cache to force fresh data fetch
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/time-saved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/messages-sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/conversations-per-hour"] });
    queryClient.invalidateQueries({ queryKey: ["/api/faq-analysis"] });
    
    setDateRange({
      startDate: today,
      endDate: today
    });
    setDate({
      from: new Date(),
      to: new Date()
    });
  }, [queryClient]);

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
    queryKey: ["/api/analytics", dateRange.startDate, dateRange.endDate],
    enabled: isAuthenticated && !!dateRange.startDate && !!dateRange.endDate,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `/api/analytics?${params.toString()}`;
      console.log("🔍 Analytics Query - Fetching URL:", url);
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // Time Saved analytics query
  const { data: timeSavedData, isLoading: timeSavedLoading } = useQuery({
    queryKey: ["/api/analytics/time-saved", dateRange.startDate, dateRange.endDate, "month"],
    enabled: isAuthenticated && !!dateRange.startDate && !!dateRange.endDate,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('comparisonPeriod', 'month');
      
      const url = `/api/analytics/time-saved?${params.toString()}`;
      console.log("🔍 Time Saved Query - Fetching URL:", url);
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // Messages Sent analytics query
  const { data: messagesSentData, isLoading: messagesSentLoading } = useQuery({
    queryKey: ["/api/analytics/messages-sent", dateRange.startDate, dateRange.endDate, "month"],
    enabled: isAuthenticated && !!dateRange.startDate && !!dateRange.endDate,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('comparisonPeriod', 'month');
      
      const url = `/api/analytics/messages-sent?${params.toString()}`;
      console.log("🔍 Messages Sent Query - Fetching URL:", url);
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // FAQ Analysis query with custom queryFn for date parameters
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ["/api/faq-analysis", dateRange.startDate, dateRange.endDate],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const url = `/api/faq-analysis${params.toString() ? `?${params.toString()}` : ''}`;
      console.log("🔍 FAQ Query - Fetching URL:", url);
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // Conversations Per Hour analytics query
  const { data: conversationsHourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ["/api/analytics/conversations-per-hour", dateRange.startDate, dateRange.endDate, "month"],
    enabled: isAuthenticated && !!dateRange.startDate && !!dateRange.endDate,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('comparisonPeriod', 'month');
      
      const url = `/api/analytics/conversations-per-hour?${params.toString()}`;
      console.log("🔍 Hourly Data Query - Fetching URL:", url);
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // Debug the query parameters
  console.log("🔍 FAQ Query - Current dateRange:", dateRange);
  console.log("🔍 FAQ Query - Query key:", ["/api/faq-analysis", dateRange.startDate, dateRange.endDate]);

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
    timeSaved: (timeSavedData as any)?.timeSaved || "0 mins",
    timeSavedChange: (timeSavedData as any)?.change || "same as last month",
    messagesSent: (messagesSentData as any)?.totalMessages || 0,
    messagesSentChange: (messagesSentData as any)?.change || "same as last month",
    aiPercentage: (messagesSentData as any)?.aiPercentage || 0,
    humanPercentage: (messagesSentData as any)?.humanPercentage || 0,
    leads: (analytics as any)?.leads || 0,
    opportunities: (analytics as any)?.opportunities || 0,
    followUps: (analytics as any)?.followUps || 0,
  };

  const messagesData = {
    human: (messagesSentData as any)?.humanMessages || 0,
    ai: (messagesSentData as any)?.aiMessages || 0,
  };

  const chartHourlyData = (conversationsHourlyData as any)?.hourlyData || generateHourlyData();

  // Handle date range changes
  const handleShowToday = () => {
    const today = getCurrentDate();
    console.log("🔍 Show Today clicked - Setting date range to:", today);
    
    // Invalidate all analytics queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/time-saved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/messages-sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/conversations-per-hour"] });
    queryClient.invalidateQueries({ queryKey: ["/api/faq-analysis"] });
    
    setDateRange({
      startDate: today,
      endDate: today
    });
    setDate({
      from: new Date(),
      to: new Date()
    });
  };

  // Handle date picker changes with manual click override
  const handleDateChange = (newDate: DateRange | undefined) => {
    console.log("🔍 Date picker change - newDate:", newDate);
    console.log("🔍 Date picker change - pendingDate:", pendingDate);
    console.log("🔍 Date picker change - current date:", date);
    
    // If we have a pending date (manual click), use it to start fresh
    if (pendingDate) {
      console.log("🔍 Date picker - Using pending date for fresh start");
      setDate({ from: pendingDate, to: undefined });
      setIsSelectingNewRange(true);
      setPendingDate(null);
      return;
    }
    
    // If we're selecting a new range, handle normally
    if (isSelectingNewRange) {
      setDate(newDate);
      if (newDate?.from && newDate?.to) {
        console.log("🔍 Date picker - Completing new range");
        setIsSelectingNewRange(false);
        updateAnalyticsWithRange(newDate);
      }
      return;
    }
    
    // Normal flow
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      updateAnalyticsWithRange(newDate);
    }
  };

  // Helper function to update analytics with new date range
  const updateAnalyticsWithRange = (dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) return;
    
    // Use local date string to avoid timezone conversion issues
    const startDate = dateRange.from.getFullYear() + '-' + 
      String(dateRange.from.getMonth() + 1).padStart(2, '0') + '-' + 
      String(dateRange.from.getDate()).padStart(2, '0');
    const endDate = dateRange.to.getFullYear() + '-' + 
      String(dateRange.to.getMonth() + 1).padStart(2, '0') + '-' + 
      String(dateRange.to.getDate()).padStart(2, '0');
    
    console.log("🔍 Date picker change - Setting range:", { startDate, endDate });
    
    // Invalidate all analytics queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/time-saved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/messages-sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/conversations-per-hour"] });
    queryClient.invalidateQueries({ queryKey: ["/api/faq-analysis"] });
    
    setDateRange({
      startDate,
      endDate
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
      <div className="p-4 flex flex-col min-h-full">
        {/* Page Title with Date Controls */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          
          {/* Date Range Selector aligned with title */}
          <div className="flex items-center space-x-3">
          <Button 
            onClick={() => {
              console.log("🔍 Button clicked!");
              handleShowToday();
            }}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Show Today
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                onDayClick={(day, activeModifiers) => {
                  console.log("🔍 Calendar Day Click - User clicked:", day, "Current range:", date);
                  
                  // If we have a complete range, intercept the click and force reset
                  if (date?.from && date?.to) {
                    console.log("🔍 Calendar Day Click - Complete range exists, setting pending date for reset");
                    setPendingDate(day);
                    
                    // Prevent the default calendar behavior by triggering our override
                    setTimeout(() => {
                      handleDateChange({ from: day, to: undefined });
                    }, 0);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {/* Metrics Cards - Reduced margin */}
        <div className="mb-4">
          <MetricsCards data={metricsData} />
        </div>

        {/* Charts - Flex to fill remaining space */}
        <div className="flex-1 min-h-0">
          <Charts 
            messagesData={messagesData}
            hourlyData={chartHourlyData}
            faqData={(faqData as any) || []}
            faqLoading={faqLoading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
