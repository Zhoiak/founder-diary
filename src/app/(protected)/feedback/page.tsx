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
  Plus, ArrowLeft, MessageSquare, Lightbulb, Bug, 
  Zap, TrendingUp, ThumbsUp, ThumbsDown, MessageCircle,
  Clock, CheckCircle, XCircle, AlertTriangle, Eye,
  Send, Heart, Star, Gift
} from "lucide-react";
import Link from "next/link";

interface Feedback {
  id: string;
  tracking_id: string;
  feedback_type: 'suggestion' | 'bug' | 'feature_request' | 'improvement' | 'other';
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'reviewing' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  admin_notes?: string;
  implementation_notes?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  votes_count?: number;
  user_vote?: 'upvote' | 'downvote' | null;
  comments_count?: number;
}

const feedbackTypes = {
  suggestion: { icon: Lightbulb, label: "Suggestion", color: "text-yellow-600", bg: "bg-yellow-50" },
  feature_request: { icon: Zap, label: "Feature Request", color: "text-blue-600", bg: "bg-blue-50" },
  improvement: { icon: TrendingUp, label: "Improvement", color: "text-green-600", bg: "bg-green-50" },
  bug: { icon: Bug, label: "Bug Report", color: "text-red-600", bg: "bg-red-50" },
  other: { icon: MessageSquare, label: "Other", color: "text-gray-600", bg: "bg-gray-50" }
};

const statusConfig = {
  submitted: { icon: Clock, label: "Submitted", color: "text-gray-600", bg: "bg-gray-100" },
  reviewing: { icon: Eye, label: "Reviewing", color: "text-blue-600", bg: "bg-blue-100" },
  planned: { icon: Star, label: "Planned", color: "text-purple-600", bg: "bg-purple-100" },
  in_progress: { icon: Zap, label: "In Progress", color: "text-orange-600", bg: "bg-orange-100" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-green-600", bg: "bg-green-100" },
  rejected: { icon: XCircle, label: "Rejected", color: "text-red-600", bg: "bg-red-100" }
};

const priorityConfig = {
  low: { color: "text-gray-600", bg: "bg-gray-100" },
  medium: { color: "text-blue-600", bg: "bg-blue-100" },
  high: { color: "text-orange-600", bg: "bg-orange-100" },
  urgent: { color: "text-red-600", bg: "bg-red-100" }
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Form data
  const [formData, setFormData] = useState({
    type: "suggestion" as keyof typeof feedbackTypes,
    title: "",
    description: "",
    category: ""
  });

  useEffect(() => {
    fetchFeedback();
  }, [filter, sortBy]);

  const fetchFeedback = async () => {
    try {
      const url = new URL("/api/feedback", window.location.origin);
      if (filter !== "all") url.searchParams.set("type", filter);
      url.searchParams.set("sort", sortBy);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch feedback");
      
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "suggestion",
      title: "",
      description: "",
      category: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: formData.type,
          title: formData.title,
          description: formData.description,
          category: formData.category || undefined,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit feedback");
      }
      
      const data = await res.json();
      setFeedback([data.feedback, ...feedback]);
      resetForm();
      setDialogOpen(false);
      toast.success(`Feedback submitted! Tracking ID: ${data.feedback.tracking_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (feedbackId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote_type: voteType }),
      });
      
      if (!res.ok) throw new Error("Failed to vote");
      
      // Refresh feedback to get updated vote counts
      fetchFeedback();
      toast.success("Vote recorded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to vote");
    }
  };

  const getTypeConfig = (type: string) => {
    return feedbackTypes[type as keyof typeof feedbackTypes] || feedbackTypes.other;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
  };

  const getPriorityConfig = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const filteredFeedback = feedback.filter(item => {
    if (filter === "all") return true;
    return item.feedback_type === filter;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
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
                  <MessageSquare className="w-6 h-6 text-purple-500" />
                  Feedback & Suggestions
                </h1>
                <p className="text-sm text-gray-600 mt-1">Help us improve by sharing your ideas</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Share Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-500" />
                    Share Your Feedback
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type of Feedback</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: keyof typeof feedbackTypes) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(feedbackTypes).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief summary of your feedback"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your suggestion, bug, or idea in detail..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., UI/UX, Performance, Mobile"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Get Rewarded!</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          When we implement your suggestion, you'll get notified and may receive rewards like free premium days!
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? "Submitting..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(feedbackTypes).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_voted">Most Voted</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Be the first to share your ideas and help us improve!
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Share First Feedback
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredFeedback.map((item) => {
              const typeConfig = getTypeConfig(item.feedback_type);
              const statusConfig = getStatusConfig(item.status);
              const priorityConfig = getPriorityConfig(item.priority);
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
                            <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>ID: {item.tracking_id}</span>
                          <Badge variant="outline" className={priorityConfig.bg}>
                            {item.priority.toUpperCase()}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{item.description}</p>
                    
                    {item.admin_notes && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-blue-900 mb-1">Admin Response:</h4>
                        <p className="text-blue-800 text-sm">{item.admin_notes}</p>
                      </div>
                    )}

                    {item.implementation_notes && item.status === 'completed' && (
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-green-900 mb-1">✨ Implementation Notes:</h4>
                        <p className="text-green-800 text-sm">{item.implementation_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(item.id, 'upvote')}
                          className={item.user_vote === 'upvote' ? 'text-green-600 bg-green-50' : ''}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {item.votes_count || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(item.id, 'downvote')}
                          className={item.user_vote === 'downvote' ? 'text-red-600 bg-red-50' : ''}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {item.comments_count || 0}
                        </Button>
                      </div>
                      
                      {item.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Implemented!
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
