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
import { 
  Plus, ArrowLeft, Heart, Zap, Moon, MapPin, Camera, 
  Calendar, Filter, Search, Smile, Frown, Meh, 
  ChevronLeft, ChevronRight, Grid, List
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface PersonalEntry {
  id: string;
  date: string;
  title?: string;
  content_md?: string;
  tags: string[];
  mood?: number;
  energy?: number;
  sleep_hours?: number;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  photos: Array<{path: string; caption?: string; thumbnail?: string}>;
  is_private: boolean;
  created_at: string;
  personal_entry_areas?: Array<{
    life_areas: {
      key: string;
      label: string;
      color: string;
      icon: string;
    }
  }>;
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

const moodEmojis = {
  1: { emoji: "😢", label: "Terrible" },
  2: { emoji: "😕", label: "Bad" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "😊", label: "Good" },
  5: { emoji: "😄", label: "Amazing" }
};

const energyEmojis = {
  1: { emoji: "🔋", label: "Drained" },
  2: { emoji: "🔋", label: "Low" },
  3: { emoji: "🔋", label: "Moderate" },
  4: { emoji: "⚡", label: "High" },
  5: { emoji: "⚡", label: "Energized" }
};

export default function JournalPage() {
  const [entries, setEntries] = useState<PersonalEntry[]>([]);
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filters
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: "",
    content_md: "",
    tags: "",
    mood: "",
    energy: "",
    sleep_hours: "",
    location_name: "",
    is_private: false,
    area_ids: [] as string[]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAreas();
      fetchEntries();
    }
  }, [selectedProject, selectedArea, selectedTag, dateRange]);

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

  const fetchEntries = async () => {
    if (!selectedProject) return;
    
    try {
      const url = new URL("/api/personal/entries", window.location.origin);
      url.searchParams.set("projectId", selectedProject);
      url.searchParams.set("from", dateRange.from);
      url.searchParams.set("to", dateRange.to);
      if (selectedArea !== "all") url.searchParams.set("area", selectedArea);
      if (selectedTag) url.searchParams.set("tag", selectedTag);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load entries");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: "",
      content_md: "",
      tags: "",
      mood: "",
      energy: "",
      sleep_hours: "",
      location_name: "",
      is_private: false,
      area_ids: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setCreating(true);
    try {
      const res = await fetch("/api/personal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          date: formData.date,
          title: formData.title || undefined,
          content_md: formData.content_md || undefined,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          mood: formData.mood ? parseInt(formData.mood) : undefined,
          energy: formData.energy ? parseInt(formData.energy) : undefined,
          sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : undefined,
          location_name: formData.location_name || undefined,
          is_private: formData.is_private,
          area_ids: formData.area_ids,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create entry");
      }
      
      const data = await res.json();
      setEntries([data.entry, ...entries]);
      resetForm();
      setDialogOpen(false);
      toast.success("Journal entry created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create entry");
    } finally {
      setCreating(false);
    }
  };

  const getEntryAreas = (entry: PersonalEntry) => {
    return entry.personal_entry_areas?.map(ea => ea.life_areas) || [];
  };

  const getAllTags = () => {
    const allTags = entries.flatMap(entry => entry.tags);
    return [...new Set(allTags)].sort();
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
              <h1 className="text-2xl font-bold text-gray-900">Personal Journal</h1>
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
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Journal Entry</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Label htmlFor="title">Title (optional)</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="What's on your mind?"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content (Markdown)</Label>
                      <Textarea
                        id="content"
                        value={formData.content_md}
                        onChange={(e) => setFormData({ ...formData, content_md: e.target.value })}
                        placeholder="Write about your day, thoughts, experiences..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mood">Mood</Label>
                        <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="How are you feeling?" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(moodEmojis).map(([value, { emoji, label }]) => (
                              <SelectItem key={value} value={value}>
                                {emoji} {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="energy">Energy</Label>
                        <Select value={formData.energy} onValueChange={(value) => setFormData({ ...formData, energy: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Energy level?" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(energyEmojis).map(([value, { emoji, label }]) => (
                              <SelectItem key={value} value={value}>
                                {emoji} {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sleep">Sleep Hours</Label>
                        <Input
                          id="sleep"
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={formData.sleep_hours}
                          onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                          placeholder="8.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="gratitude, work, family"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location_name}
                          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                          placeholder="Home, Office, Café..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Life Areas</Label>
                      <div className="flex flex-wrap gap-2">
                        {areas.map(area => (
                          <Button
                            key={area.id}
                            type="button"
                            variant={formData.area_ids.includes(area.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newAreaIds = formData.area_ids.includes(area.id)
                                ? formData.area_ids.filter(id => id !== area.id)
                                : [...formData.area_ids, area.id];
                              setFormData({ ...formData, area_ids: newAreaIds });
                            }}
                          >
                            <span className="mr-1">{area.icon}</span>
                            {area.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="private"
                        checked={formData.is_private}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                      />
                      <Label htmlFor="private">Private entry (encrypted)</Label>
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Entry"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area.key} value={area.key}>
                    {area.icon} {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag || "all-tags"} onValueChange={(value) => setSelectedTag(value === "all-tags" ? "" : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-tags">All Tags</SelectItem>
                {getAllTags().map(tag => (
                  <SelectItem key={tag} value={tag}>
                    #{tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-36"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-36"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to start journaling your personal experiences.
              </p>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Entries Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Start your personal journaling journey. Capture your thoughts, mood, and daily experiences.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {entry.title || `Journal Entry`}
                        {entry.is_private && (
                          <Badge variant="secondary" className="text-xs">
                            🔒 Private
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        {entry.mood && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {moodEmojis[entry.mood as keyof typeof moodEmojis]?.emoji}
                          </span>
                        )}
                        {entry.energy && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            {energyEmojis[entry.energy as keyof typeof energyEmojis]?.emoji}
                          </span>
                        )}
                        {entry.sleep_hours && (
                          <span className="flex items-center gap-1">
                            <Moon className="w-4 h-4" />
                            {entry.sleep_hours}h
                          </span>
                        )}
                        {entry.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {entry.location_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {entry.content_md && (
                    <div className="prose prose-sm max-w-none mb-4">
                      <ReactMarkdown>{entry.content_md}</ReactMarkdown>
                    </div>
                  )}
                  
                  {/* Life Areas */}
                  {getEntryAreas(entry).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {getEntryAreas(entry).map((area) => (
                        <Badge 
                          key={area.key} 
                          style={{ backgroundColor: area.color + '20', color: area.color }}
                          className="text-xs"
                        >
                          {area.icon} {area.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
