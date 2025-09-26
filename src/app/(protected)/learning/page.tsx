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
              <h1 className="text-2xl font-bold text-gray-900">Learning & Flashcards</h1>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to manage your learning materials and flashcards.
              </p>
            </CardContent>
          </Card>
        ) : reviewMode && currentCard ? (
          // Review Mode
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Flashcard Review
                </span>
                <Button variant="outline" onClick={() => setReviewMode(false)}>
                  Exit Review
                </Button>
              </CardTitle>
              <CardDescription>
                Deck: {currentCard.deck_name} • {flashcardStats.due} cards due
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="bg-blue-50 p-6 rounded-lg mb-4">
                  <p className="text-lg">{currentCard.front}</p>
                </div>
                
                {showAnswer && (
                  <div className="bg-green-50 p-6 rounded-lg mb-4">
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                )}
              </div>

              {!showAnswer ? (
                <Button onClick={() => setShowAnswer(true)} className="w-full">
                  Show Answer
                </Button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="destructive" onClick={() => reviewCard(0)}>
                    Again
                  </Button>
                  <Button variant="outline" onClick={() => reviewCard(1)}>
                    Hard
                  </Button>
                  <Button variant="default" onClick={() => reviewCard(2)}>
                    Good
                  </Button>
                  <Button variant="default" onClick={() => reviewCard(3)}>
                    Easy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Flashcard Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Flashcard Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{flashcardStats.due}</div>
                    <div className="text-sm text-gray-600">Due</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{flashcardStats.new}</div>
                    <div className="text-sm text-gray-600">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{flashcardStats.learning}</div>
                    <div className="text-sm text-gray-600">Learning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{flashcardStats.mature}</div>
                    <div className="text-sm text-gray-600">Mature</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">{flashcardStats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
                <Button 
                  onClick={startReview} 
                  disabled={flashcardStats.due === 0}
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Review ({flashcardStats.due} due)
                </Button>
              </CardContent>
            </Card>

            {/* Learning Items */}
            {items.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Items Yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Start building your knowledge base by adding books, articles, and other learning materials.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const KindIcon = kindIcons[item.kind];
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <KindIcon className="w-5 h-5 text-blue-500" />
                              {item.title}
                            </CardTitle>
                            {item.author && (
                              <CardDescription className="mt-1">
                                by {item.author}
                              </CardDescription>
                            )}
                          </div>
                          <Badge className={statusColors[item.status]}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{item.reading_progress}%</span>
                          </div>
                          <Progress value={item.reading_progress} className="h-2" />
                        </div>

                        {/* Stats */}
                        <div className="flex justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Highlighter className="w-4 h-4" />
                            {item.highlights_count} highlights
                          </span>
                          {item.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {item.rating}/5
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {item.source_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {item.highlights_count > 0 && (
                            <Button variant="outline" size="sm">
                              <Lightbulb className="w-4 h-4 mr-1" />
                              Make Cards
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
