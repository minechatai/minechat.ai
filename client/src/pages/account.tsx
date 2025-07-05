import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  Camera,
  Edit2,
  Check,
  X
} from "lucide-react";

export default function Account() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const { data: business } = useQuery({
    queryKey: ['/api/business'],
  });

  // Mutation for updating profile picture
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setPreviewImage(null);
      setIsUploadingImage(false);
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    },
    onError: () => {
      setIsUploadingImage(false);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating account name (syncs with business name)
  const updateAccountNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/business', { companyName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditingName(false);
      toast({
        title: "Success",
        description: "Account name updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account name",
        variant: "destructive",
      });
    },
  });

  // Handle profile picture upload
  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      updateProfilePictureMutation.mutate(file);
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Handle clicking the profile picture
  const handleProfilePictureClick = () => {
    console.log('Profile picture clicked!');
    fileInputRef.current?.click();
  };

  // Handle account name editing
  const handleStartEditingName = () => {
    setEditedName(getUserName());
    setIsEditingName(true);
  };

  const handleSaveAccountName = () => {
    if (editedName.trim()) {
      updateAccountNameMutation.mutate(editedName.trim());
    }
  };

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

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
      label: "Create User Profile",
      hasArrow: true,
      onClick: () => window.location.href = '/create-user-profile'
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
                  {/* Clickable Profile Picture */}
                  <div className="relative">
                    <div 
                      className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-full transition-all duration-200 group"
                      onClick={handleProfilePictureClick}
                      title="Click to change profile picture"
                    >
                      <Avatar className="w-12 h-12 bg-gray-200 dark:bg-gray-700">
                        {isUploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full z-10">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {previewImage ? (
                          <AvatarImage src={previewImage} alt="Preview" />
                        ) : (user as any)?.profileImageUrl ? (
                          <AvatarImage src={(user as any).profileImageUrl} alt="Profile" />
                        ) : null}
                        <AvatarFallback className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Hover overlay with camera icon */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex-1">
                    {/* Editable Account Name */}
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="text-lg font-semibold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveAccountName();
                            if (e.key === 'Escape') handleCancelEditingName();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveAccountName}
                          disabled={updateAccountNameMutation.isPending}
                          className="p-1 h-8 w-8"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditingName}
                          className="p-1 h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 group">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {getUserName()}
                        </h2>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditingName}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">{(user as any)?.email}</p>
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