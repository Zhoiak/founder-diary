"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  ArrowLeft, CheckCircle, Clock, Target, Users, 
  BookOpen, Heart, Zap, Calendar, MessageSquare,
  TrendingUp, Award, Flame, Star, Gift,
  BarChart3, PieChart, Activity, Layers, RefreshCw,
  Lightbulb, Camera, Brain, DollarSign, Rocket,
  AlertCircle, ThumbsUp, ThumbsDown, Edit, Trash2,
  MoreVertical
} from "lucide-react";
import Link from "next/link";

interface ProjectTodo {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: number;
  estimated_hours: number;
  tags: string[];
  status: string;
}

interface SystemRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning: string;
  confidence_score: number;
  priority: number;
  estimated_impact: string;
}

interface ProjectSnapshot {
  id: string;
  health_score: number;
  completion_percentage: number;
  total_memories: number;
  total_flashcards: number;
  total_habits: number;
  features_used_count: number;
  created_at: string;
}

const priorityColors = {
  4: 'bg-red-100 text-red-800 border-red-200',
  3: 'bg-orange-100 text-orange-800 border-orange-200',
  2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  1: 'bg-green-100 text-green-800 border-green-200'
};

const priorityLabels = {
  4: 'Critical',
  3: 'High',
  2: 'Medium', 
  1: 'Low'
};

const categoryIcons = {
  monetization: DollarSign,
  system_improvements: Rocket,
  additional_features: Star
};

const categoryColors = {
  monetization: 'from-green-500 to-emerald-600',
  system_improvements: 'from-blue-500 to-indigo-600',
  additional_features: 'from-purple-500 to-pink-600'
};

export default function IntelligentProjectOverview() {
  const [todos, setTodos] = useState<ProjectTodo[]>([]);
  const [recommendations, setRecommendations] = useState<SystemRecommendation[]>([]);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTodos, setLoadingTodos] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTodos(),
        loadRecommendations(),
        loadSnapshot()
      ]);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const loadTodos = async () => {
    setLoadingTodos(true);
    try {
      const res = await fetch('/api/project-todos?status=pending');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data.todos || []);
      console.log('TODOs loaded:', data.todos?.length || 0);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoadingTodos(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/system-recommendations');
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadSnapshot = async () => {
    try {
      const res = await fetch('/api/project-snapshots');
      if (!res.ok) throw new Error('Failed to fetch snapshots');
      const data = await res.json();
      setSnapshot(data.latestSnapshot);
    } catch (error) {
      console.error('Error loading snapshot:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Get the actual Personal project ID first
      const projectsRes = await fetch('/api/projects');
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const personalProject = projectsData.projects?.find((p: any) => p.name === 'Personal');
        
        if (personalProject) {
          // Create new snapshot to update metrics
          const res = await fetch('/api/project-snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: personalProject.id })
          });
          
          if (res.ok) {
            await loadProjectData();
            toast.success('Project data refreshed!');
          } else {
            toast.error('Failed to refresh data');
          }
        }
      }
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecommendationAction = async (id: string, action: 'accept' | 'dismiss') => {
    try {
      const recommendation = recommendations.find(rec => rec.id === id);
      
      // First, update the recommendation status
      const res = await fetch('/api/system-recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      
      if (res.ok && action === 'accept' && recommendation) {
        // If accepted, convert to TODO
        const projectsRes = await fetch('/api/projects');
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          const personalProject = projectsData.projects?.find((p: any) => p.name === 'Personal');
          
          if (personalProject) {
            // Create TODO from recommendation
            const todoRes = await fetch('/api/project-todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: personalProject.id,
                category: recommendation.type === 'monetization' ? 'monetization' : 
                         recommendation.type === 'improvement' ? 'system_improvements' : 'additional_features',
                title: recommendation.title,
                description: recommendation.description,
                priority: recommendation.priority,
                estimatedHours: recommendation.estimated_impact === 'high' ? 30 : 
                               recommendation.estimated_impact === 'medium' ? 20 : 10,
                tags: [recommendation.type, 'from_recommendation']
              })
            });
            
            if (todoRes.ok) {
              // Force complete refresh of all data
              await Promise.all([
                loadTodos(),
                loadRecommendations(),
                loadSnapshot()
              ]);
              toast.success(`Recommendation accepted and added to TODOs!`);
            }
          }
        }
      } else if (res.ok) {
        toast.success(`Recommendation ${action}ed`);
      }
      
      // Remove from recommendations list
      setRecommendations(recommendations.filter(rec => rec.id !== id));
      
    } catch (error) {
      toast.error(`Failed to ${action} recommendation`);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este TODO?')) return;
    
    try {
      const res = await fetch(`/api/project-todos/${todoId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setTodos(todos.filter(todo => todo.id !== todoId));
        toast.success('TODO eliminado exitosamente');
      } else {
        toast.error('Error al eliminar TODO');
      }
    } catch (error) {
      toast.error('Error al eliminar TODO');
    }
  };

  const handleMarkComplete = async (todoId: string) => {
    try {
      const res = await fetch(`/api/project-todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (res.ok) {
        setTodos(todos.filter(todo => todo.id !== todoId));
        toast.success('TODO marcado como completado');
      } else {
        toast.error('Error al completar TODO');
      }
    } catch (error) {
      toast.error('Error al completar TODO');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading intelligent overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Intelligent Project Overview</h1>
                <p className="text-sm text-gray-600 mt-1">Auto-updating system with smart recommendations</p>
              </div>
            </div>
            <Button 
              onClick={refreshData} 
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Health Score & Overview */}
          {snapshot && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${getHealthScoreColor(snapshot.health_score)}`}>
                      {snapshot.health_score}
                    </div>
                    <div className="flex-1">
                      <Progress value={snapshot.health_score} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{getHealthScoreLabel(snapshot.health_score)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-green-600">
                      {snapshot.completion_percentage}%
                    </div>
                    <div className="flex-1">
                      <Progress value={snapshot.completion_percentage} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">9/9 Core Features</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Content Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memories</span>
                      <span className="font-semibold">{snapshot.total_memories}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Flashcards</span>
                      <span className="font-semibold">{snapshot.total_flashcards}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Habits</span>
                      <span className="font-semibold">{snapshot.total_habits}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Features Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-blue-600">
                      {snapshot.features_used_count}
                    </div>
                    <div className="flex-1">
                      <Progress value={(snapshot.features_used_count / 9) * 100} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Active Features</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Recommendation */}
          {recommendations.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6" />
                  Smart Recommendation
                  <Badge className="bg-white/20 text-white border-white/30">
                    {Math.round(recommendations[0].confidence_score * 100)}% confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{recommendations[0].title}</h3>
                    <p className="text-blue-100 mb-3">{recommendations[0].description}</p>
                    <p className="text-sm text-blue-200 italic">💡 {recommendations[0].reasoning}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleRecommendationAction(recommendations[0].id, 'accept')}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      onClick={() => handleRecommendationAction(recommendations[0].id, 'dismiss')}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next TODOs */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-600" />
              Next TODOs
              <Badge variant="secondary">{todos.length} pending</Badge>
              {loadingTodos && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </h2>
            
            {todos.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All TODOs Complete!</h3>
                  <p className="text-gray-600 text-center">
                    Great job! You've completed all planned tasks. The system will suggest new opportunities as they arise.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {todos.map((todo) => {
                  const CategoryIcon = categoryIcons[todo.category as keyof typeof categoryIcons] || Target;
                  const categoryGradient = categoryColors[todo.category as keyof typeof categoryColors];
                  
                  return (
                    <Card key={todo.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${categoryGradient} flex items-center justify-center`}>
                              <CategoryIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{todo.title}</CardTitle>
                              <CardDescription className="capitalize">{todo.category.replace('_', ' ')}</CardDescription>
                            </div>
                          </div>
                          <Badge className={priorityColors[todo.priority as keyof typeof priorityColors]}>
                            {priorityLabels[todo.priority as keyof typeof priorityLabels]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{todo.description}</p>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {todo.estimated_hours}h estimated
                          </span>
                          <div className="flex gap-1">
                            {todo.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleMarkComplete(todo.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Recommendations */}
          {recommendations.length > 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600" />
                More Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.slice(1).map((rec) => (
                  <Card key={rec.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{rec.title}</span>
                        <Badge variant="outline">
                          {Math.round(rec.confidence_score * 100)}%
                        </Badge>
                      </CardTitle>
                      <CardDescription>{rec.type.replace('_', ' ')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{rec.description}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleRecommendationAction(rec.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecommendationAction(rec.id, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
