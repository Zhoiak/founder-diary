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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Plus, ArrowLeft, Sunrise, Moon, CheckCircle, Circle, 
  Clock, Target, Zap, Coffee, Bed, Play, Pause,
  MoreHorizontal, Calendar, TrendingUp, Award
} from "lucide-react";
import Link from "next/link";

interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening';
  description?: string;
  target_duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  routine_steps?: RoutineStep[];
}

interface RoutineStep {
  id: string;
  routine_id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  order_index: number;
  is_required: boolean;
}

interface RoutineLog {
  id: string;
  routine_id: string;
  date: string;
  completed_at?: string;
  duration_minutes?: number;
  completion_rate: number;
  notes?: string;
  step_logs?: Array<{
    step_id: string;
    completed: boolean;
    duration_minutes?: number;
  }>;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  
  // Today's logs
  const today = new Date().toISOString().split('T')[0];
  const [todayLogs, setTodayLogs] = useState<Record<string, RoutineLog>>({});
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    type: "morning" as 'morning' | 'evening',
    description: "",
    target_duration_minutes: 30,
    steps: [
      { title: "", description: "", duration_minutes: 5, is_required: true }
    ]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchRoutines();
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

  const fetchRoutines = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/personal/routines?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch routines");
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load routines");
    }
  };

  const fetchTodayLogs = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/personal/routines/logs?projectId=${selectedProject}&date=${today}`);
      if (res.ok) {
        const data = await res.json();
        const logsMap: Record<string, RoutineLog> = {};
        data.logs?.forEach((log: RoutineLog) => {
          logsMap[log.routine_id] = log;
        });
        setTodayLogs(logsMap);
      }
    } catch (err) {
      console.error("Failed to fetch today's logs:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "morning",
      description: "",
      target_duration_minutes: 30,
      steps: [
        { title: "", description: "", duration_minutes: 5, is_required: true }
      ]
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: "", description: "", duration_minutes: 5, is_required: true }]
    });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData({
        ...formData,
        steps: formData.steps.filter((_, i) => i !== index)
      });
    }
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/personal/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          target_duration_minutes: formData.target_duration_minutes,
          steps: formData.steps.filter(step => step.title.trim())
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create routine");
      }
      
      const data = await res.json();
      setRoutines([...routines, data.routine]);
      resetForm();
      setDialogOpen(false);
      toast.success("Routine created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create routine");
    } finally {
      setCreating(false);
    }
  };

  const startRoutine = async (routineId: string) => {
    try {
      const res = await fetch(`/api/personal/routines/${routineId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today })
      });
      
      if (!res.ok) throw new Error("Failed to start routine");
      
      fetchTodayLogs();
      toast.success("Routine started! 🌅");
    } catch (err: any) {
      toast.error(err.message || "Failed to start routine");
    }
  };

  const completeRoutine = async (routineId: string, notes?: string) => {
    try {
      const res = await fetch(`/api/personal/routines/${routineId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date: today,
          notes: notes || undefined
        })
      });
      
      if (!res.ok) throw new Error("Failed to complete routine");
      
      fetchTodayLogs();
      toast.success("Routine completed! ✨");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete routine");
    }
  };

  const getRoutinesByType = (type: 'morning' | 'evening') => {
    return routines.filter(routine => routine.type === type && routine.is_active);
  };

  const getRoutineStatus = (routine: Routine) => {
    const log = todayLogs[routine.id];
    if (!log) return 'not_started';
    if (log.completed_at) return 'completed';
    return 'in_progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Daily Routines</h1>
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
                    New Routine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Routine</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Routine Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Morning Energizer, Evening Wind-down"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={(value: 'morning' | 'evening') => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">
                              <div className="flex items-center gap-2">
                                <Sunrise className="w-4 h-4 text-orange-500" />
                                Morning Routine
                              </div>
                            </SelectItem>
                            <SelectItem value="evening">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-purple-500" />
                                Evening Routine
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What does this routine help you achieve?"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Target Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="120"
                        value={formData.target_duration_minutes}
                        onChange={(e) => setFormData({ ...formData, target_duration_minutes: parseInt(e.target.value) })}
                      />
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Routine Steps</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addStep}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Step
                        </Button>
                      </div>
                      
                      {formData.steps.map((step, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Step {index + 1}</Label>
                              {formData.steps.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeStep(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={step.title}
                                onChange={(e) => updateStep(index, 'title', e.target.value)}
                                placeholder="Step title (e.g., Meditation)"
                                required
                              />
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                value={step.duration_minutes}
                                onChange={(e) => updateStep(index, 'duration_minutes', parseInt(e.target.value))}
                                placeholder="Duration (min)"
                              />
                            </div>
                            
                            <Input
                              value={step.description}
                              onChange={(e) => updateStep(index, 'description', e.target.value)}
                              placeholder="Description (optional)"
                            />
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={step.is_required}
                                onCheckedChange={(checked) => updateStep(index, 'is_required', checked)}
                              />
                              <Label className="text-sm">Required step</Label>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Routine"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('morning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'morning'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sunrise className="w-4 h-4" />
                Morning Routines
              </div>
            </button>
            <button
              onClick={() => setActiveTab('evening')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evening'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Evening Routines
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to start building your daily routines.
              </p>
            </CardContent>
          </Card>
        ) : getRoutinesByType(activeTab).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {activeTab === 'morning' ? (
                <Sunrise className="w-12 h-12 text-orange-400 mb-4" />
              ) : (
                <Moon className="w-12 h-12 text-purple-400 mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab === 'morning' ? 'Morning' : 'Evening'} Routines
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Create a {activeTab} routine to structure your day and build consistency.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First {activeTab === 'morning' ? 'Morning' : 'Evening'} Routine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getRoutinesByType(activeTab).map((routine) => {
              const status = getRoutineStatus(routine);
              const log = todayLogs[routine.id];
              
              return (
                <Card key={routine.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {activeTab === 'morning' ? (
                            <Sunrise className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Moon className="w-5 h-5 text-purple-500" />
                          )}
                          {routine.name}
                          <Badge className={getStatusColor(status)}>
                            {getStatusIcon(status)}
                            <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
                          </Badge>
                        </CardTitle>
                        {routine.description && (
                          <CardDescription className="mt-2">
                            {routine.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    {log && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">
                            {log.completion_rate}%
                          </span>
                        </div>
                        <Progress value={log.completion_rate} className="h-2" />
                      </div>
                    )}

                    {/* Steps */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Steps</Label>
                      <div className="space-y-1">
                        {routine.routine_steps?.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span className="flex-1">{step.title}</span>
                            <span className="text-gray-500">{step.duration_minutes}min</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-bold text-lg">{routine.target_duration_minutes}</span>
                        </div>
                        <div className="text-xs text-gray-500">Target Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Target className="w-4 h-4" />
                          <span className="font-bold text-lg">{routine.routine_steps?.length || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">Steps</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {status === 'not_started' && (
                        <Button 
                          onClick={() => startRoutine(routine.id)}
                          className="flex-1"
                          variant={activeTab === 'morning' ? 'default' : 'secondary'}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Routine
                        </Button>
                      )}
                      {status === 'in_progress' && (
                        <Button 
                          onClick={() => completeRoutine(routine.id)}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      {status === 'completed' && (
                        <Button variant="outline" className="flex-1" disabled>
                          <Award className="w-4 h-4 mr-2" />
                          Completed Today
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
