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
  Code, Database, GitBranch, ExternalLink, Play,
  FileText, Settings, Bug, Zap as ZapIcon, Globe
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModuleImplementation {
  id: string;
  name: string;
  description: string;
  icon: any;
  liveUrl: string;
  status: 'completed' | 'in_progress' | 'planned';
  progress: number;
  color: string;
  
  // Technical Details
  techStack: string[];
  apiEndpoints: string[];
  dbTables: string[];
  components: string[];
  
  // Implementation History
  implementationHistory: {
    date: string;
    version: string;
    description: string;
    author: string;
    type: 'feature' | 'bugfix' | 'improvement' | 'refactor';
  }[];
  
  // Metrics
  metrics: {
    totalLines: number;
    totalFiles: number;
    testCoverage: number;
    performance: number;
    lastDeployment: string;
    uptime: number;
  };
  
  // Features
  features: {
    name: string;
    status: 'completed' | 'in_progress' | 'planned';
    implementedDate?: string;
    description: string;
  }[];
}

const moduleData: { [key: string]: ModuleImplementation } = {
  journal: {
    id: 'journal',
    name: 'Personal Journal',
    description: 'Complete journaling system with mood tracking, energy levels, and markdown support',
    icon: Heart,
    liveUrl: '/journal',
    status: 'completed',
    progress: 100,
    color: 'from-pink-500 to-rose-600',
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'React Hook Form'],
    apiEndpoints: [
      'GET /api/personal/entries',
      'POST /api/personal/entries',
      'PATCH /api/personal/entries/[id]',
      'DELETE /api/personal/entries/[id]'
    ],
    dbTables: ['personal_entries', 'mood_tracking', 'energy_levels'],
    components: ['JournalEntry', 'MoodSelector', 'EnergyTracker', 'MarkdownEditor'],
    implementationHistory: [
      {
        date: '2024-01-15',
        version: 'v2.1.0',
        description: 'Added advanced mood tracking with custom emotions',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-10',
        version: 'v2.0.0',
        description: 'Complete redesign with improved UX and performance',
        author: 'Santiago',
        type: 'improvement'
      },
      {
        date: '2024-01-05',
        version: 'v1.5.0',
        description: 'Added markdown support and rich text editing',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-01',
        version: 'v1.0.0',
        description: 'Initial journal implementation with basic functionality',
        author: 'Santiago',
        type: 'feature'
      }
    ],
    metrics: {
      totalLines: 2847,
      totalFiles: 12,
      testCoverage: 85,
      performance: 92,
      lastDeployment: '2024-01-15T10:30:00Z',
      uptime: 99.8
    },
    features: [
      { name: 'Daily Entries', status: 'completed', implementedDate: '2024-01-01', description: 'Create and edit daily journal entries' },
      { name: 'Mood Tracking', status: 'completed', implementedDate: '2024-01-05', description: 'Track emotional state with visual indicators' },
      { name: 'Energy Levels', status: 'completed', implementedDate: '2024-01-08', description: 'Monitor energy throughout the day' },
      { name: 'Markdown Support', status: 'completed', implementedDate: '2024-01-05', description: 'Rich text formatting with markdown' },
      { name: 'Search & Filter', status: 'completed', implementedDate: '2024-01-12', description: 'Find entries by date, mood, or content' }
    ]
  },
  habits: {
    id: 'habits',
    name: 'Habits Tracking',
    description: 'Comprehensive habit tracking with streaks, gamification, and analytics',
    icon: Zap,
    liveUrl: '/habits',
    status: 'completed',
    progress: 100,
    color: 'from-yellow-500 to-orange-600',
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'Chart.js', 'Framer Motion'],
    apiEndpoints: [
      'GET /api/habits',
      'POST /api/habits',
      'PATCH /api/habits/[id]',
      'POST /api/habits/[id]/complete',
      'GET /api/habits/analytics'
    ],
    dbTables: ['habits', 'habit_completions', 'habit_streaks'],
    components: ['HabitCard', 'StreakCounter', 'HabitAnalytics', 'CompletionButton'],
    implementationHistory: [
      {
        date: '2024-01-10',
        version: 'v1.8.0',
        description: 'Added advanced analytics and streak recovery',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-08',
        version: 'v1.5.0',
        description: 'Implemented gamification with points and levels',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-05',
        version: 'v1.0.0',
        description: 'Basic habit tracking with streak counting',
        author: 'Santiago',
        type: 'feature'
      }
    ],
    metrics: {
      totalLines: 3241,
      totalFiles: 15,
      testCoverage: 78,
      performance: 88,
      lastDeployment: '2024-01-10T14:20:00Z',
      uptime: 99.5
    },
    features: [
      { name: 'Habit Creation', status: 'completed', implementedDate: '2024-01-05', description: 'Create custom habits with frequencies' },
      { name: 'Streak Tracking', status: 'completed', implementedDate: '2024-01-05', description: 'Track consecutive completions' },
      { name: 'Analytics Dashboard', status: 'completed', implementedDate: '2024-01-08', description: 'Visual progress analytics' },
      { name: 'Gamification', status: 'completed', implementedDate: '2024-01-08', description: 'Points, levels, and achievements' },
      { name: 'Custom Frequencies', status: 'completed', implementedDate: '2024-01-10', description: 'Daily, weekly, custom schedules' }
    ]
  },
  routines: {
    id: 'routines',
    name: 'Daily Routines',
    description: 'Morning and evening routines with step-by-step guidance and completion tracking',
    icon: Calendar,
    liveUrl: '/routines',
    status: 'completed',
    progress: 100,
    color: 'from-blue-500 to-indigo-600',
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'React DnD', 'Date-fns'],
    apiEndpoints: [
      'GET /api/personal/routines',
      'POST /api/personal/routines',
      'PATCH /api/personal/routines/[id]',
      'POST /api/personal/routines/[id]/complete'
    ],
    dbTables: ['routines', 'routine_steps', 'routine_completions'],
    components: ['RoutineCard', 'StepTracker', 'RoutineBuilder', 'CompletionTimer'],
    implementationHistory: [
      {
        date: '2024-01-08',
        version: 'v1.3.0',
        description: 'Added drag-and-drop routine builder',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-06',
        version: 'v1.1.0',
        description: 'Implemented step-by-step completion tracking',
        author: 'Santiago',
        type: 'feature'
      },
      {
        date: '2024-01-03',
        version: 'v1.0.0',
        description: 'Basic morning and evening routines',
        author: 'Santiago',
        type: 'feature'
      }
    ],
    metrics: {
      totalLines: 2156,
      totalFiles: 10,
      testCoverage: 82,
      performance: 90,
      lastDeployment: '2024-01-08T09:15:00Z',
      uptime: 99.9
    },
    features: [
      { name: 'Morning Routines', status: 'completed', implementedDate: '2024-01-03', description: 'Customizable morning routine steps' },
      { name: 'Evening Routines', status: 'completed', implementedDate: '2024-01-03', description: 'Wind-down evening routines' },
      { name: 'Step Tracking', status: 'completed', implementedDate: '2024-01-06', description: 'Individual step completion' },
      { name: 'Completion Analytics', status: 'completed', implementedDate: '2024-01-08', description: 'Routine completion statistics' },
      { name: 'Custom Steps', status: 'completed', implementedDate: '2024-01-08', description: 'Add personalized routine steps' }
    ]
  }
};

export default function ModuleDevView({ params }: { params: Promise<{ module: string }> }) {
  const [module, setModule] = useState<ModuleImplementation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadModule = async () => {
      const resolvedParams = await params;
      const moduleId = resolvedParams.module;
      const moduleInfo = moduleData[moduleId];
      
      if (moduleInfo) {
        setModule(moduleInfo);
      } else {
        toast.error('Module not found');
      }
      setLoading(false);
    };

    loadModule();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Code className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading module details...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bug className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
          <p className="text-gray-600 mb-4">The requested module could not be loaded.</p>
          <Link href="/project-overview-global">
            <Button>Back to Overview</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = module.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/project-overview-global">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Overview
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Code className="w-6 h-6 text-blue-600" />
                    {module.name} - Dev View
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">Technical implementation details and metrics</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={module.liveUrl}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              </Link>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Module Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                    {module.status === 'completed' ? 'Production Ready' : 'In Development'}
                  </Badge>
                  <Progress value={module.progress} className="h-2 mt-3" />
                  <p className="text-xs text-gray-500 mt-1">{module.progress}% Complete</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {module.metrics.performance}
                  </div>
                  <Progress value={module.metrics.performance} className="h-2 mt-2" />
                  <p className="text-xs text-gray-500 mt-1">Lighthouse Score</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {module.metrics.uptime}%
                  </div>
                  <Progress value={module.metrics.uptime} className="h-2 mt-2" />
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Test Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {module.metrics.testCoverage}%
                  </div>
                  <Progress value={module.metrics.testCoverage} className="h-2 mt-2" />
                  <p className="text-xs text-gray-500 mt-1">Code Coverage</p>
                </CardContent>
              </Card>
            </div>

            {/* Features Status */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Features Implementation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {module.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <h4 className="font-medium">{feature.name}</h4>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {feature.status}
                        </Badge>
                        {feature.implementedDate && (
                          <p className="text-xs text-gray-500 mt-1">{feature.implementedDate}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                  <Link href={module.liveUrl}>
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Globe className="w-4 h-4 mr-2" />
                      View Live
                    </Button>
                  </Link>
                  <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Database className="w-4 h-4 mr-2" />
                    DB Schema
                  </Button>
                  <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <FileText className="w-4 h-4 mr-2" />
                    API Docs
                  </Button>
                  <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Bug className="w-4 h-4 mr-2" />
                    Debug
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tech Stack */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Tech Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {module.techStack.map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Database Tables */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    Database Tables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.dbTables.map((table, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Database className="w-4 h-4 text-gray-500" />
                        <code className="text-sm font-mono">{table}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <code className="text-sm font-mono text-blue-600">{endpoint}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Components */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-orange-600" />
                    Components
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.components.map((component, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Code className="w-4 h-4 text-gray-500" />
                        <code className="text-sm font-mono">{component}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <GitBranch className="w-5 h-5 text-green-600" />
                  Implementation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.implementationHistory.map((entry, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border-l-4 border-blue-200 bg-blue-50/50 rounded-r-lg">
                      <div className="flex-shrink-0">
                        <Badge className={
                          entry.type === 'feature' ? 'bg-green-100 text-green-800' :
                          entry.type === 'bugfix' ? 'bg-red-100 text-red-800' :
                          entry.type === 'improvement' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }>
                          {entry.type}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{entry.version}</h4>
                          <span className="text-sm text-gray-500">{entry.date}</span>
                        </div>
                        <p className="text-gray-700 mb-1">{entry.description}</p>
                        <p className="text-xs text-gray-500">by {entry.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Code Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Lines of Code</span>
                    <span className="font-semibold">{module.metrics.totalLines.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Files</span>
                    <span className="font-semibold">{module.metrics.totalFiles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Test Coverage</span>
                    <span className="font-semibold">{module.metrics.testCoverage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Performance Score</span>
                    <span className="font-semibold">{module.metrics.performance}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uptime</span>
                    <span className="font-semibold">{module.metrics.uptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Deployment</span>
                    <span className="font-semibold text-sm">
                      {new Date(module.metrics.lastDeployment).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
