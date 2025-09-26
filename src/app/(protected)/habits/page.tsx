"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Plus, ArrowLeft, Target, CheckCircle, Circle, 
  Flame, Calendar, TrendingUp, MoreHorizontal,
  Zap, Award, Clock
} from "lucide-react";
import Link from "next/link";

interface Habit {
  id: string;
  title: string;
  description?: string;
  schedule?: string;
  target_per_week: number;
  color: string;
  icon: string;
  current_streak: number;
  this_week_count: number;
  completion_rate: number;
  life_areas?: {
    key: string;
    label: string;
    color: string;
    icon: string;
  };
}

interface LifeArea {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  done: boolean;
  note?: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_per_week: 7,
    area_id: "",
    color: "#10B981",
    icon: "✅"
  });

  // Today's date for quick logging
  const today = new Date().toISOString().split('T')[0];
  const [todayLogs, setTodayLogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAreas();
      fetchHabits();
      fetchTodayLogs();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
      
      // Look for "Personal" project or use first project
      const personalProject = data.projects?.find((p: Project) => p.name === "Personal");
      if (personalProject) {
        setSelectedProject(personalProject.id);
      } else if (data.projects?.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/personal/areas?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      const data = await res.json();
      setAreas(data.areas || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load life areas");
    }
  };

  const fetchHabits = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/habits?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      setHabits(data.habits || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load habits");
    }
  };

  const fetchTodayLogs = async () => {
    if (!selectedProject) return;
    
    const logs: Record<string, boolean> = {};
    
    // Fetch today's logs for all habits
    await Promise.all(habits.map(async (habit) => {
      try {
        const res = await fetch(`/api/habits/${habit.id}/log?from=${today}&to=${today}`);
        if (res.ok) {
          const data = await res.json();
          const todayLog = data.logs?.find((log: HabitLog) => log.date === today);
          logs[habit.id] = todayLog?.done || false;
        }
      } catch (err) {
        console.error(`Failed to fetch logs for habit ${habit.id}:`, err);
      }
    }));
    
    setTodayLogs(logs);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_per_week: 7,
      area_id: "",
      color: "#10B981",
      icon: "✅"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          title: formData.title,
          description: formData.description || undefined,
          target_per_week: formData.target_per_week,
          area_id: formData.area_id || undefined,
          color: formData.color,
          icon: formData.icon,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create habit");
      }
      
      const data = await res.json();
      setHabits([...habits, { ...data.habit, current_streak: 0, this_week_count: 0, completion_rate: 0 }]);
      resetForm();
      setDialogOpen(false);
      toast.success("Habit created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create habit");
    } finally {
      setCreating(false);
    }
  };

  const toggleHabitToday = async (habitId: string) => {
    const currentStatus = todayLogs[habitId] || false;
    const newStatus = !currentStatus;

    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          done: newStatus,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to log habit");
      
      setTodayLogs({ ...todayLogs, [habitId]: newStatus });
      
      // Refresh habits to update streaks
      fetchHabits();
      
      toast.success(newStatus ? "Habit completed! 🎉" : "Habit unmarked");
    } catch (err: any) {
      toast.error(err.message || "Failed to log habit");
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600";
    if (streak >= 14) return "text-blue-600";
    if (streak >= 7) return "text-green-600";
    if (streak >= 3) return "text-yellow-600";
    return "text-gray-600";
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 100) return "bg-green-500";
    if (rate >= 80) return "bg-blue-500";
    if (rate >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Habits Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Habit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Habit</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Habit Name</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Morning meditation, Daily exercise"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What does this habit involve?"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="target">Target per week</Label>
                        <Select 
                          value={formData.target_per_week.toString()} 
                          onValueChange={(value) => setFormData({ ...formData, target_per_week: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? 'day' : 'days'} per week
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="area">Life Area</Label>
                        <Select value={formData.area_id || "no-area"} onValueChange={(value) => setFormData({ ...formData, area_id: value === "no-area" ? "" : value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-area">No area</SelectItem>
                            {areas.map(area => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.icon} {area.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon">Icon</Label>
                        <Input
                          id="icon"
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          placeholder="✅"
                          maxLength={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Habit"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to start tracking your habits.
              </p>
            </CardContent>
          </Card>
        ) : habits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Habits Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Start building positive habits to improve your daily life.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Today's Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Habits
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <Button
                          variant={todayLogs[habit.id] ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleHabitToday(habit.id)}
                          className="w-10 h-10 p-0"
                          style={{ 
                            backgroundColor: todayLogs[habit.id] ? habit.color : 'transparent',
                            borderColor: habit.color 
                          }}
                        >
                          {todayLogs[habit.id] ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </Button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{habit.icon}</span>
                            <span className="font-medium">{habit.title}</span>
                          </div>
                          {habit.life_areas && (
                            <Badge 
                              variant="outline" 
                              className="text-xs mt-1"
                              style={{ borderColor: habit.life_areas.color }}
                            >
                              {habit.life_areas.icon} {habit.life_areas.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${getStreakColor(habit.current_streak)}`}>
                          <Flame className="w-4 h-4" />
                          <span className="font-bold">{habit.current_streak}</span>
                        </div>
                        <div className="text-xs text-gray-500">day streak</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Habits Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => (
                <Card key={habit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{habit.title}</CardTitle>
                          {habit.description && (
                            <CardDescription className="text-sm mt-1">
                              {habit.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* This Week Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">This Week</span>
                        <span className="text-sm text-gray-600">
                          {habit.this_week_count}/{habit.target_per_week}
                        </span>
                      </div>
                      <Progress 
                        value={habit.completion_rate} 
                        className="h-2"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {habit.completion_rate}% complete
                        </span>
                        <Badge 
                          className={`text-xs ${getCompletionColor(habit.completion_rate)}`}
                        >
                          {habit.completion_rate >= 100 ? 'Goal Met!' : 
                           habit.completion_rate >= 80 ? 'On Track' : 
                           habit.completion_rate >= 60 ? 'Behind' : 'Needs Focus'}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 ${getStreakColor(habit.current_streak)}`}>
                          <Flame className="w-4 h-4" />
                          <span className="font-bold text-lg">{habit.current_streak}</span>
                        </div>
                        <div className="text-xs text-gray-500">Current Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Target className="w-4 h-4" />
                          <span className="font-bold text-lg">{habit.target_per_week}</span>
                        </div>
                        <div className="text-xs text-gray-500">Weekly Goal</div>
                      </div>
                    </div>

                    {/* Life Area */}
                    {habit.life_areas && (
                      <Badge 
                        className="w-full justify-center"
                        style={{ 
                          backgroundColor: habit.life_areas.color + '20', 
                          color: habit.life_areas.color,
                          borderColor: habit.life_areas.color 
                        }}
                      >
                        {habit.life_areas.icon} {habit.life_areas.label}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
