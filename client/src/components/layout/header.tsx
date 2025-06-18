import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronDown, Menu, Sun } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
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
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <Sun className="w-4 h-4 mr-2" />
            <span className="text-sm">Light mode</span>
            <div className="w-8 h-4 bg-gray-300 rounded-full relative ml-2">
              <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
            </div>
          </Button>
          
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || ''} alt={`${user?.firstName} ${user?.lastName}`} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-900">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
