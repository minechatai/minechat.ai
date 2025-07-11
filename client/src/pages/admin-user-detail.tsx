import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, Calendar, Shield, Edit, Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId,
  });

  // Fetch user's business info
  const { data: business } = useQuery({
    queryKey: ["/api/admin/users", userId, "business"],
    enabled: !!userId,
  });

  // Fetch user's conversations
  const { data: conversations } = useQuery({
    queryKey: ["/api/admin/users", userId, "conversations"],
    enabled: !!userId,
  });

  // Fetch user's activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ["/api/admin/users", userId, "logs"],
    enabled: !!userId,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: { role?: string; status?: string }) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetUserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/users/${userId}/reset`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User account reset successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
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

  if (!user) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              User not found
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The user you're looking for doesn't exist.
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
                User Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage user account and settings
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                <AvatarFallback>
                  {getInitials(user.firstName, user.lastName, user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {user.status || "Active"}
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
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Joined {format(new Date(user.createdAt), "PPP")}
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
                      {user.updatedAt ? format(new Date(user.updatedAt), "PPp") : "Never"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Account Status:</span>{" "}
                      <Badge variant="outline" className="ml-1">
                        {user.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Admin Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() =>
                        updateUserMutation.mutate({
                          role: user.role === "admin" ? "user" : "admin",
                        })
                      }
                      disabled={updateUserMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </Button>
                    <Button
                      onClick={() =>
                        updateUserMutation.mutate({
                          status: user.status === "disabled" ? "active" : "disabled",
                        })
                      }
                      disabled={updateUserMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {user.status === "disabled" ? "Enable Account" : "Disable Account"}
                    </Button>
                    <Button
                      onClick={() => resetUserMutation.mutate()}
                      disabled={resetUserMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Account
                    </Button>
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