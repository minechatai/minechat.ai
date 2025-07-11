import { useAuth } from "@/hooks/useAuth";
import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserProfileDropdown from "./user-profile-dropdown";
import { useActiveProfile } from "@/hooks/useActiveProfile";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user, isImpersonating, originalUser } = useAuth();
  const { activeProfile } = useActiveProfile();

  // Get business info for the current user (whether impersonated or not)
  const { data: business } = useQuery({
    queryKey: ["/api/business"],
    enabled: !!user,
  });

  // Get unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Determine what to display in the header
  const getDisplayInfo = () => {
    if (isImpersonating) {
      // When viewing as user, show business name or user name
      const businessName = business?.companyName;
      const userName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.email || 'User';

      return {
        title: businessName || userName,
        isBusinessName: !!businessName,
        logo: business?.logoUrl
      };
    } else {
      // When not impersonating, show business name and logo if available, otherwise show user/profile info
      if (business?.companyName) {
        return {
          title: business.companyName,
          isBusinessName: true,
          logo: business.logoUrl
        };
      } else {
        return {
          title: activeProfile?.name || 
                 (originalUser?.firstName && originalUser?.lastName 
                   ? `${originalUser.firstName} ${originalUser.lastName}` 
                   : originalUser?.email || 'User'),
          isBusinessName: false,
          logo: null
        };
      }
    }
  };

  const displayInfo = getDisplayInfo();

  // Adjust header height when God Mode banner is present
  const headerHeight = false ? '73px' : '73px';

  return (
    <header className="fixed top-0 left-64 right-0 bg-white border-b border-gray-200 px-6 flex items-center z-50" style={{ height: headerHeight }}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          {/* Show business logo if available */}
          {displayInfo.logo && (
            <img 
              src={displayInfo.logo} 
              alt="Business Logo" 
              className="w-8 h-8 rounded object-cover"
            />
          )}

          <h1 className="text-xl font-semibold text-gray-900">
            {displayInfo.title}
          </h1>

          {/* Show viewing indicator if admin is viewing as user */}
          {isImpersonating && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Viewing as {displayInfo.isBusinessName ? 'Business' : 'User'}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}