import { Link, useLocation } from "wouter";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText, 
  User, 
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const getNavigationItems = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { 
      name: "Setup", 
      href: "/setup", 
      icon: Settings,
      submenu: [
        { name: "AI Assistant", href: "/setup/ai-assistant" },
        { name: "AI Knowledge", href: "/setup/business" },
        { name: "Channels", href: "/setup/channels" },
      ]
    },
    { name: "CRM", href: "/crm", icon: BarChart3 },
    { name: "Account", href: "/accounts", icon: User },
  ];

  if (isAdmin) {
    return [
      ...baseNavigation,
      { name: "Admin", href: "/admin", icon: Shield },
    ];
  }

  return baseNavigation;
};

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen = false, isCollapsed = false, onClose, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const [setupExpanded, setSetupExpanded] = useState(true);

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ["/api/admin/check"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const navigation = getNavigationItems(adminCheck?.isAdmin || false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className={`
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 
      fixed inset-y-0 left-0 z-50 
      ${isCollapsed ? 'w-16' : 'w-64 sm:w-56 md:w-64 lg:w-72 xl:w-80'}
      transition-all duration-300 ease-in-out
      md:relative md:z-auto md:flex md:flex-col
      h-screen
    `}>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className={`py-4 border-b border-gray-200 dark:border-gray-700 h-[73px] flex items-center justify-between ${
          isCollapsed ? 'px-2' : 'px-6'
        }`}>
          {isCollapsed ? (
            // Collapsed state: only logo visible, button appears on hover
            <div className="flex items-center justify-center w-full group">
              {/* Logo with absolutely fixed dimensions */}
              <img 
                src="/logo.png" 
                alt="Minechat AI" 
                className="object-contain flex-shrink-0 group-hover:hidden"
                style={{ 
                  width: '32px !important', 
                  height: '32px !important',
                  minWidth: '32px',
                  minHeight: '32px',
                  maxWidth: '32px',
                  maxHeight: '32px'
                }}
              />
              {/* Expand button appears on hover */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:group-hover:flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            // Expanded state: logo on left, collapse button on right
            <>
              <div className="flex items-center space-x-3">
                {/* Logo with absolutely fixed dimensions */}
                <img 
                  src="/logo.png" 
                  alt="Minechat AI" 
                  className="object-contain flex-shrink-0"
                  style={{ 
                    width: '32px !important', 
                    height: '32px !important',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px'
                  }}
                />
                <span className="text-xl font-semibold text-gray-900 dark:text-white logo-brand">minechat.ai</span>
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.submenu && item.submenu.some(sub => location.includes(sub.href)));
            
            if (isCollapsed) {
              // Collapsed state - show only icons
              return (
                <div key={item.name} className="relative group">
                  <Link href={item.href}>
                    <span
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer",
                        isActive
                          ? "bg-rose-50 text-rose-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      title={item.name}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-rose-600"
                            : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                    </span>
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                </div>
              );
            }
            
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
        <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <div className="relative group">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                Sign out
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white h-8 px-2 text-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}