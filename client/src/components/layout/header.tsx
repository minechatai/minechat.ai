import { useAuth } from "@/hooks/useAuth";
import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserProfileDropdown from "./user-profile-dropdown";
import { useActiveProfile } from "@/hooks/useActiveProfile";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user, isImpersonating } = useAuth();
  const { activeProfile } = useActiveProfile();

  // Get unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || 'User';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {activeProfile?.name || displayName}
          </h1>

          {/* Show viewing indicator if admin is viewing as user */}
          {isImpersonating && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Viewing as {displayName}
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