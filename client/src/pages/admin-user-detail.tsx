import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, Building, MessageSquare, Activity, Trash2, Shield } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";

interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Business {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  userProfileId: string;
  recipientId: string;
  recipientName: string;
  platform: string;
  lastMessage: string;
  lastMessageAt: string;
  status: string;
  createdAt: string;
}

// Component to handle View as User / Return to Admin button
function AdminViewButton({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if currently viewing as user
  const { data: viewStatus } = useQuery({
    queryKey: ['/api/admin/view-status'],
    refetchInterval: 5000,
  });

  // View as user mutation
  const viewAsUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("👁️ Starting view as user for:", userId);
      const response = await apiRequest("POST", `/api/admin/view-as-user/${userId}`);
      return response;
    },
    onSuccess: (data) => {
      console.log("✅ View successful, redirecting to dashboard");
      toast({
        title: "Success",
        description: data.message || "Now viewing as user",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    },
    onError: (error: any) => {
      console.error("❌ View mutation error:", error);
      toast({
        title: "View Failed",
        description: error.message || "Unable to view as this user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stop viewing mutation
  const stopViewingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/stop-viewing');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Returned to admin view",
      });
      // Redirect to admin panel
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return to admin view",
        variant: "destructive",
      });
    },
  });

  // If currently viewing as user, show "Return to Admin" button
  if (viewStatus?.isViewing) {
    return (
      <Button
        onClick={() => stopViewingMutation.mutate()}
        variant="outline"
        className="w-full"
        disabled={stopViewingMutation.isPending}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {stopViewingMutation.isPending ? "Returning..." : "Return to Admin"}
      </Button>
    );
  }

  // Otherwise, show "View as User" button
  return (
    <Button
      onClick={() => viewAsUserMutation.mutate(accountId)}
      variant="default"
      className="w-full"
      disabled={viewAsUserMutation.isPending}
    >
      {viewAsUserMutation.isPending ? "Starting View..." : "View as User"}
    </Button>
  );
}

export default function AdminAccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialog management
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  // Fetch account details
  const { data: account, isLoading, error } = useQuery({
    queryKey: [`/api/admin/accounts/${accountId}`],
    enabled: !!accountId,
  });

  // Add error logging for debugging
  if (error) {
    console.error("Error loading account:", error);
  }

  // Fetch account's business info
  const { data: business } = useQuery({
    queryKey: [`/api/admin/accounts/${accountId}/business`],
    enabled: !!accountId,
  });

  // Fetch account's users (user profiles)
  const { data: users } = useQuery({
    queryKey: [`/api/admin/accounts/${accountId}/users`],
    enabled: !!accountId,
  });

  // Fetch account's conversations
  const { data: conversations } = useQuery({
    queryKey: [`/api/admin/accounts/${accountId}/conversations`],
    enabled: !!accountId,
  });

  // Fetch account's activity logs
  const { data: activityLogs } = useQuery({
    queryKey: [`/api/admin/accounts/${accountId}/logs`],
    enabled: !!accountId,
  });

  // Update account role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest(`/api/admin/accounts/${accountId}`, {
        method: "PATCH",
        body: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/accounts/${accountId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({
        title: "Success",
        description: "Account role updated successfully",
      });
      setIsRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account role",
        variant: "destructive",
      });
    },
  });

  // Toggle account status mutation
  const toggleAccountStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest(`/api/admin/accounts/${accountId}`, {
        method: "PATCH",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/accounts/${accountId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({
        title: "Success",
        description: "Account status updated successfully",
      });
      setIsDisableDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account status",
        variant: "destructive",
      });
    },
  });

  // Reset account mutation
  const resetAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/accounts/${accountId}/reset`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/accounts/${accountId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({
        title: "Success",
        description: "Account reset successfully",
      });
      setIsResetDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset account",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log("🗑️ Deleting account:", accountId);
      return await apiRequest(
        "DELETE",
        `/api/admin/accounts/${accountId}/delete`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      toast({
        title: "Success",
        description: "Account deleted permanently",
      });
      setIsDeleteDialogOpen(false);
      // Navigate back to admin dashboard
      navigate("/admin");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  // View as user mutation
  const viewAsUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("👁️ Making API request to view as user:", userId);
      try {
        const response = await apiRequest("POST", `/api/admin/view-as-user/${userId}`);
        console.log("✅ View response received:", response);
        return response;
      } catch (error) {
        console.error("❌ View API call failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Now viewing as user, redirecting...");
      toast({
        title: "Success",
        description: data.message || "Now viewing as user",
      });
      // Small delay to ensure session is properly set
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    },
    onError: (error: any) => {
      console.error("❌ View as user failed:", error);
      toast({
        title: "View Failed", 
        description: error.message || "Unable to view as this user. Please verify the account exists and try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Error loading account
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {error instanceof Error ? error.message : "An error occurred while loading the account."}
            </p>
            <Button
              onClick={() => navigate("/admin")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!account) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Account not found
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The account you're looking for doesn't exist.
            </p>
            <Button
              onClick={() => navigate("/admin")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate("/admin")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Account Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage business account and settings
              </p>
            </div>
          </div>
        </div>

        {/* Account Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={account?.profileImageUrl} alt={account?.firstName || account?.email} />
                <AvatarFallback>
                  {getInitials(account?.firstName, account?.lastName, account?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {account?.firstName && account?.lastName
                    ? `${account?.firstName} ${account?.lastName}`
                    : account?.email || "Unknown Account"}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleBadgeColor(account?.role || "user")}>
                    <Shield className="w-3 h-3 mr-1" />
                    {(account?.role || "user").replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {account?.status || "Active"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {account?.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Joined {account?.createdAt ? format(new Date(account?.createdAt), "PPP") : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {business && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Business Information
                    </h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Company:</span>{" "}
                        {business.companyName}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Industry:</span>{" "}
                        {business.industry}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Location:</span>{" "}
                        {business.location}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Account Statistics
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Total Conversations:</span>{" "}
                      {conversations?.length || 0}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Last Active:</span>{" "}
                      {account?.updatedAt ? format(new Date(account.updatedAt), "PPp") : "Never"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Account Status:</span>{" "}
                      <Badge variant="outline" className="ml-1">
                        {account?.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Account Management
                  </h3>
                  <div className="space-y-2">
                    {/* View as User Button */}
                    <AdminViewButton accountId={account.id} />

                    {/* Edit Role Dialog */}
                    <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedRole(account?.role || "user");
                            setIsRoleDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Update the role for {account?.firstName} {account?.lastName} ({account?.email})
                          </p>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsRoleDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => updateRoleMutation.mutate(selectedRole)}
                            disabled={updateRoleMutation.isPending}
                          >
                            {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Disable Account Dialog */}
                    <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {account?.status === "disabled" ? "Enable Account" : "Disable Account"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {account?.status === "disabled" ? "Enable Account" : "Disable Account"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Are you sure you want to {account?.status === "disabled" ? "enable" : "disable"} the account for {account?.firstName} {account?.lastName} ({account?.email})?
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Do you still wish to proceed?
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDisableDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => 
                              toggleAccountStatusMutation.mutate(
                                account?.status === "disabled" ? "active" : "disabled"
                              )
                            }
                            disabled={toggleAccountStatusMutation.isPending}
                            variant={account?.status === "disabled" ? "default" : "destructive"}
                          >
                            {toggleAccountStatusMutation.isPending 
                              ? "Updating..." 
                              : account?.status === "disabled" ? "Enable" : "Disable"
                            }
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Reset Account Dialog */}
                    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset User Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            This will reset all data for {account?.firstName} {account?.lastName} ({account?.email}), including:
                          </p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                            <li>Business information and settings</li>
                            <li>AI assistant configuration</li>
                            <li>Product catalog</li>
                            <li>Chat conversations and messages</li>
                            <li>Analytics data</li>
                          </ul>
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            This action cannot be undone. Do you still wish to proceed?
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsResetDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => resetAccountMutation.mutate()}
                            disabled={resetAccountMutation.isPending}
                            variant="destructive"
                          >
                            {resetAccountMutation.isPending ? "Resetting..." : "Reset Account"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Account Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete User Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            This will permanently delete the account for {account?.firstName} {account?.lastName} ({account?.email}) and all associated data, including:
                          </p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                            <li>User profile and account information</li>
                            <li>Business information and settings</li>
                            <li>AI assistant configuration</li>
                            <li>Product catalog</li>
                            <li>Chat conversations and messages</li>
                            <li>Analytics data</li>
                            <li>File uploads and documents</li>
                            <li>User profiles and team members</li>
                          </ul>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              ⚠️ WARNING: This action cannot be undone!
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              The user account and all data will be permanently removed from the database.
                            </p>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Do you still wish to proceed?
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => deleteAccountMutation.mutate()}
                            disabled={deleteAccountMutation.isPending}
                            variant="destructive"
                          >
                            {deleteAccountMutation.isPending ? "Deleting..." : "Delete Forever"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {activityLogs && activityLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(log.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}