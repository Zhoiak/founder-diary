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
  Code, ExternalLink, Globe, Sparkles, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface ModuleStatus {
  id: string;
  name: string;
  path: string;
  icon: any;
  status: 'completed' | 'in_progress' | 'planned';
  progress: number;
  description: string;
  features: string[];
  lastUpdated: string;
  color: string;
}

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

interface ProjectStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  totalFeatures: number;
  completedFeatures: number;
  overallProgress: number;
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

export default function GlobalProjectOverview() {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [todos, setTodos] = useState<ProjectTodo[]>([]);
  const [recommendations, setRecommendations] = useState<SystemRecommendation[]>([]);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadModules(),
        loadTodos(),
        loadRecommendations(),
        loadSnapshot()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    // Initialize with current implementation status
    const moduleData: ModuleStatus[] = [
      {
        id: 'journal',
        name: 'Personal Journal',
        path: '/journal',
        icon: Heart,
        status: 'completed',
        progress: 100,
        description: 'Complete journaling system with mood tracking, energy levels, and markdown support',
        features: ['Mood tracking', 'Energy levels', 'Markdown support', 'Daily entries', 'Search & filter'],
        lastUpdated: '2024-01-15',
        color: 'from-pink-500 to-rose-600'
      },
      {
        id: 'habits',
        name: 'Habits Tracking',
        path: '/habits',
        icon: Zap,
        status: 'completed',
        progress: 100,
        description: 'Comprehensive habit tracking with streaks, gamification, and analytics',
        features: ['Streak tracking', 'Habit completion', 'Analytics dashboard', 'Gamification', 'Custom frequencies'],
        lastUpdated: '2024-01-10',
        color: 'from-yellow-500 to-orange-600'
      },
      {
        id: 'routines',
        name: 'Daily Routines',
        path: '/routines',
        icon: Calendar,
        status: 'completed',
        progress: 100,
        description: 'Morning and evening routines with step-by-step guidance and completion tracking',
        features: ['Morning routines', 'Evening routines', 'Step tracking', 'Completion analytics', 'Custom steps'],
        lastUpdated: '2024-01-08',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        id: 'feedback',
        name: 'Feedback System',
        path: '/feedback',
        icon: MessageSquare,
        status: 'completed',
        progress: 100,
        description: 'Complete feedback collection and management system with voting and tracking',
        features: ['Feedback collection', 'Voting system', 'Status tracking', 'Admin management', 'Analytics'],
        lastUpdated: '2024-01-05',
        color: 'from-purple-500 to-violet-600'
      },
      {
        id: 'library',
        name: 'Library + Crowdfunding',
        path: '/library',
        icon: BookOpen,
        status: 'completed',
        progress: 100,
        description: 'Book management system with crowdfunding integration and reading progress tracking',
        features: ['Book management', 'Reading progress', 'Crowdfunding integration', 'Wishlist', 'Reviews'],
        lastUpdated: '2024-01-03',
        color: 'from-emerald-500 to-teal-600'
      },
      {
        id: 'people',
        name: 'Relationships CRM',
        path: '/people',
        icon: Users,
        status: 'completed',
        progress: 100,
        description: 'Personal CRM for managing relationships, contacts, and interaction history',
        features: ['Contact management', 'Interaction tracking', 'Relationship insights', 'Communication history', 'Tags & categories'],
        lastUpdated: '2024-01-01',
        color: 'from-cyan-500 to-blue-600'
      },
      {
        id: 'admin',
        name: 'Admin Dashboard',
        path: '/admin',
        icon: BarChart3,
        status: 'completed',
        progress: 100,
        description: 'Comprehensive admin dashboard for system monitoring and management',
        features: ['System monitoring', 'User management', 'Analytics', 'Performance metrics', 'Configuration'],
        lastUpdated: '2023-12-28',
        color: 'from-red-500 to-pink-600'
      },
      {
        id: 'learning',
        name: 'Learning & Flashcards',
        path: '/learning',
        icon: Brain,
        status: 'completed',
        progress: 100,
        description: 'Spaced repetition learning system with flashcards and progress tracking',
        features: ['Spaced repetition', 'Flashcard decks', 'Progress tracking', 'Learning analytics', 'Custom cards'],
        lastUpdated: '2023-12-25',
        color: 'from-indigo-500 to-purple-600'
      },
      {
        id: 'memories',
        name: 'Memories & Photos',
        path: '/memories',
        icon: Camera,
        status: 'completed',
        progress: 100,
        description: 'Memory preservation system with photos, locations, and time capsules',
        features: ['Memory creation', 'Photo management', 'Location tracking', 'Time capsules', 'Collections'],
        lastUpdated: '2023-12-20',
        color: 'from-teal-500 to-cyan-600'
      }
    ];

    setModules(moduleData);

    // Calculate stats
    const completedModules = moduleData.filter(m => m.status === 'completed').length;
    const inProgressModules = moduleData.filter(m => m.status === 'in_progress').length;
    const totalFeatures = moduleData.reduce((sum, m) => sum + m.features.length, 0);
    const completedFeatures = moduleData.filter(m => m.status === 'completed').reduce((sum, m) => sum + m.features.length, 0);

    setStats({
      totalModules: moduleData.length,
      completedModules,
      inProgressModules,
      totalFeatures,
      completedFeatures,
      overallProgress: Math.round((completedModules / moduleData.length) * 100)
    });
  };

  const loadTodos = async () => {
    try {
      const res = await fetch('/api/project-todos?status=pending');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data.todos || []);
    } catch (error) {
      console.error('Error loading todos:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading global overview...</p>
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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  Global Project Overview
                </h1>
                <p className="text-sm text-gray-600 mt-1">Complete system status and intelligent recommendations</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/project-overview-intelligent">
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Smart TODOs
                </Button>
              </Link>
              <Button onClick={loadAllData} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              System Overview
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              All Modules
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Intelligence & TODOs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* System Health Overview */}
            {stats && snapshot && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-green-600">
                        {snapshot.health_score}
                      </div>
                      <div className="flex-1">
                        <Progress value={snapshot.health_score} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Excellent</p>
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
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.overallProgress}%
                      </div>
                      <div className="flex-1">
                        <Progress value={stats.overallProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{stats.completedModules}/{stats.totalModules} modules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.completedFeatures}
                      </div>
                      <div className="flex-1">
                        <Progress value={(stats.completedFeatures / stats.totalFeatures) * 100} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">Total features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Next TODOs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-orange-600">
                        {todos.length}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Pending tasks</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {recommendations.length} recommendations
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Rocket className="w-6 h-6" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/project-overview-intelligent">
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Brain className="w-4 h-4 mr-2" />
                      Smart TODOs
                    </Button>
                  </Link>
                  <Link href="/memories">
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Camera className="w-4 h-4 mr-2" />
                      Add Memory
                    </Button>
                  </Link>
                  <Link href="/learning">
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Study Cards
                    </Button>
                  </Link>
                  <Link href="/journal">
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Heart className="w-4 h-4 mr-2" />
                      Journal Entry
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card key={module.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <Badge className={module.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {module.status === 'completed' ? 'Complete' : 'In Progress'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {module.name}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-semibold">{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {module.features.slice(0, 3).map(feature => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {module.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{module.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 pt-2 border-t mb-4">
                        Last updated: {module.lastUpdated}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Link href={`/dev/${module.id}`} className="flex-1">
                          <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Code className="w-3 h-3 mr-1" />
                            Dev View
                          </Button>
                        </Link>
                        <Link href={module.path} className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Live
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-8">
            {/* Top Recommendation */}
            {recommendations.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6" />
                    Top Recommendation
                    <Badge className="bg-white/20 text-white border-white/30">
                      {Math.round(recommendations[0].confidence_score * 100)}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{recommendations[0].title}</h3>
                      <p className="text-purple-100 mb-3">{recommendations[0].description}</p>
                      <p className="text-sm text-purple-200 italic">💡 {recommendations[0].reasoning}</p>
                    </div>
                    <Link href="/project-overview-intelligent">
                      <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Brain className="w-4 h-4 mr-2" />
                        View Smart TODOs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TODOs Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Critical TODOs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    {todos.filter(t => t.priority === 4).length}
                  </div>
                  <p className="text-sm text-gray-600">High priority tasks requiring immediate attention</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    Total Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {todos.reduce((sum, todo) => sum + todo.estimated_hours, 0)}h
                  </div>
                  <p className="text-sm text-gray-600">Estimated time for all pending TODOs</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Target className="w-5 h-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monetization</span>
                      <span className="font-semibold">{todos.filter(t => t.category === 'monetization').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Improvements</span>
                      <span className="font-semibold">{todos.filter(t => t.category === 'system_improvements').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Features</span>
                      <span className="font-semibold">{todos.filter(t => t.category === 'additional_features').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access to Smart TODOs */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Brain className="w-16 h-16 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent TODO Management</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Access the smart TODO system with AI recommendations, progress tracking, and automated task management.
                </p>
                <Link href="/project-overview-intelligent">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Open Smart TODOs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
