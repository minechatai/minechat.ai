import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface ChartsProps {
  messagesData: {
    human: number;
    ai: number;
  };
  hourlyData: Array<{
    hour: string;
    messages: number;
  }>;
  faqData: Array<{
    question: string;
    count: number;
    isInFaq?: boolean;
  }>;
  faqLoading?: boolean;
}

export default function Charts({ messagesData, hourlyData, faqData, faqLoading }: ChartsProps) {
  const { toast } = useToast();

  const pieData = [
    { name: 'Human', value: messagesData.human, color: '#9CA3AF' },
    { name: 'AI', value: messagesData.ai, color: '#A53860' }
  ];

  const totalMessages = messagesData.human + messagesData.ai;
  const humanPercentage = totalMessages > 0 ? Math.round((messagesData.human / totalMessages) * 100) : 0;
  const aiPercentage = totalMessages > 0 ? Math.round((messagesData.ai / totalMessages) * 100) : 0;

  const handleAddToFaq = async (question: string) => {
    try {
      // Navigate to Setup page and pre-populate the FAQ form
      const searchParams = new URLSearchParams({
        tab: 'business',
        action: 'add-faq',
        question: question
      });
      
      window.location.href = `/setup?${searchParams.toString()}`;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add question to FAQ list",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Charts Row - Reduced spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Messages Sent Chart */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Messages Sent</CardTitle>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#9CA3AF' }}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Human</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white ml-auto">{humanPercentage}%</span>
                  </div>
                  <div className="w-24 h-1 rounded-full" style={{ backgroundColor: '#9CA3AF' }}></div>
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#A53860' }}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white ml-auto">{aiPercentage}%</span>
                  </div>
                  <div className="w-24 h-1 rounded-full" style={{ backgroundColor: '#A53860' }}></div>
                </div>
              </div>
              <div className="relative">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
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
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{totalMessages}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequently Asked Questions */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</CardTitle>
            <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-1">
              {faqLoading ? (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">Analyzing customer conversations...</p>
                </div>
              ) : faqData && faqData.length > 0 ? (
                faqData.slice(0, 5).map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm transition-colors"
                    onClick={() => handleAddToFaq(item.question)}
                  >
                    <div className="flex items-center space-x-3">
                      <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.question}({item.count})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm font-medium">No business questions found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Customer questions will appear here once you have conversations
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Per Hour Chart - Reduced height */}
      <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Conversations Per Hour</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax / 5) * 5]}
                  ticks={Array.from({ length: Math.ceil(Math.max(...hourlyData.map(d => d.messages)) / 5) + 1 }, (_, i) => i * 5)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'messages') {
                      return [`${value} customer messages`, 'Received'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#A53860" 
                  strokeWidth={2}
                  fill="#A53860"
                  fillOpacity={0.1}
                  dot={{ fill: '#A53860', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#A53860' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
