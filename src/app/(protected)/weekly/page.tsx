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
import { Plus, Calendar, ArrowLeft, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface WeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  content_md: string;
  ai_summary?: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

export default function WeeklyReviewsPage() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<WeeklyReview | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    week_start: "",
    week_end: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReviews();
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

  const fetchReviews = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/weekly?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reviews");
    }
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const generateCurrentWeek = () => {
    const { start, end } = getWeekDates(new Date());
    setFormData({ week_start: start, week_end: end });
  };

  const generateLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { start, end } = getWeekDates(lastWeek);
    setFormData({ week_start: start, week_end: end });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.week_start || !formData.week_end) return;

    setCreating(true);
    try {
      const res = await fetch("/api/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          week_start: formData.week_start,
          week_end: formData.week_end,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create weekly review");
      
      const data = await res.json();
      setReviews([data.review, ...reviews]);
      setFormData({ week_start: "", week_end: "" });
      setDialogOpen(false);
      toast.success("Weekly review generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create weekly review");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (review: WeeklyReview) => {
    setEditingReview({ ...review });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    try {
      const res = await fetch(`/api/weekly/${editingReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_md: editingReview.content_md,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update review");
      
      const data = await res.json();
      setReviews(reviews.map(r => r.id === editingReview.id ? data.review : r));
      setEditDialogOpen(false);
      setEditingReview(null);
      toast.success("Review updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update review");
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
              <h1 className="text-2xl font-bold text-gray-900">Weekly Reviews</h1>
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
                    Generate Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Weekly Review</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="week_start">Week Start</Label>
                        <Input
                          id="week_start"
                          type="date"
                          value={formData.week_start}
                          onChange={(e) => setFormData({ ...formData, week_start: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="week_end">Week End</Label>
                        <Input
                          id="week_end"
                          type="date"
                          value={formData.week_end}
                          onChange={(e) => setFormData({ ...formData, week_end: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={generateCurrentWeek}>
                        This Week
                      </Button>
                      <Button type="button" variant="outline" onClick={generateLastWeek}>
                        Last Week
                      </Button>
                    </div>
                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Generating..." : "Generate Review"}
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
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to view and generate weekly reviews.
              </p>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Reviews Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Generate your first weekly review to summarize your progress and insights.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate First Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Week of {new Date(review.week_start).toLocaleDateString()} - {new Date(review.week_end).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        {review.ai_summary && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Sparkles className="w-4 h-4" />
                            AI Summary Available
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(review)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {review.ai_summary && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Summary
                      </h4>
                      <p className="text-purple-800 text-sm">{review.ai_summary}</p>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{review.content_md}</ReactMarkdown>
                  </div>
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
            <DialogTitle>Edit Weekly Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content (Markdown)</Label>
                <Textarea
                  id="edit-content"
                  value={editingReview.content_md}
                  onChange={(e) => setEditingReview({ ...editingReview, content_md: e.target.value })}
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
