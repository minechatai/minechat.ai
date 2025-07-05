import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserProfile } from "@shared/schema";

export function useActiveProfile() {
  const queryClient = useQueryClient();

  // Get the current active user profile
  const { data: activeProfile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user-profiles/active'],
    retry: false,
  });

  // Get all user profiles for the dropdown
  const { data: allProfiles = [] } = useQuery<UserProfile[]>({
    queryKey: ['/api/user-profiles'],
    retry: false,
  });

  // Switch to a different user profile
  const switchProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return await apiRequest(`/api/user-profiles/${profileId}/activate`, '', 'POST');
    },
    onSuccess: () => {
      // Invalidate queries to refresh the active profile
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profiles'] });
    },
  });

  return {
    activeProfile,
    allProfiles,
    isLoading,
    switchProfile: switchProfileMutation.mutate,
    isSwitching: switchProfileMutation.isPending,
  };
}