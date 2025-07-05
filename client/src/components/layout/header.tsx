import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import UserProfileDropdown from "./user-profile-dropdown";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  
  // Fetch business information to display company logo
  const { data: business } = useQuery({
    queryKey: ['/api/business'],
    enabled: !!user
  });

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          
          {/* Company Logo */}
          {business && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-minechat-red-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {business.companyName?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {business.companyName || 'Your Company'}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {business.email || 'company@example.com'}
                </div>
              </div>
            </div>
          )}
          
          <UserProfileDropdown user={user} />
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
