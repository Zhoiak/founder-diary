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
import { toast } from "sonner";
import { Plus, ArrowLeft, FileText, CheckCircle, Clock, XCircle, Edit, Trash2, Lightbulb } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { TemplateSelector } from "@/components/template-selector";
import { Template } from "@/lib/templates";

interface Decision {
  id: string;
  title: string;
  context_md?: string;
  options_md?: string;
  decision_md?: string;
  consequences_md?: string;
  status: 'proposed' | 'accepted' | 'superseded';
  relates_to: string[];
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const statusConfig = {
  proposed: { label: 'Proposed', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  superseded: { label: 'Superseded', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    context_md: "",
    options_md: "",
    decision_md: "",
    consequences_md: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchDecisions();
    }
  }, [selectedProject, selectedStatus]);

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

  const fetchDecisions = async () => {
    if (!selectedProject) return;
    
    try {
      const url = new URL("/api/decisions", window.location.origin);
      url.searchParams.set("projectId", selectedProject);
      if (selectedStatus !== "all") {
        url.searchParams.set("status", selectedStatus);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch decisions");
      const data = await res.json();
      setDecisions(data.decisions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load decisions");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      context_md: "",
      options_md: "",
      decision_md: "",
      consequences_md: "",
    });
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData({
      title: template.content.title || "",
      context_md: template.content.context_md || "",
      options_md: template.content.options_md || "",
      decision_md: template.content.decision_md || "",
      consequences_md: template.content.consequences_md || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          ...formData,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create decision");
      
      const data = await res.json();
      setDecisions([data.decision, ...decisions]);
      resetForm();
      setDialogOpen(false);
      toast.success("Decision created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create decision");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (decision: Decision) => {
    setEditingDecision({ ...decision });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDecision) return;

    try {
      const res = await fetch(`/api/decisions/${editingDecision.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingDecision.title,
          context_md: editingDecision.context_md,
          options_md: editingDecision.options_md,
          decision_md: editingDecision.decision_md,
          consequences_md: editingDecision.consequences_md,
          status: editingDecision.status,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update decision");
      
      const data = await res.json();
      setDecisions(decisions.map(d => d.id === editingDecision.id ? data.decision : d));
      setEditDialogOpen(false);
      setEditingDecision(null);
      toast.success("Decision updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update decision");
    }
  };

  const handleDelete = async (decisionId: string) => {
    if (!confirm("Are you sure you want to delete this decision? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete decision");
      
      setDecisions(decisions.filter(d => d.id !== decisionId));
      toast.success("Decision deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete decision");
    }
  };

  const updateStatus = async (decisionId: string, newStatus: Decision['status']) => {
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      const data = await res.json();
      setDecisions(decisions.map(d => d.id === decisionId ? data.decision : d));
      toast.success("Status updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
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
              <h1 className="text-2xl font-bold text-gray-900">Architectural Decisions</h1>
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Decision
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Architectural Decision Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Decision Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Use PostgreSQL for primary database"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="context">Context (Markdown)</Label>
                      <Textarea
                        id="context"
                        value={formData.context_md}
                        onChange={(e) => setFormData({ ...formData, context_md: e.target.value })}
                        placeholder="What is the issue that we're seeing that is motivating this decision or change?"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="options">Options Considered (Markdown)</Label>
                      <Textarea
                        id="options"
                        value={formData.options_md}
                        onChange={(e) => setFormData({ ...formData, options_md: e.target.value })}
                        placeholder="What are the different options we considered? List pros and cons."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decision">Decision (Markdown)</Label>
                      <Textarea
                        id="decision"
                        value={formData.decision_md}
                        onChange={(e) => setFormData({ ...formData, decision_md: e.target.value })}
                        placeholder="What is the change that we're proposing or have agreed to implement?"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="consequences">Consequences (Markdown)</Label>
                      <Textarea
                        id="consequences"
                        value={formData.consequences_md}
                        onChange={(e) => setFormData({ ...formData, consequences_md: e.target.value })}
                        placeholder="What becomes easier or more difficult to do and any risks introduced by this change?"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Decision"}
                      </Button>
                    </div>
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
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to view and manage architectural decisions.
              </p>
            </CardContent>
          </Card>
        ) : decisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Decisions Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Document important architectural and business decisions. Use templates for structured decision records.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <TemplateSelector 
                  category="decision" 
                  onSelectTemplate={handleTemplateSelect}
                  trigger={
                    <Button variant="outline">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  }
                />
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start from Scratch
                </Button>
              </div>
              
              {/* ADR Benefits */}
              <div className="mt-8 max-w-md">
                <h4 className="text-sm font-medium text-gray-900 mb-3">🎯 Why Document Decisions?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Track the reasoning behind important choices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>Help future team members understand context</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    <span>Avoid repeating the same discussions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Learn from past decisions and outcomes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {decisions.map((decision) => {
              const StatusIcon = statusConfig[decision.status].icon;
              return (
                <Card key={decision.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          {decision.title}
                          <Badge className={statusConfig[decision.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[decision.status].label}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Created: {new Date(decision.created_at).toLocaleDateString()}
                          {decision.updated_at !== decision.created_at && (
                            <span className="ml-4">
                              Updated: {new Date(decision.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {decision.status === 'proposed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatus(decision.id, 'accepted')}
                              className="text-green-600 hover:text-green-700"
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatus(decision.id, 'superseded')}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Supersede
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(decision)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(decision.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {decision.context_md && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Context</h4>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{decision.context_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {decision.options_md && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Options Considered</h4>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{decision.options_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {decision.decision_md && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Decision</h4>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{decision.decision_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {decision.consequences_md && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Consequences</h4>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{decision.consequences_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Decision</DialogTitle>
          </DialogHeader>
          {editingDecision && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Decision Title</Label>
                <Input
                  id="edit-title"
                  value={editingDecision.title}
                  onChange={(e) => setEditingDecision({ ...editingDecision, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingDecision.status} 
                  onValueChange={(value: Decision['status']) => setEditingDecision({ ...editingDecision, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="superseded">Superseded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-context">Context</Label>
                <Textarea
                  id="edit-context"
                  value={editingDecision.context_md || ""}
                  onChange={(e) => setEditingDecision({ ...editingDecision, context_md: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-options">Options</Label>
                <Textarea
                  id="edit-options"
                  value={editingDecision.options_md || ""}
                  onChange={(e) => setEditingDecision({ ...editingDecision, options_md: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-decision">Decision</Label>
                <Textarea
                  id="edit-decision"
                  value={editingDecision.decision_md || ""}
                  onChange={(e) => setEditingDecision({ ...editingDecision, decision_md: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-consequences">Consequences</Label>
                <Textarea
                  id="edit-consequences"
                  value={editingDecision.consequences_md || ""}
                  onChange={(e) => setEditingDecision({ ...editingDecision, consequences_md: e.target.value })}
                  rows={3}
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
