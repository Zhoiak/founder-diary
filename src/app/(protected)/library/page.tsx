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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Plus, ArrowLeft, BookOpen, Heart, Star, 
  Clock, CheckCircle, Play, Eye,
  Gift, DollarSign, Target,
  Filter, Search, Grid, List, MoreHorizontal,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { StaticNotes } from "@/components/static-notes";
import { BookSearch } from "@/components/book-search";

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  pages?: number;
  priority_level: number;
  reading_status: 'wishlist' | 'to_read' | 'reading' | 'completed';
  is_public: boolean;
  allow_crowdfunding: boolean;
  crowdfunding_goal?: number;
  crowdfunding_raised: number;
  crowdfunding_message?: string;
  estimated_price?: number;
  currency: string;
  tags: string[];
  progress_percentage?: number;
}

const statusConfig = {
  wishlist: { icon: Heart, label: "Wishlist", color: "text-pink-600", bg: "bg-pink-50" },
  to_read: { icon: Bookmark, label: "To Read", color: "text-blue-600", bg: "bg-blue-50" },
  reading: { icon: BookOpen, label: "Reading", color: "text-green-600", bg: "bg-green-50" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50" }
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    priority_level: 5,
    reading_status: "wishlist" as Book['reading_status'],
    estimated_price: "",
    is_public: false,
    allow_crowdfunding: false,
    crowdfunding_goal: "",
    crowdfunding_message: "",
    tags: ""
  });

  useEffect(() => {
    // Mock data for now - replace with API call
    setBooks([
      {
        id: "1",
        title: "Atomic Habits",
        author: "James Clear",
        description: "Un enfoque sencillo y comprobado para desarrollar buenos hábitos",
        pages: 320,
        priority_level: 9,
        reading_status: "wishlist",
        is_public: true,
        allow_crowdfunding: true,
        crowdfunding_goal: 15.99,
        crowdfunding_raised: 8.50,
        crowdfunding_message: "Este libro me ayudaría a mejorar mis hábitos diarios",
        estimated_price: 15.99,
        currency: "EUR",
        tags: ["productividad", "hábitos", "autoayuda"],
        progress_percentage: 0
      }
    ]);
    setLoading(false);
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      description: "",
      priority_level: 5,
      reading_status: "wishlist",
      estimated_price: "",
      is_public: false,
      allow_crowdfunding: false,
      crowdfunding_goal: "",
      crowdfunding_message: "",
      tags: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) return;

    setCreating(true);
    try {
      // Mock implementation - replace with API call
      const newBook: Book = {
        id: Date.now().toString(),
        title: formData.title,
        author: formData.author,
        description: formData.description,
        priority_level: formData.priority_level,
        reading_status: formData.reading_status,
        is_public: formData.is_public,
        allow_crowdfunding: formData.allow_crowdfunding,
        crowdfunding_goal: formData.crowdfunding_goal ? parseFloat(formData.crowdfunding_goal) : undefined,
        crowdfunding_raised: 0,
        crowdfunding_message: formData.crowdfunding_message,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : undefined,
        currency: "EUR",
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        progress_percentage: 0
      };
      
      setBooks([newBook, ...books]);
      resetForm();
      setDialogOpen(false);
      toast.success("Book added to library!");
    } catch (err: any) {
      toast.error("Failed to add book");
    } finally {
      setCreating(false);
    }
  };

  const getCrowdfundingProgress = (book: Book) => {
    if (!book.allow_crowdfunding || !book.crowdfunding_goal) return 0;
    return Math.min((book.crowdfunding_raised / book.crowdfunding_goal) * 100, 100);
  };

  const getPriorityStars = (priority: number) => {
    return Array.from({ length: Math.min(priority, 5) }, (_, i) => (
      <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
    ));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                  Personal Library
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage your reading journey & crowdfund new books</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Book to Library</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Book Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority (1-10)</Label>
                        <Select 
                          value={formData.priority_level.toString()} 
                          onValueChange={(value) => setFormData({ ...formData, priority_level: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} - {num <= 3 ? 'Low' : num <= 6 ? 'Medium' : 'High'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={formData.reading_status} 
                          onValueChange={(value: Book['reading_status']) => setFormData({ ...formData, reading_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_public}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                        />
                        <Label>Make public</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.allow_crowdfunding}
                          onCheckedChange={(checked) => setFormData({ ...formData, allow_crowdfunding: checked })}
                        />
                        <Label>Allow crowdfunding</Label>
                      </div>

                      {formData.allow_crowdfunding && (
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={formData.estimated_price}
                                onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Goal</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={formData.crowdfunding_goal}
                                onChange={(e) => setFormData({ ...formData, crowdfunding_goal: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea
                              value={formData.crowdfunding_message}
                              onChange={(e) => setFormData({ ...formData, crowdfunding_message: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Adding..." : "Add Book"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Static Notes for Library */}
        <StaticNotes moduleName="library" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => {
            const bookStatusConfig = statusConfig[book.reading_status];
            const StatusIcon = bookStatusConfig.icon;
            const crowdfundingProgress = getCrowdfundingProgress(book);
            
            return (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
                  <CardDescription>by {book.author}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${bookStatusConfig.bg} ${bookStatusConfig.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {bookStatusConfig.label}
                    </Badge>
                    {book.is_public && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <div className="flex items-center gap-1">
                      {getPriorityStars(book.priority_level)}
                    </div>
                  </div>

                  {book.allow_crowdfunding && book.crowdfunding_goal && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Crowdfunding</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          {book.crowdfunding_raised.toFixed(2)} / {book.crowdfunding_goal.toFixed(2)} EUR
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {crowdfundingProgress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={crowdfundingProgress} className="h-2 mb-2" />
                      {book.crowdfunding_message && (
                        <p className="text-xs text-gray-700 italic">"{book.crowdfunding_message}"</p>
                      )}
                    </div>
                  )}

                  {book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="w-4 h-4 mr-1" />
                      Start Reading
                    </Button>
                    {book.allow_crowdfunding && crowdfundingProgress < 100 && (
                      <Button size="sm" variant="outline" className="text-green-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Donate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
