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
  
  // Date range state - initialize with saved dates or today's date
  const getCurrentDate = () => {
    // Get current date in Philippines timezone (UTC+8)
    const now = new Date();
    const philippinesTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return philippinesTime.toISOString().split('T')[0];
  };
  
  const getSavedDateRange = () => {
    try {
      const saved = localStorage.getItem('dashboard-date-range');
      console.log("🔍 getSavedDateRange - localStorage value:", saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("🔍 Dashboard initialization - Restored saved date range:", parsed);
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to parse saved date range from localStorage:", error);
    }
    
    const today = getCurrentDate();
    console.log("🔍 Dashboard initialization - No saved date found, using default (today):", today);
    return {
      startDate: today,
      endDate: today
    };
  };
  
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>(getSavedDateRange);

  // Date picker state - initialize with saved dates
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const savedRange = getSavedDateRange();
    return {
      from: savedRange.startDate ? new Date(savedRange.startDate + 'T00:00:00') : new Date(),
      to: savedRange.endDate ? new Date(savedRange.endDate + 'T00:00:00') : new Date()
    };
  });

  // Track temporary date selection (not saved until user clicks Save)
  const [tempDate, setTempDate] = useState<DateRange | undefined>(date);

  // Initialize with saved date range - no forced today override
  useEffect(() => {
    const savedRange = getSavedDateRange();
    console.log("🔍 Dashboard mounted - Using saved date range:", savedRange);
    
    // Clear existing cache to force fresh data fetch with saved dates
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/time-saved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/messages-sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/conversations-per-hour"] });
    queryClient.invalidateQueries({ queryKey: ["/api/faq-analysis"] });
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
    
    const todayRange = {
      startDate: today,
      endDate: today
    };
    
    // Save today's date to localStorage for persistence
    try {
      localStorage.setItem('dashboard-date-range', JSON.stringify(todayRange));
      console.log("🔍 Today's date range saved to localStorage:", todayRange);
    } catch (error) {
      console.warn("Failed to save today's date range to localStorage:", error);
    }
    
    // Invalidate all analytics queries to force fresh data
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/time-saved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/messages-sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/conversations-per-hour"] });
    queryClient.invalidateQueries({ queryKey: ["/api/faq-analysis"] });
    
    setDateRange(todayRange);
    
    // Set date picker to today's date
    const todayDate = new Date();
    setDate({
      from: todayDate,
      to: todayDate
    });
    setTempDate({
      from: todayDate,
      to: todayDate
    });
  };

  // Handle temporary date changes (not saved until user clicks Save)
  const handleTempDateChange = (newDate: DateRange | undefined) => {
    console.log("🔍 Temp date picker change - newDate:", newDate);
    setTempDate(newDate);
  };

  // Reset the date picker to allow new selection
  const handleResetDatePicker = () => {
    console.log("🔍 Reset button clicked");
    setTempDate(undefined);
  };

  // Save the selected date range and update analytics
  const handleSaveDateRange = () => {
    console.log("🔍 Save button clicked - tempDate:", tempDate);
    if (tempDate?.from && tempDate?.to) {
      setDate(tempDate);
      
      // Create new date range object using local date formatting to avoid timezone issues
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const newDateRange = {
        startDate: formatLocalDate(tempDate.from),
        endDate: formatLocalDate(tempDate.to)
      };
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('dashboard-date-range', JSON.stringify(newDateRange));
        console.log("🔍 Date range saved to localStorage:", newDateRange);
      } catch (error) {
        console.warn("Failed to save date range to localStorage:", error);
      }
      
      updateAnalyticsWithRange(tempDate);
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
      <div className="p-6">
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
                defaultMonth={tempDate?.from || date?.from}
                selected={tempDate}
                onSelect={handleTempDateChange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t border-gray-200 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDatePicker}
                  className="text-xs"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDateRange}
                  disabled={!tempDate?.from || !tempDate?.to}
                  className="text-xs bg-minechat-red hover:bg-minechat-red/90"
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="mb-6">
          <MetricsCards data={metricsData} />
        </div>

        {/* Charts */}
        <div>
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
