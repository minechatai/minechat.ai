import { Card, CardContent } from "@/components/ui/card";
import { Mail, DollarSign, Users, TrendingUp, Phone } from "lucide-react";

interface MetricsCardsProps {
  data: {
    unreadMessages: number;
    moneySaved: string;
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
      change: "+14%",
      changeType: "increase",
      icon: Mail,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      name: "Money Saved",
      value: `$${data.moneySaved}`,
      change: "+6%",
      changeType: "increase",
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      name: "Leads",
      value: data.leads,
      change: "+14%",
      changeType: "increase",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      name: "Opportunities",
      value: data.opportunities,
      change: "-8%",
      changeType: "decrease",
      icon: TrendingUp,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      name: "Follow-ups",
      value: data.followUps,
      change: "same",
      changeType: "neutral",
      icon: Phone,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.name} className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-500">
                {metric.change === "same" ? "same as last month" : `${metric.change} vs last month`}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
