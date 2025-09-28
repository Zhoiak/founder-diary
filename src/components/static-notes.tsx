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
import { 
  Plus, X, Edit, Pin, PinOff, Eye, EyeOff,
  Lightbulb, AlertTriangle, Info, CheckSquare, Bell
} from "lucide-react";

interface StaticNote {
  id: string;
  title?: string;
  content: string;
  note_type: 'reminder' | 'idea' | 'todo' | 'warning' | 'info';
  color: string;
  icon: string;
  priority: number;
  is_pinned: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface StaticNotesProps {
  moduleName: string;
  className?: string;
}

const noteTypeConfig = {
  reminder: { icon: Bell, label: "Reminder", defaultColor: "#FEF3C7", emoji: "🔔" },
  idea: { icon: Lightbulb, label: "Idea", defaultColor: "#DBEAFE", emoji: "💡" },
  todo: { icon: CheckSquare, label: "To Do", defaultColor: "#F3E8FF", emoji: "✅" },
  warning: { icon: AlertTriangle, label: "Warning", defaultColor: "#FEE2E2", emoji: "⚠️" },
  info: { icon: Info, label: "Info", defaultColor: "#ECFDF5", emoji: "ℹ️" }
};

export function StaticNotes({ moduleName, className = "" }: StaticNotesProps) {
  const [notes, setNotes] = useState<StaticNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StaticNote | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    note_type: "reminder" as keyof typeof noteTypeConfig,
    priority: 1
  });

  useEffect(() => {
    fetchNotes();
  }, [moduleName]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/static-notes?module=${moduleName}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      console.error("Error fetching static notes:", err);
      // Don't show error toast for notes, just fail silently
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      note_type: "reminder",
      priority: 1
    });
    setEditingNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setCreating(true);
    try {
      const url = editingNote ? `/api/static-notes/${editingNote.id}` : "/api/static-notes";
      const method = editingNote ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_name: moduleName,
          title: formData.title || undefined,
          content: formData.content,
          note_type: formData.note_type,
          priority: formData.priority,
          color: noteTypeConfig[formData.note_type].defaultColor,
          icon: noteTypeConfig[formData.note_type].emoji
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save note");
      }
      
      const data = await res.json();
      
      if (editingNote) {
        setNotes(notes.map(note => note.id === editingNote.id ? data.note : note));
        toast.success("Note updated!");
      } else {
        setNotes([data.note, ...notes]);
        toast.success("Note added!");
      }
      
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setCreating(false);
    }
  };

  const toggleVisibility = async (noteId: string, isVisible: boolean) => {
    try {
      const res = await fetch(`/api/static-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !isVisible })
      });
      
      if (!res.ok) throw new Error("Failed to update note");
      
      setNotes(notes.map(note => 
        note.id === noteId ? { ...note, is_visible: !isVisible } : note
      ));
    } catch (err: any) {
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/static-notes/${noteId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error("Failed to delete note");
      
      setNotes(notes.filter(note => note.id !== noteId));
      toast.success("Note deleted!");
    } catch (err: any) {
      toast.error("Failed to delete note");
    }
  };

  const startEdit = (note: StaticNote) => {
    setEditingNote(note);
    setFormData({
      title: note.title || "",
      content: note.content,
      note_type: note.note_type,
      priority: note.priority
    });
    setDialogOpen(true);
  };

  const visibleNotes = notes.filter(note => note.is_visible);

  if (loading || visibleNotes.length === 0) {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Personal Notes</h3>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingNote ? "Edit Note" : "Add Personal Note"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Note Type</Label>
                  <Select 
                    value={formData.note_type} 
                    onValueChange={(value: keyof typeof noteTypeConfig) => setFormData({ ...formData, note_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(noteTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.emoji}</span>
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Quick title for your note"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your note, reminder, or idea here..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          Priority {num} {num === 1 ? '(Highest)' : num === 5 ? '(Lowest)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Saving..." : editingNote ? "Update Note" : "Add Note"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Personal Notes</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Add Personal Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Note Type</Label>
                <Select 
                  value={formData.note_type} 
                  onValueChange={(value: keyof typeof noteTypeConfig) => setFormData({ ...formData, note_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(noteTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.emoji}</span>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Quick title for your note"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your note, reminder, or idea here..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Priority {num} {num === 1 ? '(Highest)' : num === 5 ? '(Lowest)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Saving..." : editingNote ? "Update Note" : "Add Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleNotes
          .sort((a, b) => a.priority - b.priority)
          .map((note) => (
            <Card 
              key={note.id} 
              className="border-l-4 shadow-sm hover:shadow-md transition-shadow"
              style={{ 
                borderLeftColor: note.color,
                backgroundColor: note.color + '40' // Add transparency
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{note.icon}</span>
                    {note.title && (
                      <CardTitle className="text-sm font-medium">{note.title}</CardTitle>
                    )}
                    <Badge variant="outline" className="text-xs">
                      P{note.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(note)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(note.id, note.is_visible)}
                      className="h-6 w-6 p-0"
                    >
                      <EyeOff className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <Badge variant="secondary" className="text-xs">
                    {noteTypeConfig[note.note_type].label}
                  </Badge>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
