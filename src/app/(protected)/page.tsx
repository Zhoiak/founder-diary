"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, BookOpen, Target, BarChart3, TrendingUp, FileText, Command, Keyboard, Calendar, Heart, Zap, Users, GraduationCap, Settings, Briefcase } from "lucide-react";
import Link from "next/link";
import { ModeSelector } from "@/components/mode-selector";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { type Project, type ProjectWithStats } from "@/types/project";

export default function Dashboard() {
  const supabase = createClient();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'founder' | 'personal'>('founder');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  useEffect(() => {
    fetchProjectsWithStats();
  }, []);

  const fetchProjectsWithStats = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      
      // Fetch stats for each project
      const projectsWithStats = await Promise.all(
        data.projects.map(async (project: Project) => {
          // Fetch logs count
          const logsRes = await fetch(`/api/logs?projectId=${project.id}`);
          const logsData = logsRes.ok ? await logsRes.json() : { logs: [] };
          
          // Fetch goals count
          const goalsRes = await fetch(`/api/goals?projectId=${project.id}`);
          const goalsData = goalsRes.ok ? await goalsRes.json() : { goals: [] };
          
          // Fetch weekly reviews count
          const reviewsRes = await fetch(`/api/weekly?projectId=${project.id}`);
          const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] };

          // Fetch investor updates count
          const updatesRes = await fetch(`/api/investor-updates?projectId=${project.id}`);
          const updatesData = updatesRes.ok ? await updatesRes.json() : { updates: [] };

          return {
            ...project,
            logs_count: logsData.logs?.length || 0,
            goals_count: goalsData.goals?.length || 0,
            reviews_count: reviewsData.reviews?.length || 0,
            updates_count: updatesData.updates?.length || 0,
          };
        })
      );
      
      setProjects(projectsWithStats);
    } catch (err: any) {
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = await res.json();
      setProjects([data.project, ...projects]);
      setNewProjectName("");
      setDialogOpen(false);
      toast.success("Project created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const checkOnboardingNeeded = async (mode: 'founder' | 'personal', project: Project | null) => {
    if (mode !== 'personal' || !project || onboardingChecked) return;
    
    try {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      const hasCompletedOnboarding = user?.user_metadata?.onboarding_completed;
      
      if (!hasCompletedOnboarding && project.name === 'Personal') {
        // Check if user has any personal entries, habits, or routine runs
        const [entriesRes, habitsRes] = await Promise.all([
          fetch(`/api/personal-entries?projectId=${project.id}`),
          fetch(`/api/habits?projectId=${project.id}`)
        ]);
        
        const entriesData = entriesRes.ok ? await entriesRes.json() : { entries: [] };
        const habitsData = habitsRes.ok ? await habitsRes.json() : { habits: [] };
        
        const hasContent = (entriesData.entries?.length > 0) || (habitsData.habits?.length > 0);
        
        if (!hasContent) {
          setShowOnboarding(true);
        }
      }
      
      setOnboardingChecked(true);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setOnboardingChecked(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh the page to show the new content
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">Founder Diary</h1>
              <ModeSelector 
                onModeChange={(mode, project) => {
                  setCurrentMode(mode);
                  setSelectedProject(project);
                  checkOnboardingNeeded(mode, project);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600 mt-1">Track your founder journey and make progress every day.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Keyboard className="w-4 h-4" />
            <span>Press</span>
            <Badge variant="outline" className="font-mono">⌘K</Badge>
            <span>for quick actions</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Startup"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>Welcome to Founder Diary</CardTitle>
              <CardDescription>Create your first project to start logging your founder journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={createProject} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="My Startup"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Project"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Modern Dashboard Widgets */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                {currentMode === 'personal' ? (
                  <>
                    <Heart className="w-6 h-6 text-pink-500" />
                    Personal Life OS
                  </>
                ) : (
                  <>
                    <Briefcase className="w-6 h-6 text-blue-500" />
                    Founder Tools
                  </>
                )}
              </h2>
              <DashboardWidgets 
                projectId={selectedProject?.id || ''} 
                mode={currentMode} 
              />
            </div>

            {/* Projects */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {project.name}
                        <span className="text-xs text-gray-500">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </CardTitle>
                      <CardDescription>/{project.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{project.logs_count || 0} logs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span>{project.goals_count || 0} goals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span>{project.reviews_count || 0} reviews</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span>{project.updates_count || 0} updates</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Link href="/logs">
                          <Button variant="outline" size="sm" className="w-full">
                            Add Log
                          </Button>
                        </Link>
                        <Link href="/goals">
                          <Button variant="outline" size="sm" className="w-full">
                            Set Goals
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Onboarding Wizard */}
      {showOnboarding && selectedProject && (
        <OnboardingWizard
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
          projectId={selectedProject.id}
        />
      )}
    </div>
  );
}
