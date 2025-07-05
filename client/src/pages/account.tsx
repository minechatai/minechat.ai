import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";

export default function Account() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const { data: business } = useQuery({
    queryKey: ['/api/business'],
  });

  // Get user's name or email for display
  const getUserName = () => {
    const businessData = business as any;
    const userData = user as any;
    
    if (businessData?.companyName) {
      return businessData.companyName;
    }
    if (userData?.email) {
      return userData.email;
    }
    return "User Account";
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    const businessData = business as any;
    const userData = user as any;
    
    if (businessData?.companyName) {
      return businessData.companyName.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const menuItems = [
    {
      icon: User,
      label: "Edit User Profile",
      hasArrow: true,
      onClick: () => console.log("Edit User Profile clicked")
    },
    {
      icon: FileText,
      label: "Terms & Conditions",
      hasArrow: true,
      onClick: () => console.log("Terms & Conditions clicked")
    },
    {
      icon: MessageSquare,
      label: "Contact Us",
      hasArrow: true,
      onClick: () => console.log("Contact Us clicked")
    },
    {
      icon: Settings,
      label: "Subscription",
      hasArrow: true,
      onClick: () => console.log("Subscription clicked")
    },
    {
      icon: LogOut,
      label: "Logout",
      hasArrow: false,
      onClick: () => {
        // Handle logout
        window.location.href = '/api/auth/logout';
      }
    }
  ];

  return (
    <MainLayout title="Accounts">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12 bg-gray-200 dark:bg-gray-700">
                    <AvatarFallback className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {getUserName()}
                    </h2>
                  </div>
                </div>
                <Button 
                  variant="default"
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  View profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {menuItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {item.label}
                      </span>
                    </div>
                    {item.hasArrow && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}