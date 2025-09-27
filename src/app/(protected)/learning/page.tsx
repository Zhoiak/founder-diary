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
  Plus, ArrowLeft, BookOpen, Play, Pause, CheckCircle, 
  Clock, Star, Highlighter, Brain, Zap, RotateCcw,
  ExternalLink, Quote, Lightbulb, FileText, Headphones, GraduationCap
} from "lucide-react";
import Link from "next/link";

interface LearningItem {
  id: string;
  kind: 'book' | 'article' | 'podcast' | 'course' | 'video' | 'paper';
  title: string;
  author?: string;
  source_url?: string;
  status: 'want_to_read' | 'reading' | 'completed' | 'paused';
  rating?: number;
  highlights_count: number;
  reading_progress: number;
  created_at: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck_name: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review?: string;
}

interface FlashcardStats {
  total: number;
  due: number;
  new: number;
  learning: number;
  mature: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const kindIcons = {
  book: BookOpen,
  article: FileText,
  podcast: Headphones,
  course: GraduationCap,
  video: Play,
  paper: FileText
};

const statusColors = {
  want_to_read: "text-gray-500",
  reading: "text-blue-500", 
  completed: "text-green-500",
  paused: "text-yellow-500"
};

export default function LearningPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({ total: 0, due: 0, new: 0, learning: 0, mature: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'review'>('items');
  
  const [formData, setFormData] = useState({
    kind: "book" as const,
    title: "",
    author: "",
    source_url: "",
    status: "want_to_read" as const
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchItems();
      fetchFlashcards();
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

  const fetchItems = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/learning/items?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load learning items");
    }
  };

  const fetchFlashcards = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/flashcards?projectId=${selectedProject}&due=true`);
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
      setFlashcardStats(data.stats || { total: 0, due: 0, new: 0, learning: 0, mature: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to load flashcards");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/learning/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          ...formData,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create item");
      }
      
      const data = await res.json();
      setItems([{ ...data.item, highlights_count: 0, reading_progress: 0 }, ...items]);
      setFormData({ kind: "book", title: "", author: "", source_url: "", status: "want_to_read" });
      setDialogOpen(false);
      toast.success("Learning item added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  const startReview = () => {
    const dueCards = flashcards.filter(card => 
      !card.next_review || new Date(card.next_review) <= new Date()
    );
    
    if (dueCards.length === 0) {
      toast.info("No cards due for review!");
      return;
    }
    
    setCurrentCard(dueCards[0]);
    setShowAnswer(false);
    setReviewMode(true);
  };

  const reviewCard = async (rating: number) => {
    if (!currentCard) return;

    try {
      const res = await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      
      if (!res.ok) throw new Error("Failed to review card");
      
      // Get next card
      const remainingCards = flashcards.filter(card => 
        card.id !== currentCard.id && 
        (!card.next_review || new Date(card.next_review) <= new Date())
      );
      
      if (remainingCards.length > 0) {
        setCurrentCard(remainingCards[0]);
        setShowAnswer(false);
      } else {
        setReviewMode(false);
        setCurrentCard(null);
        toast.success("Review session complete! 🎉");
        fetchFlashcards(); // Refresh stats
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to review card");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learning & Flashcards</h1>
                <p className="text-sm text-gray-600 mt-1">Build your knowledge base and master concepts</p>
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
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Learning Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="kind">Type</Label>
                        <Select value={formData.kind} onValueChange={(value: any) => setFormData({ ...formData, kind: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="book">📚 Book</SelectItem>
                            <SelectItem value="article">📄 Article</SelectItem>
                            <SelectItem value="podcast">🎧 Podcast</SelectItem>
                            <SelectItem value="course">🎓 Course</SelectItem>
                            <SelectItem value="video">📹 Video</SelectItem>
                            <SelectItem value="paper">📋 Paper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="want_to_read">Want to Read</SelectItem>
                            <SelectItem value="reading">Currently Reading</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="The Lean Startup"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Eric Ries"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.source_url}
                        onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Adding..." : "Add Item"}
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
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Your Learning Project</h3>
              <p className="text-gray-600 text-center max-w-md">
                Select a project above to start managing your learning materials, highlights, and flashcards.
              </p>
            </CardContent>
          </Card>
        ) : reviewMode && currentCard ? (
          // Review Mode
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl">Flashcard Review</CardTitle>
                      <CardDescription className="text-sm">
                        {currentCard.deck_name} • {flashcardStats.due} cards remaining
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setReviewMode(false)} className="shrink-0">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Exit Review
                  </Button>
                </div>
                <Progress value={((flashcardStats.total - flashcardStats.due) / flashcardStats.total) * 100} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-center mb-4">
                      <Quote className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-lg font-medium text-gray-800 leading-relaxed">{currentCard.front}</p>
                  </div>
                  
                  {showAnswer && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl border border-green-100 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-center mb-4">
                        <Lightbulb className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">{currentCard.back}</p>
                    </div>
                  )}
                </div>

                {!showAnswer ? (
                  <Button onClick={() => setShowAnswer(true)} className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Show Answer
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600 font-medium">How well did you know this?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        variant="destructive" 
                        onClick={() => reviewCard(0)}
                        className="py-3 flex flex-col gap-1 h-auto"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-xs">Again</span>
                        <span className="text-xs opacity-75">&lt;1m</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => reviewCard(1)}
                        className="py-3 flex flex-col gap-1 h-auto border-orange-200 hover:bg-orange-50"
                      >
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-xs">Hard</span>
                        <span className="text-xs opacity-75">6m</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => reviewCard(2)}
                        className="py-3 flex flex-col gap-1 h-auto border-blue-200 hover:bg-blue-50"
                      >
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-xs">Good</span>
                        <span className="text-xs opacity-75">10m</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => reviewCard(3)}
                        className="py-3 flex flex-col gap-1 h-auto border-green-200 hover:bg-green-50"
                      >
                        <Zap className="w-4 h-4 text-green-500" />
                        <span className="text-xs">Easy</span>
                        <span className="text-xs opacity-75">4d</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Flashcard Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Flashcard Review</h3>
                    <p className="text-sm text-gray-600 font-normal">Master your knowledge with spaced repetition</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-red-100">
                    <div className="text-3xl font-bold text-red-500 mb-1">{flashcardStats.due}</div>
                    <div className="text-sm font-medium text-gray-700">Due Now</div>
                    <div className="text-xs text-gray-500">Ready to review</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-blue-100">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{flashcardStats.new}</div>
                    <div className="text-sm font-medium text-gray-700">New</div>
                    <div className="text-xs text-gray-500">Never studied</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-yellow-100">
                    <div className="text-3xl font-bold text-yellow-500 mb-1">{flashcardStats.learning}</div>
                    <div className="text-sm font-medium text-gray-700">Learning</div>
                    <div className="text-xs text-gray-500">In progress</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-green-100">
                    <div className="text-3xl font-bold text-green-500 mb-1">{flashcardStats.mature}</div>
                    <div className="text-sm font-medium text-gray-700">Mature</div>
                    <div className="text-xs text-gray-500">Well known</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-100">
                    <div className="text-3xl font-bold text-gray-600 mb-1">{flashcardStats.total}</div>
                    <div className="text-sm font-medium text-gray-700">Total</div>
                    <div className="text-xs text-gray-500">All cards</div>
                  </div>
                </div>
                <Button 
                  onClick={startReview} 
                  disabled={flashcardStats.due === 0}
                  className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700 shadow-md"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {flashcardStats.due > 0 ? `Start Review (${flashcardStats.due} due)` : 'No Cards Due'}
                </Button>
              </CardContent>
            </Card>

            {/* Learning Items */}
            {items.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your Learning Journey</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    Build your personal knowledge base by adding books, articles, podcasts, and other learning materials. Track your progress and create flashcards for better retention.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Learning Library</h2>
                  <div className="text-sm text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => {
                    const KindIcon = kindIcons[item.kind];
                    
                    return (
                      <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                  <KindIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="truncate">{item.title}</span>
                              </CardTitle>
                              {item.author && (
                                <CardDescription className="mt-2 text-sm">
                                  by {item.author}
                                </CardDescription>
                              )}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`${statusColors[item.status]} bg-white/60 border-0 shrink-0`}
                            >
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-gray-700">Reading Progress</span>
                              <span className="text-blue-600">{item.reading_progress}%</span>
                            </div>
                            <Progress 
                              value={item.reading_progress} 
                              className="h-2 bg-gray-100" 
                            />
                          </div>

                          {/* Stats */}
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Highlighter className="w-3 h-3 text-yellow-600" />
                              </div>
                              <span>{item.highlights_count} highlights</span>
                            </div>
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="font-medium text-gray-700">{item.rating}/5</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            {item.source_url && (
                              <Button variant="outline" size="sm" asChild className="flex-1 bg-white/60 hover:bg-white">
                                <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open
                                </a>
                              </Button>
                            )}
                            {item.highlights_count > 0 && (
                              <Button variant="outline" size="sm" className="flex-1 bg-white/60 hover:bg-white">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Make Cards
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
