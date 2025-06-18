import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ChartsProps {
  messagesData: {
    human: number;
    ai: number;
  };
  hourlyData: Array<{
    hour: string;
    messages: number;
    aiMessages: number;
  }>;
  faqData: Array<{
    question: string;
    count: number;
  }>;
}

export default function Charts({ messagesData, hourlyData, faqData }: ChartsProps) {
  const pieData = [
    { name: 'Human', value: messagesData.human, color: '#A53860' },
    { name: 'AI', value: messagesData.ai, color: '#9CA3AF' }
  ];

  const totalMessages = messagesData.human + messagesData.ai;
  const humanPercentage = totalMessages > 0 ? Math.round((messagesData.human / totalMessages) * 100) : 0;
  const aiPercentage = totalMessages > 0 ? Math.round((messagesData.ai / totalMessages) * 100) : 0;

  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Messages Sent Chart */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Messages Sent</CardTitle>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="relative">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={64}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">100%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Data</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm text-gray-600">Human</span>
                  <span className="text-sm font-semibold text-gray-900">{humanPercentage}%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">AI</span>
                  <span className="text-sm font-semibold text-gray-900">{aiPercentage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Asked Questions */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Most Asked Questions</CardTitle>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqData.length > 0 ? (
                faqData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm text-gray-700">
                      {item.question}({item.count})
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No questions data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Per Hour Chart */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Messages Received Per Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={[0, 20]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#E5E7EB" 
                  strokeWidth={2}
                  fill="#E5E7EB"
                  fillOpacity={0.1}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="aiMessages" 
                  stroke="#A53860" 
                  strokeWidth={2}
                  fill="#A53860"
                  fillOpacity={0.1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
