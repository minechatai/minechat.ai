import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import UserProfileDropdown from "./user-profile-dropdown";
import { useQuery } from "@tanstack/react-query";
import type { Business } from "@shared/schema";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ title, onMenuClick, sidebarCollapsed = false }: HeaderProps) {
  const { user } = useAuth();
  
  // Fetch business information to display company logo
  const { data: business } = useQuery<Business>({
    queryKey: ['/api/business'],
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0
  });



  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 h-[73px]">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Company Logo and Name - aligned with sidebar Dashboard text */}
          <div className="flex items-center space-x-2 -ml-3">
            {business?.logoUrl ? (
              <img
                src={`${business.logoUrl}?v=${Date.now()}`}
                alt={`${business.companyName} logo`}
                className="w-8 h-8 rounded-full object-cover"
                key={business.logoUrl}
                onError={(e) => console.error('Logo failed to load:', business.logoUrl)}
                onLoad={() => console.log('Logo loaded successfully:', business.logoUrl)}
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8b1950, #b33054, #b73850)'
                }}
              >
                <span className="text-white font-semibold text-sm">
                  {business?.companyName?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
            )}
            <div className="text-lg">
              <div className="font-semibold text-gray-900 dark:text-white">
                {business?.companyName || 'Loading...'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </Button>
          
          <ModeToggle />
          
          <UserProfileDropdown user={user} />
        </div>
      </div>
    </header>
  );
}
