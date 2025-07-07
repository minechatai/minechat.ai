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

  // Debug current authentication status
  console.log('🔍 Account page - user data:', user);
  console.log('🔍 Account page - business data:', business);

  // Mutation for updating profile picture
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('🔍 MUTATION FUNCTION CALLED - Profile picture upload started for file:', file.name, 'Size:', file.size);
      setIsUploadingImage(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('profileImage', file);
      
      console.log('🔍 Making request to /api/auth/profile-picture with proper authentication');
      
      // Use fetch with proper session cookies (same pattern as working endpoints)
      const response = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Don't set Content-Type header - let browser set it with boundary for multipart
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload profile picture: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      console.log('🔍 Upload successful:', result);
      return result;
    },
    onSuccess: async (data, file) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles/active'] });
      setPreviewImage(null);
      setIsUploadingImage(false);
      
      // Update business logo with the uploaded profile picture
      if (data && data.profileImageUrl) {
        try {
          const logoFormData = new FormData();
          logoFormData.append('image', file);
          
          const logoResponse = await fetch('/api/business/upload-logo', {
            method: 'POST',
            body: logoFormData,
            credentials: 'include',
          });
          
          if (logoResponse.ok) {
            // Force refresh business data to update header logo immediately
            queryClient.invalidateQueries({ queryKey: ["/api/business"] });
            queryClient.removeQueries({ queryKey: ["/api/business"] });
            queryClient.refetchQueries({ queryKey: ["/api/business"] });
          }
        } catch (error) {
          console.error('Error updating business logo:', error);
        }
      }
      
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
    console.log('🔍 UPLOAD HANDLER CALLED - File input change event triggered');
    const file = event.target.files?.[0];
    console.log('🔍 Selected file:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file selected');
    console.log('🔍 Current user state:', user);
    console.log('🔍 Mutation state:', updateProfilePictureMutation);
    
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('🔍 File too large:', file.size);
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        console.log('🔍 Invalid file type:', file.type);
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      console.log('🔍 File validation passed, creating preview and uploading');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      console.log('🔍 Starting mutation...');
      updateProfilePictureMutation.mutate(file);
    } else {
      console.log('🔍 No file selected from input');
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Handle clicking the profile picture
  const handleProfilePictureClick = () => {
    console.log('🔍 Profile picture clicked!');
    console.log('🔍 File input ref:', fileInputRef.current);
    console.log('🔍 About to trigger file input click');
    
    // Add more debugging
    if (fileInputRef.current) {
      console.log('🔍 File input element exists, triggering click');
      fileInputRef.current.click();
    } else {
      console.error('🔍 File input ref is null!');
    }
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
      icon: User,
      label: "Manage User Profiles",
      hasArrow: true,
      onClick: () => window.location.href = '/manage-user-profiles'
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
    <MainLayout title="Account">
      <div className="p-4 sm:p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Account</h1>
        </div>
        
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
                    
                    {/* Camera icon indicator */}
                    <div className="absolute -bottom-1 -right-1 bg-gray-100 dark:bg-gray-600 rounded-full p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                         onClick={handleProfilePictureClick}
                         title="Change photo">
                      <Camera className="w-3 h-3 text-gray-600 dark:text-gray-300" />
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
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {getUserName()}
                        </h2>
                        <div 
                          className="bg-gray-100 dark:bg-gray-600 rounded-full p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                          onClick={handleStartEditingName}
                          title="Edit account name"
                        >
                          <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
    </MainLayout>
  );
}