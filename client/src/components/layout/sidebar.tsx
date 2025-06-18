import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, BarChart3, MessageCircle, Settings, Users, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { 
    name: "Setup", 
    icon: Settings, 
    children: [
      { name: "AI Assistant", href: "/setup/ai-assistant" },
      { name: "Business Information", href: "/setup/business-info" },
      { name: "Channels", href: "/setup/channels" },
    ]
  },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Accounts", href: "/accounts", icon: User },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [setupOpen, setSetupOpen] = useState(location.startsWith("/setup"));

  const isActive = (href: string) => {
    if (href === "/dashboard" && location === "/") return true;
    return location.startsWith(href);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img 
            src="/attached_assets/Colored Logo Black_1750266947131.png" 
            alt="Minechat AI" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold text-gray-900 dark:text-white">minechat.ai</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          if (item.children) {
            return (
              <Collapsible key={item.name} open={setupOpen} onOpenChange={setSetupOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start space-x-3 ${
                      location.startsWith("/setup") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link key={child.name} href={child.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start ${
                          isActive(child.href) ? "bg-gray-50 text-gray-900" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {child.name}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 ${
                  isActive(item.href) ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => window.location.href = '/api/logout'}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
