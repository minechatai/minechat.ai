import { Card, CardContent } from "@/components/ui/card";
import { Mail, Clock, Users, TrendingUp, Phone } from "lucide-react";

interface MetricsCardsProps {
  data: {
    unreadMessages: number;
    timeSaved: string;
    timeSavedChange: string;
    messagesSent: number;
    messagesSentChange: string;
    aiPercentage: number;
    humanPercentage: number;
    leads: number;
    opportunities: number;
    followUps: number;
  };
}

export default function MetricsCards({ data }: MetricsCardsProps) {
  const metrics = [
    {
      name: "Unread messages",
      value: data.unreadMessages,
      change: "same as last month",
      changeType: "neutral",
      icon: Mail,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      name: "Time Saved",
      value: data.timeSaved,
      change: data.timeSavedChange,
      changeType: data.timeSavedChange.startsWith('+') ? "increase" : data.timeSavedChange.startsWith('-') ? "decrease" : "neutral",
      icon: Clock,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      name: "Leads",
      value: data.leads,
      change: "same as last month",
      changeType: "neutral",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      name: "Opportunities",
      value: data.opportunities,
      change: "same as last month",
      changeType: "neutral",
      icon: TrendingUp,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      name: "Follow-ups",
      value: data.followUps,
      change: "same as last month",
      changeType: "neutral",
      icon: Phone,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.name} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${metric.iconBg} dark:${metric.iconBg.replace('100', '900/20')} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`w-4 h-4 ${metric.iconColor} dark:${metric.iconColor.replace('600', '400')}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.name}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              {(metric as any).breakdown && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {(metric as any).breakdown}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {metric.change === "same" ? "same as last month" : `${metric.change} vs last month`}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
