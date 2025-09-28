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
  Lightbulb, Camera, Brain, DollarSign, Rocket
} from "lucide-react";
import Link from "next/link";

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
  healthScore: number;
  nextTodos: ProjectTodo[];
  topRecommendation: SystemRecommendation | null;
}

export default function ProjectOverviewPage() {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [todos, setTodos] = useState<ProjectTodo[]>([]);
  const [recommendations, setRecommendations] = useState<SystemRecommendation[]>([]);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadModules(),
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
        features: ['Mood & Energy Tracking', 'Location Support', 'Tags & Categories', 'Life Areas Integration', 'Private Entries', 'Markdown Support'],
        lastUpdated: '2025-01-28',
        color: 'bg-pink-500'
      },
      {
        id: 'habits',
        name: 'Habits Tracking',
        path: '/habits',
        icon: Target,
        status: 'completed',
        progress: 100,
        description: 'Comprehensive habit tracking with streaks, weekly goals, and gamification',
        features: ['Streak Tracking', 'Weekly Goals', 'Progress Visualization', 'Habit Categories', 'Quick Logging', 'Completion Rates'],
        lastUpdated: '2025-01-28',
        color: 'bg-green-500'
      },
      {
        id: 'routines',
        name: 'Daily Routines',
        path: '/routines',
        icon: Calendar,
        status: 'completed',
        progress: 100,
        description: 'Morning and evening routines with step-by-step tracking',
        features: ['Morning/Evening Routines', 'Multi-step Workflows', 'Progress Tracking', 'Start/Complete Actions', 'Duration Tracking', 'Customizable Steps'],
        lastUpdated: '2025-01-28',
        color: 'bg-blue-500'
      },
      {
        id: 'feedback',
        name: 'Feedback System',
        path: '/feedback',
        icon: MessageSquare,
        status: 'completed',
        progress: 100,
        description: 'User feedback and suggestions with tracking IDs and voting system',
        features: ['Tracking IDs', 'Voting System', 'Status Management', 'Admin Responses', 'Categories & Priorities', 'Implementation Tracking'],
        lastUpdated: '2025-01-28',
        color: 'bg-purple-500'
      },
      {
        id: 'library',
        name: 'Personal Library',
        path: '/library',
        icon: BookOpen,
        status: 'completed',
        progress: 100,
        description: 'Book management with crowdfunding and reading progress tracking',
        features: ['Book Management', 'Crowdfunding System', 'Reading Progress', 'Priority Levels', 'Public/Private Books', 'Auto-search Integration'],
        lastUpdated: '2025-01-28',
        color: 'bg-amber-500'
      },
      {
        id: 'people',
        name: 'Relationships CRM',
        path: '/people',
        icon: Users,
        status: 'completed',
        progress: 100,
        description: 'Personal CRM for managing relationships and interactions',
        features: ['Contact Management', 'Interaction Tracking', 'Birthday Reminders', 'Relationship Types', 'Contact Frequency', 'Notes & Tags'],
        lastUpdated: '2025-01-28',
        color: 'bg-indigo-500'
      },
      {
        id: 'admin',
        name: 'Admin Dashboard',
        path: '/admin',
        icon: Activity,
        status: 'completed',
        progress: 100,
        description: 'Complete system administration and monitoring dashboard',
        features: ['System Stats', 'Feature Management', 'Database Status', 'User Management', 'System Health', 'Metrics Tracking'],
        lastUpdated: '2025-01-28',
        color: 'bg-red-500'
      },
      {
        id: 'learning',
        name: 'Learning & Flashcards',
        path: '/learning',
        icon: Award,
        status: 'planned',
        progress: 0,
        description: 'Spaced repetition learning system with flashcards',
        features: ['Flashcard System', 'Spaced Repetition', 'Learning Progress', 'Categories', 'Performance Analytics', 'Study Sessions'],
        lastUpdated: '2025-01-28',
        color: 'bg-emerald-500'
      },
      {
        id: 'memories',
        name: 'Memories & Photos',
        path: '/memories',
        icon: Gift,
        status: 'planned',
        progress: 0,
        description: 'Photo gallery with location tracking and time capsules',
        features: ['Photo Gallery', 'Location Tracking', 'Time Capsules', 'Memory Timeline', 'Tags & Categories', 'Privacy Controls'],
        lastUpdated: '2025-01-28',
        color: 'bg-rose-500'
      }
    ];

    setModules(moduleData);

    // Calculate stats
    const completedCount = moduleData.filter(m => m.status === 'completed').length;
    const inProgressCount = moduleData.filter(m => m.status === 'in_progress').length;
    const totalFeatures = moduleData.reduce((sum, m) => sum + m.features.length, 0);
    const completedFeatures = moduleData
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.features.length, 0);

    setStats({
      totalModules: moduleData.length,
      completedModules: completedCount,
      inProgressModules: inProgressCount,
      totalFeatures,
      completedFeatures,
      overallProgress: Math.round((completedCount / moduleData.length) * 100)
    });

    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'planned': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'planned': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                  <Layers className="w-6 h-6 text-blue-600" />
                  Project Overview
                </h1>
                <p className="text-sm text-gray-600 mt-1">Complete view of all implemented features and progress</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedModules}/{stats.totalModules}</p>
                    <p className="text-sm text-gray-600">Modules Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedFeatures}</p>
                    <p className="text-sm text-gray-600">Features Implemented</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.overallProgress}%</p>
                    <p className="text-sm text-gray-600">Overall Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgressModules}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Overview */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Development Progress
            </CardTitle>
            <CardDescription>
              Overall project completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Project Completion</span>
                  <span className="text-sm text-gray-600">{stats?.overallProgress}%</span>
                </div>
                <Progress value={stats?.overallProgress || 0} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.completedModules}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.inProgressModules}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {(stats?.totalModules || 0) - (stats?.completedModules || 0) - (stats?.inProgressModules || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Planned</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            
            return (
              <Card key={module.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(module.status)}>
                            {getStatusIcon(module.status)}
                            <span className="ml-1 capitalize">{module.status.replace('_', ' ')}</span>
                          </Badge>
                          {module.status === 'completed' && (
                            <Link href={module.path}>
                              <Button variant="outline" size="sm">
                                Open
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{module.description}</p>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Implementation</span>
                      <span className="text-sm text-gray-600">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  {/* Features List */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Features ({module.features.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {module.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className={`w-3 h-3 ${module.status === 'completed' ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={module.status === 'completed' ? 'text-gray-700' : 'text-gray-500'}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="pt-2 border-t text-xs text-gray-500">
                    Last updated: {new Date(module.lastUpdated).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Next Steps */}
        <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Next Steps & Roadmap
            </CardTitle>
            <CardDescription>
              Upcoming features and improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-blue-900">High Priority</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Learning & Flashcards System
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Memories & Photos Gallery
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Enhanced Feedback System
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-purple-900">Enhancements</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    Version Control & Changelog
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    Universal Static Notes
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    Advanced Book Search
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
