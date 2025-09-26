"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, Clock, Target, TrendingUp, Smile, Tag, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
}

interface AnalyticsData {
  totalLogs: number;
  totalGoals: number;
  totalReviews: number;
  avgMood: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  logsPerWeek: Array<{ week: string; count: number }>;
  moodTrend: Array<{ date: string; mood: number }>;
  timeByTag: Array<{ tag: string; minutes: number }>;
  goalProgress: Array<{ goal: string; progress: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAnalytics();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedProject) return;
    
    try {
      // Fetch logs, goals, and weekly reviews data
      const [logsRes, goalsRes, reviewsRes] = await Promise.all([
        fetch(`/api/logs?projectId=${selectedProject}`),
        fetch(`/api/goals?projectId=${selectedProject}`),
        fetch(`/api/weekly?projectId=${selectedProject}`)
      ]);

      if (!logsRes.ok || !goalsRes.ok) throw new Error("Failed to fetch data");

      const [logsData, goalsData, reviewsData] = await Promise.all([
        logsRes.json(),
        goalsRes.json(),
        reviewsRes.ok ? reviewsRes.json() : { reviews: [] }
      ]);

      const logs = logsData.logs || [];
      const goals = goalsData.goals || [];
      const reviews = reviewsData.reviews || [];

      // Calculate analytics
      const totalLogs = logs.length;
      const totalGoals = goals.length;
      const avgMood = logs.filter((l: any) => l.mood).reduce((sum: number, l: any) => sum + l.mood, 0) / logs.filter((l: any) => l.mood).length || 0;
      const totalTimeSpent = logs.reduce((sum: number, l: any) => sum + (l.time_spent_minutes || 0), 0);

      // Calculate streaks (simplified)
      const sortedLogs = logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date();
      const logDates = new Set(logs.map((l: any) => l.date));
      
      // Current streak
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (logDates.has(dateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Longest streak (simplified calculation)
      longestStreak = Math.max(currentStreak, Math.floor(totalLogs / 7));

      // Logs per week (last 8 weeks)
      const logsPerWeek = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekLogs = logs.filter((l: any) => {
          const logDate = new Date(l.date);
          return logDate >= weekStart && logDate <= weekEnd;
        });
        
        logsPerWeek.push({
          week: `Week ${8 - i}`,
          count: weekLogs.length
        });
      }

      // Mood trend (last 14 days)
      const moodTrend = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayLog = logs.find((l: any) => l.date === dateStr);
        if (dayLog && dayLog.mood) {
          moodTrend.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            mood: dayLog.mood
          });
        }
      }

      // Time by tag
      const tagTime: { [key: string]: number } = {};
      logs.forEach((log: any) => {
        const timeSpent = log.time_spent_minutes || 0;
        log.tags.forEach((tag: string) => {
          tagTime[tag] = (tagTime[tag] || 0) + timeSpent;
        });
      });
      
      const timeByTag = Object.entries(tagTime)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([tag, minutes]) => ({ tag, minutes }));

      // Goal progress
      const goalProgress = goals.map((goal: any) => {
        const completedKRs = goal.key_results.filter((kr: any) => kr.current >= kr.target).length;
        const totalKRs = goal.key_results.length;
        const progress = totalKRs > 0 ? (completedKRs / totalKRs) * 100 : 0;
        
        return {
          goal: goal.objective.substring(0, 30) + (goal.objective.length > 30 ? '...' : ''),
          progress: Math.round(progress)
        };
      });

      setAnalytics({
        totalLogs,
        totalGoals,
        totalReviews: reviews.length,
        avgMood: Math.round(avgMood * 10) / 10,
        totalTimeSpent,
        currentStreak,
        longestStreak,
        logsPerWeek,
        moodTrend,
        timeByTag,
        goalProgress
      });

    } catch (err) {
      console.error("Failed to fetch analytics:", err);
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
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Project Selected</CardTitle>
              <CardDescription>Please select a project to view analytics</CardDescription>
            </CardHeader>
          </Card>
        ) : !analytics ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalLogs}</div>
                  <p className="text-xs text-muted-foreground">Daily entries recorded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(analytics.totalTimeSpent / 60)}h</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalTimeSpent} minutes total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.currentStreak}</div>
                  <p className="text-xs text-muted-foreground">Longest: {analytics.longestStreak} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgMood}/5</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalGoals} active goals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Reviews</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalReviews}</div>
                  <p className="text-xs text-muted-foreground">Reviews generated</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logs per Week */}
              <Card>
                <CardHeader>
                  <CardTitle>Logging Activity</CardTitle>
                  <CardDescription>Number of logs per week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.logsPerWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Mood Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Mood Trend</CardTitle>
                  <CardDescription>Daily mood over the last 2 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.moodTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="mood" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Time by Tag */}
              <Card>
                <CardHeader>
                  <CardTitle>Time by Activity</CardTitle>
                  <CardDescription>Hours spent on different activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.timeByTag}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tag, minutes }) => `${tag}: ${Math.round((minutes as number) / 60)}h`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="minutes"
                      >
                        {analytics.timeByTag.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${Math.round(value / 60)}h`, 'Time Spent']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Goal Progress</CardTitle>
                  <CardDescription>Completion percentage by goal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.goalProgress} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="goal" type="category" width={120} />
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Progress']} />
                      <Bar dataKey="progress" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
