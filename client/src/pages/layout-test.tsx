import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, Users } from "lucide-react";

export default function LayoutTest() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Layout Test - Minechat AI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Testing full-width layout
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title with Controls */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Dashboard Layout Test
            </h1>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                Show Today
              </Button>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Pick a date range
              </Button>
            </div>
          </div>

          {/* Test Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Test Metric 1
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Test Metric 2
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,234</div>
                <p className="text-xs text-muted-foreground">
                  +19% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Test Metric 3
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Test Metric 4
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Chart 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Full Width Chart Area
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This content should display at full width without narrow columns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Chart 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Responsive Layout
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Content should fill available space properly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wide Content Test */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Wide Content Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    ✅ LAYOUT RESTORED TO FULL WIDTH
                  </h3>
                  <p className="text-red-100">
                    This banner should stretch across the full width of the page without being squished into a narrow column
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}