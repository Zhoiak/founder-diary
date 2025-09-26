"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, Calendar, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

interface KeyResult {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

interface Goal {
  id: string;
  objective: string;
  due_date?: string;
  created_at: string;
  key_results: KeyResult[];
}

interface Project {
  id: string;
  name: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [newKRValue, setNewKRValue] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    objective: "",
    due_date: "",
    key_results: [{ name: "", target: "", unit: "" }],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchGoals();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/goals?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load goals");
    }
  };

  const resetForm = () => {
    setFormData({
      objective: "",
      due_date: "",
      key_results: [{ name: "", target: "", unit: "" }],
    });
  };

  const addKeyResult = () => {
    setFormData({
      ...formData,
      key_results: [...formData.key_results, { name: "", target: "", unit: "" }],
    });
  };

  const removeKeyResult = (index: number) => {
    setFormData({
      ...formData,
      key_results: formData.key_results.filter((_, i) => i !== index),
    });
  };

  const updateKeyResult = (index: number, field: string, value: string) => {
    const updated = [...formData.key_results];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, key_results: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const payload = {
      projectId: selectedProject,
      objective: formData.objective,
      due_date: formData.due_date || undefined,
      key_results: formData.key_results
        .filter(kr => kr.name.trim())
        .map(kr => ({
          name: kr.name.trim(),
          target: kr.target ? parseFloat(kr.target) : undefined,
          unit: kr.unit?.trim() || undefined,
        })),
    };

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      const data = await res.json();
      setGoals([data.goal, ...goals]);
      resetForm();
      setDialogOpen(false);
      toast.success("Goal created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create goal");
    }
  };

  const updateKeyResultProgress = async (kr: KeyResult, newValue: number) => {
    try {
      const res = await fetch(`/api/key-results/${kr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: newValue }),
      });
      if (!res.ok) throw new Error("Failed to update key result");
      
      // Update local state
      setGoals(goals.map(goal => ({
        ...goal,
        key_results: goal.key_results.map(keyResult =>
          keyResult.id === kr.id ? { ...keyResult, current: newValue } : keyResult
        ),
      })));
      
      setKrDialogOpen(false);
      setEditingKR(null);
      setNewKRValue("");
      toast.success("Progress updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update progress");
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete goal");
      
      setGoals(goals.filter(goal => goal.id !== goalId));
      toast.success("Goal deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete goal");
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Goals & OKRs</h1>
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
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="objective">Objective</Label>
                      <Textarea
                        id="objective"
                        value={formData.objective}
                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                        placeholder="Launch MVP and achieve product-market fit"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date (optional)</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Key Results</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addKeyResult}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add KR
                        </Button>
                      </div>
                      {formData.key_results.map((kr, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-6">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={kr.name}
                              onChange={(e) => updateKeyResult(index, "name", e.target.value)}
                              placeholder="Acquire paying customers"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Target</Label>
                            <Input
                              type="number"
                              value={kr.target}
                              onChange={(e) => updateKeyResult(index, "target", e.target.value)}
                              placeholder="100"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={kr.unit}
                              onChange={(e) => updateKeyResult(index, "unit", e.target.value)}
                              placeholder="customers"
                            />
                          </div>
                          <div className="col-span-1">
                            {formData.key_results.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeKeyResult(index)}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button type="submit" className="w-full">
                      Create Goal
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
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Project Selected</CardTitle>
              <CardDescription>Please select a project to view goals</CardDescription>
            </CardHeader>
          </Card>
        ) : goals.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Goals Yet</CardTitle>
              <CardDescription>Set your first objective and key results to track progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Target className="w-4 h-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        {goal.objective}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(goal.created_at).toLocaleDateString()}
                        </span>
                        {goal.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(goal.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.key_results.length === 0 ? (
                    <p className="text-gray-500 italic">No key results defined</p>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Key Results</h4>
                      {goal.key_results.map((kr) => {
                        const percentage = getProgressPercentage(kr.current, kr.target);
                        return (
                          <div key={kr.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{kr.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {kr.current} / {kr.target} {kr.unit}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingKR(kr);
                                    setNewKRValue(kr.current.toString());
                                    setKrDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{percentage.toFixed(1)}% complete</span>
                              {percentage >= 100 && <span className="text-green-600 font-medium">✓ Completed</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Key Result Update Dialog */}
        <Dialog open={krDialogOpen} onOpenChange={setKrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
            </DialogHeader>
            {editingKR && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{editingKR.name}</Label>
                  <p className="text-xs text-gray-500">
                    Target: {editingKR.target} {editingKR.unit}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current">Current Progress</Label>
                  <Input
                    id="current"
                    type="number"
                    value={newKRValue}
                    onChange={(e) => setNewKRValue(e.target.value)}
                    placeholder={editingKR.current.toString()}
                  />
                </div>
                <Button
                  onClick={() => updateKeyResultProgress(editingKR, parseFloat(newKRValue))}
                  className="w-full"
                  disabled={!newKRValue || isNaN(parseFloat(newKRValue))}
                >
                  Update Progress
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
