import { Link, useLocation } from "wouter";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText, 
  Users, 
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { 
    name: "Setup", 
    href: "/setup", 
    icon: Settings,
    submenu: [
      { name: "AI Assistant", href: "/setup/ai-assistant" },
      { name: "Business", href: "/setup/business" },
      { name: "Channels", href: "/setup/channels" },
    ]
  },
  { name: "CRM", href: "/crm", icon: BarChart3 },
  { name: "Accounts", href: "/accounts", icon: Users },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [setupExpanded, setSetupExpanded] = useState(true);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className={`
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 
      fixed inset-y-0 left-0 z-50 
      w-64 
      transition-transform duration-300 ease-in-out
      md:relative md:z-auto md:flex md:flex-col
    `}>
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Minechat AI" 
              className="w-6 h-6 object-contain"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">minechat.ai</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.submenu && item.submenu.some(sub => location.includes(sub.href)));
            
            if (item.submenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setSetupExpanded(!setupExpanded)}
                    className={cn(
                      "group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-rose-50 text-rose-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        isActive
                          ? "text-rose-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                    {setupExpanded ? (
                      <ChevronDown className="ml-auto h-3 w-3" />
                    ) : (
                      <ChevronRight className="ml-auto h-3 w-3" />
                    )}
                  </button>
                  
                  {setupExpanded && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubActive = location === subItem.href || location.startsWith(subItem.href);
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <span
                              className={cn(
                                "block px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer",
                                isSubActive
                                  ? "text-gray-900 font-medium bg-gray-100"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {subItem.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      isActive
                        ? "text-rose-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}