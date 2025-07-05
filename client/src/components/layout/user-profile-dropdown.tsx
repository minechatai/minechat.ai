import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveProfile } from "@/hooks/useActiveProfile";
import { UserProfile } from "@shared/schema";

interface UserProfileDropdownProps {
  user?: any; // Fallback main user
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const { activeProfile, allProfiles, isLoading, switchProfile, isSwitching } = useActiveProfile();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // Use active profile if available, fallback to main user
  const currentUser = activeProfile || {
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'User',
    profileImageUrl: user?.profileImageUrl,
  };

  const handleUserSwitch = (profile: UserProfile) => {
    if (profile.id !== activeProfile?.id && !isSwitching) {
      switchProfile(profile.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-white text-xs">
            {getInitials(currentUser.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Loading...
        </span>
      </div>
    );
  }

  // If no user profiles exist, show the main user
  if (!allProfiles || allProfiles.length === 0) {
    return (
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={currentUser.profileImageUrl || ''} alt={currentUser.name} />
          <AvatarFallback className="bg-primary text-white text-xs">
            {getInitials(currentUser.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentUser.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUser.profileImageUrl || ''} alt={currentUser.name} />
            <AvatarFallback className="bg-primary text-white text-xs">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {currentUser.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {allProfiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleUserSwitch(profile)}
            className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={isSwitching}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.profileImageUrl || ''} alt={profile.name} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {profile.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {profile.position || profile.email}
              </div>
            </div>
            
            {profile.isActive && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}