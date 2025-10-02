"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthPg } from "@/hooks/use-auth-pg";
import { useFeatureFlagsPg, usePersonalMode, useDiaryPlus } from "@/hooks/use-feature-flags-pg";
import { toast } from "sonner";

export function AuthPgDemo() {
  const { user, authenticated, loading, signOut } = useAuthPg();
  const { flags, loading: flagsLoading, setUserOverride } = useFeatureFlagsPg();
  const personalModeEnabled = usePersonalMode();
  const diaryPlusEnabled = useDiaryPlus();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error("Sign out failed");
    }
  };

  const toggleFlag = async (flagName: string, currentValue: boolean) => {
    try {
      await setUserOverride(flagName, !currentValue);
      toast.success(`Feature flag ${flagName} ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error("Failed to toggle feature flag");
    }
  };

  if (loading || flagsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PostgreSQL Auth Demo</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PostgreSQL Auth Demo</CardTitle>
          <CardDescription>Please sign in to see this demo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/auth-pg">Sign In with PostgreSQL</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>PostgreSQL Authentication</CardTitle>
          <CardDescription>Your current authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Name:</strong> {user?.name || 'Not set'}
            </div>
            <div>
              <strong>Role:</strong> <Badge variant="secondary">{user?.role}</Badge>
            </div>
            <div>
              <strong>Status:</strong> <Badge variant="default">Active</Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
            <Button asChild variant="outline">
              <a href="/auth">Switch to Supabase Auth</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags (PostgreSQL)</CardTitle>
          <CardDescription>
            Your current feature flags status. You can override global settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Status */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
              <div>
                <strong>Personal Mode:</strong> 
                <Badge className="ml-2" variant={personalModeEnabled ? "default" : "secondary"}>
                  {personalModeEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <strong>Diary Plus:</strong> 
                <Badge className="ml-2" variant={diaryPlusEnabled ? "default" : "secondary"}>
                  {diaryPlusEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            {/* All Flags */}
            <div className="space-y-2">
              <h4 className="font-medium">All Feature Flags:</h4>
              {flags.map((flag) => (
                <div key={flag.flagName} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong>{flag.flagName}</strong>
                      <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                        {flag.isEnabled ? "ON" : "OFF"}
                      </Badge>
                      {flag.hasUserOverride && (
                        <Badge variant="outline">Override</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Target: {flag.targetAudience} | Global: {flag.globalEnabled ? "ON" : "OFF"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFlag(flag.flagName, flag.isEnabled)}
                  >
                    Toggle
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
