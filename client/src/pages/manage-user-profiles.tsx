import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Edit3, Trash2, User, Crown } from "lucide-react";
import type { UserProfile } from "@shared/schema";

export default function ManageUserProfiles() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    position: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profiles
  const { data: profiles = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ['/api/user-profiles'],
  });

  // Reset form when dialogs close
  useEffect(() => {
    if (!isCreateDialogOpen && !editingProfile) {
      setFormData({
        name: "",
        email: "",
        password: "",
        position: ""
      });
    }
  }, [isCreateDialogOpen, editingProfile]);

  // Populate form when editing
  useEffect(() => {
    if (editingProfile) {
      setFormData({
        name: editingProfile.name,
        email: editingProfile.email,
        password: "", // Don't populate password for security
        position: editingProfile.position || ""
      });
    }
  }, [editingProfile]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create user profile mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const formDataToSend = new FormData();
      formDataToSend.append('name', userData.name);
      formDataToSend.append('email', userData.email);
      formDataToSend.append('password', userData.password);
      formDataToSend.append('position', userData.position || '');
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User profile created successfully",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user profile",
        variant: "destructive",
      });
    },
  });

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/user-profiles/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
      setEditingProfile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile",
        variant: "destructive",
      });
    },
  });

  // Delete user profile mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await fetch(`/api/user-profiles/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User profile deleted successfully",
      });
      setDeletingProfile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user profile",
        variant: "destructive",
      });
    },
  });

  // Activate user profile mutation
  const activateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await fetch(`/api/user-profiles/${id}/activate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User profile activated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate user profile",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || (!editingProfile && !formData.password)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingProfile) {
      // Update existing profile
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        position: formData.position || null,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      updateUserMutation.mutate({
        id: editingProfile.id,
        data: updateData
      });
    } else {
      // Create new profile
      createUserMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        position: formData.position || null,
      });
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = () => {
    if (deletingProfile) {
      deleteUserMutation.mutate(deletingProfile.id);
    }
  };

  // Handle profile activation
  const handleActivateProfile = (profileId: string) => {
    activateUserMutation.mutate(profileId);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <MainLayout title="Manage User Profiles">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Manage User Profiles
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage user profiles for your team
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-minechat-red hover:bg-minechat-red/90 text-white font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Enter position/role"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="bg-minechat-red hover:bg-minechat-red/90 text-white"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profiles List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-minechat-red mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No user profiles yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first user profile to get started
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-minechat-red hover:bg-minechat-red/90 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create First Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile: UserProfile) => (
              <Card key={profile.id} className={`transition-all ${profile.isActive ? 'ring-2 ring-minechat-red' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profile.profileImageUrl || ''} />
                        <AvatarFallback className="bg-minechat-red/10 text-minechat-red">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {profile.name}
                          </h3>
                          {profile.isActive && (
                            <Crown className="w-4 h-4 text-minechat-red" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {profile.email}
                        </p>
                        {profile.position && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {profile.position}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!profile.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateProfile(profile.id)}
                          disabled={activateUserMutation.isPending}
                        >
                          Switch to User
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProfile(profile)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingProfile(profile)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Profile Dialog */}
        <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-password">Password</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Enter position/role"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProfile(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="bg-minechat-red hover:bg-minechat-red/90 text-white"
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingProfile} onOpenChange={(open) => !open && setDeletingProfile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the profile for "{deletingProfile?.name}"? This action cannot be undone.
                Do you still wish to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfile}
                disabled={deleteUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}