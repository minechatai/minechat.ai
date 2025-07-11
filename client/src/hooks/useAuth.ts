import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role?: string;
}

interface ViewStatus {
  isViewing: boolean;
  viewedUser?: {
    id: string;
    email: string;
    name: string;
  };
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Check if admin is viewing as another user
  const { data: viewStatus } = useQuery<ViewStatus>({
    queryKey: ["/api/admin/view-status"],
    enabled: !!user,
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 0, // Always fresh
  });

  // If viewing as another user, return the impersonated user's data
  const effectiveUser = viewStatus?.isViewing && viewStatus?.viewedUser
    ? {
        id: viewStatus.viewedUser.id,
        email: viewStatus.viewedUser.email,
        firstName: viewStatus.viewedUser.firstName || viewStatus.viewedUser.name?.split(' ')[0] || viewStatus.viewedUser.email,
        lastName: viewStatus.viewedUser.lastName || viewStatus.viewedUser.name?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: viewStatus.viewedUser.profileImageUrl,
        role: 'user', // Impersonated users are treated as regular users
      }
    : user;

  return {
    user: effectiveUser,
    isAuthenticated: !!user && !error,
    isLoading,
    error,
    isImpersonating: viewStatus?.isViewing || false,
    originalUser: user, // Keep reference to original admin user
  };
}