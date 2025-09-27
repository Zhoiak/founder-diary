"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, Settings, Heart, Briefcase, Zap, Users, 
  GraduationCap, Camera, Lightbulb, BookOpen, Calendar,
  Shield, Save
} from "lucide-react";
import Link from "next/link";
import { ModeSelector } from "@/components/mode-selector";
import { useFeatureFlags, type FeatureFlags } from "@/hooks/use-feature-flags";
import { type Project } from "@/types/project";

const featureFlagConfig: Record<string, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: string;
  badge?: string;
}> = {
  diary_personal: {
    label: "Personal Journal",
    description: "Daily life entries with mood, energy, and location tracking",
    icon: Heart,
    color: "text-pink-500",
    category: "personal"
  },
  habits: {
    label: "Habits Tracking",
    description: "Track daily habits and build consistent routines",
    icon: Zap,
    color: "text-yellow-500",
    category: "personal"
  },
  routines: {
    label: "Morning & Evening Routines",
    description: "Structured reflection prompts for morning and evening",
    icon: Calendar,
    color: "text-blue-500",
    category: "personal",
    badge: "New"
  },
  people: {
    label: "Relationships CRM",
    description: "Personal relationship management and interaction tracking",
    icon: Users,
    color: "text-blue-500",
    category: "personal"
  },
  learning: {
    label: "Learning & Flashcards",
    description: "Knowledge base with spaced repetition flashcards",
    icon: GraduationCap,
    color: "text-purple-500",
    category: "personal"
  },
  memories: {
    label: "Memories & Photos",
    description: "Photo storage with location mapping and time capsules",
    icon: Camera,
    color: "text-green-500",
    category: "personal",
    badge: "Beta"
  },
  insights: {
    label: "Wellbeing Insights",
    description: "Correlations and actionable insights from your data",
    icon: Lightbulb,
    color: "text-orange-500",
    category: "personal",
    badge: "Beta"
  },
  yearbook: {
    label: "Yearly Book Export",
    description: "Generate PDF/EPUB books from your journal entries",
    icon: BookOpen,
    color: "text-indigo-500",
    category: "personal",
    badge: "Coming Soon"
  }
};

export default function SettingsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentMode, setCurrentMode] = useState<'founder' | 'personal'>('founder');
  const [saving, setSaving] = useState(false);
  const [localFlags, setLocalFlags] = useState<FeatureFlags>({
    diary_personal: false,
    habits: false,
    routines: false,
    people: false,
    learning: false,
    memories: false,
    insights: false,
    yearbook: false,
  });

  const { flags, loading, updateFlags, project } = useFeatureFlags(selectedProject?.id);

  useEffect(() => {
    if (flags) {
      setLocalFlags(flags);
    }
  }, [flags]);

  const handleFlagChange = (flag: keyof FeatureFlags, enabled: boolean) => {
    setLocalFlags(prev => ({ ...prev, [flag]: enabled }));
  };

  const saveChanges = async () => {
    if (!selectedProject) {
      toast.error("No project selected");
      return;
    }

    setSaving(true);
    try {
      await updateFlags(localFlags);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(flags) !== JSON.stringify(localFlags);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Settings
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage your feature flags and preferences</p>
              </div>
            </div>
            <ModeSelector 
              onModeChange={(mode, project) => {
                setCurrentMode(mode);
                setSelectedProject(project);
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Settings className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Project</h3>
              <p className="text-gray-600 text-center max-w-md">
                Choose a project above to configure its feature flags and settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Project Info */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {currentMode === 'personal' ? (
                        <Heart className="w-6 h-6 text-pink-500" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-blue-500" />
                      )}
                      {selectedProject.name} Settings
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Configure which features are enabled for this project
                    </CardDescription>
                  </div>
                  {selectedProject.private_vault && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <Shield className="w-3 h-3 mr-1" />
                      Private Vault
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Feature Flags */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable specific features for this project. Changes will take effect immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="w-32 h-4 bg-gray-200 rounded"></div>
                            <div className="w-48 h-3 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(featureFlagConfig).map(([key, config]) => {
                      const flagKey = key as keyof FeatureFlags;
                      const Icon = config.icon;
                      const isEnabled = localFlags[flagKey];
                      
                      return (
                        <div 
                          key={key}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            isEnabled 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isEnabled ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${isEnabled ? config.color : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">{config.label}</h3>
                                {config.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {config.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleFlagChange(flagKey, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Save Button */}
                {hasChanges && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={saveChanges} 
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">About Feature Flags</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Feature flags allow you to enable or disable specific functionality without redeploying the application. 
                      This gives you control over which features are available in each project and helps you gradually roll out new capabilities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
