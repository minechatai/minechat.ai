import { apiRequest } from "@/lib/queryClient";

export async function fixUserSession(): Promise<void> {
  try {
    const response = await apiRequest("/api/fix-user-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (response.success) {
      console.log("✅ Session fixed successfully");
      // Reload the page to get fresh data
      window.location.reload();
    } else {
      console.error("❌ Failed to fix session");
    }
  } catch (error) {
    console.error("❌ Error fixing session:", error);
  }
}

// Auto-fix session if user is logged in as test user
export function autoFixSessionIfNeeded() {
  // Check if current user is the test user
  if (window.location.href.includes("dashboard") || window.location.href.includes("setup")) {
    fetch("/api/auth/user")
      .then(response => response.json())
      .then(user => {
        if (user && user.id && user.id.startsWith("email-")) {
          console.log("🔄 Detected test user, fixing session automatically...");
          fixUserSession();
        }
      })
      .catch(error => {
        console.error("Error checking user:", error);
      });
  }
}