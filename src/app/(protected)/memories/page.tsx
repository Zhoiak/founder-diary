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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, ArrowLeft, Camera, MapPin, Calendar, Heart, 
  Star, Clock, Gift, Image, Album, Map, Filter,
  Upload, Eye, EyeOff, Trash2, Edit, Share2
} from "lucide-react";
import Link from "next/link";

interface Memory {
  id: string;
  title: string;
  description?: string;
  memory_date: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  mood?: number;
  is_favorite: boolean;
  is_private: boolean;
  tags: string[];
  created_at: string;
  photo_count?: number;
}

interface MemoryCollection {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  memory_count: number;
  cover_photo?: string;
  created_at: string;
}

interface TimeCapsule {
  id: string;
  title: string;
  content: string;
  scheduled_delivery_date: string;
  is_delivered: boolean;
  memory_ids: string[];
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const moodEmojis = {
  1: "😢",
  2: "😕", 
  3: "😐",
  4: "😊",
  5: "😄"
};

const moodLabels = {
  1: "Sad",
  2: "Down",
  3: "Neutral", 
  4: "Happy",
  5: "Joyful"
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [collections, setCollections] = useState<MemoryCollection[]>([]);
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'memories' | 'collections' | 'capsules'>('memories');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [filterTag, setFilterTag] = useState<string>("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    memory_date: new Date().toISOString().split('T')[0],
    location_name: "",
    mood: 3,
    is_favorite: false,
    is_private: false,
    tags: [] as string[],
    tagInput: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMemories();
      fetchCollections();
      fetchTimeCapsules();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
      
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

  const fetchMemories = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/memories?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch memories");
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load memories");
    }
  };

  const fetchCollections = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/memories/collections?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch collections");
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err: any) {
      console.error("Failed to load collections:", err);
    }
  };

  const fetchTimeCapsules = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/memories/time-capsules?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch time capsules");
      const data = await res.json();
      setTimeCapsules(data.capsules || []);
    } catch (err: any) {
      console.error("Failed to load time capsules:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          ...formData,
          tags: formData.tags
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create memory");
      }
      
      const data = await res.json();
      setMemories([data.memory, ...memories]);
      setFormData({
        title: "",
        description: "",
        memory_date: new Date().toISOString().split('T')[0],
        location_name: "",
        mood: 3,
        is_favorite: false,
        is_private: false,
        tags: [],
        tagInput: ""
      });
      setDialogOpen(false);
      toast.success("Memory created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create memory");
    } finally {
      setCreating(false);
    }
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ""
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const toggleFavorite = async (memoryId: string, currentFavorite: boolean) => {
    try {
      const res = await fetch(`/api/memories/${memoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !currentFavorite }),
      });
      
      if (!res.ok) throw new Error("Failed to update memory");
      
      setMemories(memories.map(memory => 
        memory.id === memoryId 
          ? { ...memory, is_favorite: !currentFavorite }
          : memory
      ));
      
      toast.success(!currentFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (err: any) {
      toast.error(err.message || "Failed to update memory");
    }
  };

  const filteredMemories = filterTag 
    ? memories.filter(memory => memory.tags.includes(filterTag))
    : memories;

  const allTags = Array.from(new Set(memories.flatMap(memory => memory.tags)));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Memories & Photos</h1>
                <p className="text-sm text-gray-600 mt-1">Capture and preserve your precious moments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-48 bg-white/50">
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
                  <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Memory
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Memory</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="My amazing day..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="memory_date">Date</Label>
                        <Input
                          id="memory_date"
                          type="date"
                          value={formData.memory_date}
                          onChange={(e) => setFormData({ ...formData, memory_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tell the story of this memory..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location_name}
                          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                          placeholder="Where did this happen?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mood">Mood</Label>
                        <Select value={formData.mood.toString()} onValueChange={(value) => setFormData({ ...formData, mood: parseInt(value) })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(moodEmojis).map(([value, emoji]) => (
                              <SelectItem key={value} value={value}>
                                {emoji} {moodLabels[value as keyof typeof moodLabels]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.tagInput}
                          onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_favorite}
                          onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                          className="rounded"
                        />
                        <Star className="w-4 h-4" />
                        Favorite
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_private}
                          onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                          className="rounded"
                        />
                        <EyeOff className="w-4 h-4" />
                        Private
                      </label>
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Creating..." : "Create Memory"}
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
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Your Memory Project</h3>
              <p className="text-gray-600 text-center max-w-md">
                Select a project above to start capturing and organizing your precious memories.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="grid w-fit grid-cols-3 bg-white/60 backdrop-blur-sm">
                  <TabsTrigger value="memories" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Memories ({memories.length})
                  </TabsTrigger>
                  <TabsTrigger value="collections" className="flex items-center gap-2">
                    <Album className="w-4 h-4" />
                    Collections ({collections.length})
                  </TabsTrigger>
                  <TabsTrigger value="capsules" className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Time Capsules ({timeCapsules.length})
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'memories' && (
                  <div className="flex items-center gap-3">
                    {allTags.length > 0 && (
                      <Select value={filterTag} onValueChange={setFilterTag}>
                        <SelectTrigger className="w-40 bg-white/60">
                          <SelectValue placeholder="Filter by tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All tags</SelectItem>
                          {allTags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
                      className="bg-white/60"
                    >
                      {viewMode === 'grid' ? <Clock className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="memories" className="space-y-6">
                {filteredMemories.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                        <Camera className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">No Memories Yet</h3>
                      <p className="text-gray-600 text-center mb-6 max-w-md">
                        Start capturing your precious moments and create lasting memories.
                      </p>
                      <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Memory
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredMemories.map((memory) => (
                      <Card key={memory.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                  <Camera className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="truncate">{memory.title}</span>
                              </CardTitle>
                              <CardDescription className="mt-2 flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(memory.memory_date).toLocaleDateString()}
                                </span>
                                {memory.location_name && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {memory.location_name}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {memory.mood && (
                                <span className="text-lg" title={moodLabels[memory.mood as keyof typeof moodLabels]}>
                                  {moodEmojis[memory.mood as keyof typeof moodEmojis]}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavorite(memory.id, memory.is_favorite)}
                                className={memory.is_favorite ? "text-yellow-500" : "text-gray-400"}
                              >
                                <Star className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
                              </Button>
                              {memory.is_private && (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {memory.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">{memory.description}</p>
                          )}
                          
                          {memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                            <span>Created {new Date(memory.created_at).toLocaleDateString()}</span>
                            {memory.photo_count && (
                              <span className="flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                {memory.photo_count} photos
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="collections" className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                      <Album className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Memory Collections</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      Organize your memories into beautiful collections and albums.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="capsules" className="space-y-6">
                {timeCapsules.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                        <Gift className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">No Time Capsules Yet</h3>
                      <p className="text-gray-600 text-center mb-6 max-w-md">
                        Create time capsules to send messages to your future self.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {timeCapsules.map((capsule) => (
                      <Card key={capsule.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <Gift className="w-5 h-5 text-purple-600" />
                            {capsule.title}
                          </CardTitle>
                          <CardDescription>
                            {capsule.is_delivered ? "Delivered" : `Scheduled for ${new Date(capsule.scheduled_delivery_date).toLocaleDateString()}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-3">{capsule.content}</p>
                          <div className="mt-4 text-xs text-gray-500">
                            Created {new Date(capsule.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
