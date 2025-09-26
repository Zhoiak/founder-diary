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
import { Plus, Calendar, Tag, Clock, Smile, ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface DailyLog {
  id: string;
  date: string;
  title: string;
  content_md: string;
  tags: string[];
  mood?: number;
  time_spent_minutes?: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content_md: "",
    tags: "",
    mood: "",
    time_spent_minutes: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchLogs();
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

  const fetchLogs = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/logs?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load logs");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content_md: "",
      tags: "",
      mood: "",
      time_spent_minutes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditingLog(null);
    setPreviewMode(false);
  };

  const openEditDialog = (log: DailyLog) => {
    setEditingLog(log);
    setFormData({
      title: log.title,
      content_md: log.content_md,
      tags: log.tags.join(", "),
      mood: log.mood?.toString() || "",
      time_spent_minutes: log.time_spent_minutes?.toString() || "",
      date: log.date,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.title.trim()) return;

    // Validate time spent
    const timeSpent = formData.time_spent_minutes ? parseInt(formData.time_spent_minutes) : undefined;
    if (timeSpent && (timeSpent < 0 || timeSpent > 1440)) {
      toast.error("Time spent must be between 0 and 1440 minutes (24 hours)");
      return;
    }

    const payload = {
      projectId: selectedProject,
      title: formData.title.trim(),
      content_md: formData.content_md.trim(),
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      mood: formData.mood ? parseInt(formData.mood) : undefined,
      time_spent_minutes: timeSpent,
      date: formData.date,
    };

    try {
      if (editingLog) {
        const res = await fetch(`/api/logs/${editingLog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update log");
        const data = await res.json();
        setLogs(logs.map(log => log.id === editingLog.id ? data.log : log));
        toast.success("Log updated!");
      } else {
        const res = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create log");
        const data = await res.json();
        setLogs([data.log, ...logs]);
        toast.success("Log created!");
      }
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save log");
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    
    try {
      const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      setLogs(logs.filter(log => log.id !== logId));
      toast.success("Log deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete log");
    }
  };

  const getMoodEmoji = (mood?: number) => {
    const emojis = ["😢", "😕", "😐", "😊", "😄"];
    return mood ? emojis[mood - 1] : "😐";
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
              <h1 className="text-2xl font-bold text-gray-900">Daily Logs</h1>
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
                    New Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingLog ? "Edit Log" : "Create New Log"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mood">Mood (1-5)</Label>
                        <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mood" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">😢 1 - Terrible</SelectItem>
                            <SelectItem value="2">😕 2 - Bad</SelectItem>
                            <SelectItem value="3">😐 3 - Okay</SelectItem>
                            <SelectItem value="4">😊 4 - Good</SelectItem>
                            <SelectItem value="5">😄 5 - Great</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="What did you work on today?"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="development, meeting, planning"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time Spent (minutes)</Label>
                        <Input
                          id="time"
                          type="number"
                          min="0"
                          max="1440"
                          value={formData.time_spent_minutes}
                          onChange={(e) => setFormData({ ...formData, time_spent_minutes: e.target.value })}
                          placeholder="480"
                        />
                        <p className="text-xs text-gray-500">
                          Maximum 1440 minutes (24 hours) per day
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="content">Content (Markdown)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                        >
                          {previewMode ? "Edit" : "Preview"}
                        </Button>
                      </div>
                      {previewMode ? (
                        <div className="min-h-[200px] p-4 border rounded-md bg-white prose max-w-none">
                          <ReactMarkdown>{formData.content_md || "*No content to preview*"}</ReactMarkdown>
                        </div>
                      ) : (
                        <Textarea
                          id="content"
                          value={formData.content_md}
                          onChange={(e) => setFormData({ ...formData, content_md: e.target.value })}
                          placeholder="# Today's Progress&#10;&#10;- Completed feature X&#10;- Fixed bug Y&#10;- Met with team about Z&#10;&#10;## Challenges&#10;- Issue with API integration&#10;&#10;## Next Steps&#10;- Finish testing&#10;- Deploy to staging"
                          className="min-h-[200px] font-mono"
                        />
                      )}
                    </div>
                    <Button type="submit" className="w-full">
                      {editingLog ? "Update Log" : "Create Log"}
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
              <CardDescription>Please select a project to view logs</CardDescription>
            </CardHeader>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Logs Yet</CardTitle>
              <CardDescription>Start your founder journey by creating your first daily log</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Log
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <Card key={log.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {log.title}
                        {log.mood && (
                          <span className="text-lg">{getMoodEmoji(log.mood)}</span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        {log.time_spent_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.round(log.time_spent_minutes / 60)}h {log.time_spent_minutes % 60}m
                          </span>
                        )}
                        {log.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {log.tags.slice(0, 3).join(", ")}
                            {log.tags.length > 3 && ` +${log.tags.length - 3}`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(log)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(log.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{log.content_md}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
