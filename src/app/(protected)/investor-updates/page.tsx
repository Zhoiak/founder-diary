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
import { toast } from "sonner";
import { Plus, ArrowLeft, TrendingUp, Eye, EyeOff, Copy, ExternalLink, Edit, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface InvestorUpdate {
  id: string;
  month: number;
  year: number;
  content_md: string;
  ai_summary?: string;
  public_slug: string;
  is_public: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function InvestorUpdatesPage() {
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<InvestorUpdate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    content_md: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchUpdates();
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

  const fetchUpdates = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/investor-updates?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch updates");
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load updates");
    }
  };

  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      content_md: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setCreating(true);
    try {
      const res = await fetch("/api/investor-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          month: formData.month,
          year: formData.year,
          content_md: formData.content_md || undefined, // Let AI generate if empty
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create update");
      }
      
      const data = await res.json();
      setUpdates([data.update, ...updates]);
      resetForm();
      setDialogOpen(false);
      toast.success("Investor update created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create update");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (update: InvestorUpdate) => {
    setEditingUpdate({ ...update });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUpdate) return;

    try {
      const res = await fetch(`/api/investor-updates/${editingUpdate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_md: editingUpdate.content_md,
          is_public: editingUpdate.is_public,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update");
      
      const data = await res.json();
      setUpdates(updates.map(u => u.id === editingUpdate.id ? data.update : u));
      setEditDialogOpen(false);
      setEditingUpdate(null);
      toast.success("Update saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/investor-updates/${updateId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete update");
      
      setUpdates(updates.filter(u => u.id !== updateId));
      toast.success("Update deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete update");
    }
  };

  const togglePublic = async (update: InvestorUpdate) => {
    try {
      const res = await fetch(`/api/investor-updates/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_public: !update.is_public,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update visibility");
      
      const data = await res.json();
      setUpdates(updates.map(u => u.id === update.id ? data.update : u));
      toast.success(update.is_public ? "Update made private" : "Update made public");
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility");
    }
  };

  const copyPublicLink = (update: InvestorUpdate) => {
    const url = `${window.location.origin}/public/updates/${update.public_slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
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
              <h1 className="text-2xl font-bold text-gray-900">Investor Updates</h1>
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
                    New Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Monthly Investor Update</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="month">Month</Label>
                        <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((month, index) => (
                              <SelectItem key={index} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          min="2020"
                          max="2030"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content (Markdown) - Optional</Label>
                      <Textarea
                        id="content"
                        value={formData.content_md}
                        onChange={(e) => setFormData({ ...formData, content_md: e.target.value })}
                        placeholder="Leave empty to auto-generate from your daily logs and goals..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        💡 Leave empty to automatically generate content from your daily logs and goals for this month
                      </p>
                    </div>
                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Update"}
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
              <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to view and create investor updates.
              </p>
            </CardContent>
          </Card>
        ) : updates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first monthly investor update to keep stakeholders informed.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Update
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => (
              <Card key={update.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        {monthNames[update.month - 1]} {update.year}
                        <div className="flex items-center gap-2">
                          {update.is_public ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          {update.ai_summary && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Created: {new Date(update.created_at).toLocaleDateString()}
                        {update.ai_summary && (
                          <span className="block text-purple-600 text-sm mt-1">
                            {update.ai_summary}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublic(update)}
                      >
                        {update.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      {update.is_public && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPublicLink(update)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(update)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(update.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{update.content_md}</ReactMarkdown>
                  </div>
                  {update.is_public && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800 text-sm font-medium">
                          🌐 This update is publicly accessible
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/public/updates/${update.public_slug}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Public Page
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Investor Update</DialogTitle>
          </DialogHeader>
          {editingUpdate && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={editingUpdate.is_public}
                  onCheckedChange={(checked) => setEditingUpdate({ ...editingUpdate, is_public: checked })}
                />
                <Label htmlFor="public">Make this update publicly accessible</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content (Markdown)</Label>
                <Textarea
                  id="edit-content"
                  value={editingUpdate.content_md}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, content_md: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
