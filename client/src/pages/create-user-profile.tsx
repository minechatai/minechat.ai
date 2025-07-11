import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera } from "lucide-react";

export default function CreateUserProfile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    position: ""
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Handle clicking the profile picture
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  // Create user profile mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log('Creating user profile with data:', userData);
      
      // If there's a profile image, use the endpoint that supports file upload
      if (userData.profileImage) {
        const formData = new FormData();
        formData.append('name', userData.name);
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('position', userData.position || '');
        
        // Convert base64 image to file
        const response = await fetch(userData.profileImage);
        const blob = await response.blob();
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        formData.append('profileImage', file);
        
        const uploadResponse = await fetch("/api/users/create", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || 'Failed to create user profile with image');
        }
        
        return uploadResponse.json();
      } else {
        // No profile image, use regular JSON endpoint
        const profileData = {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          position: userData.position || ''
        };
        
        const response = await fetch("/api/user-profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(profileData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create user profile');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate and refetch user profiles to update the list
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles/active'] });
      
      toast({
        title: "Success",
        description: "User profile created successfully",
      });
      // Navigate back to accounts page
      window.location.href = '/accounts';
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user profile",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Create user profile
    createUserMutation.mutate({
      ...formData,
      profileImage: profileImage // This will be the base64 data URL from FileReader
    });
  };

  // Handle cancel
  const handleCancel = () => {
    window.location.href = '/accounts';
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (formData.name.trim()) {
      return formData.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return "U";
  };

  return (
    <MainLayout title="Accounts">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8">
            Create user profile
          </h1>

          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Profile
              </h3>
              <div 
                className="w-24 h-24 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-full transition-all duration-200 group mx-auto"
                onClick={handleProfilePictureClick}
                title="Click to upload profile picture"
              >
                <Avatar className="w-24 h-24 bg-gray-200 dark:bg-gray-700">
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full z-10">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
          </div>

          {/* User Details Form */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
              User details
            </h3>

            <div className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-gray-600 dark:text-gray-400">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg py-3 px-4"
                  />
                </div>
              </div>

              {/* Password and Position Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-600 dark:text-gray-400">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm text-gray-600 dark:text-gray-400">
                    Position
                  </Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Enter job title/role"
                    className="bg-gray-100 dark:bg-gray-800 border-0 rounded-lg py-3 px-4"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createUserMutation.isPending}
                className="bg-minechat-red hover:bg-minechat-red/90 text-white px-6 py-2"
              >
                {createUserMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}