import { Link, useLocation } from "wouter";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText, 
  Users, 
  HelpCircle,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Setup", href: "/setup", icon: Settings },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Help", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();

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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Minechat AI" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">minechat.ai</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                    )}
                  />
                  {item.name}
                </a>
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