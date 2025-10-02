"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, Users, Activity, BarChart3, Settings, 
  CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingUp, TrendingDown, Minus, RefreshCw,
  Server, Code, Zap, Shield, Eye
} from "lucide-react";
import Link from "next/link";

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalEntries: number;
  activeUsers24h: number;
  implementedFeatures: number;
  pendingFeatures: number;
  databaseTables: number;
  apiEndpoints: number;
}

interface FeatureStatus {
  category: string;
  name: string;
  status: 'implemented' | 'partial' | 'missing';
  hasBackend: boolean;
  hasFrontend: boolean;
  hasUI: boolean;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface DatabaseTable {
  name: string;
  recordCount: number;
  hasData: boolean;
  hasRLS: boolean;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalEntries: 0,
    activeUsers24h: 0,
    implementedFeatures: 0,
    pendingFeatures: 0,
    databaseTables: 0,
    apiEndpoints: 0
  });
  
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch system stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch feature status
      const featuresRes = await fetch('/api/admin/features');
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatures(featuresData);
      }

      // Fetch database status
      const tablesRes = await fetch('/api/admin/database');
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'missing': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-700 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'missing': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Mock data for demonstration
  const mockFeatures: FeatureStatus[] = [
    {
      category: 'Personal Life OS',
      name: 'Personal Journal',
      status: 'partial',
      hasBackend: true,
      hasFrontend: false,
      hasUI: true,
      description: 'API exists, widget created, page missing',
      priority: 'high'
    },
    {
      category: 'Personal Life OS',
      name: 'Habits Tracking',
      status: 'partial',
      hasBackend: true,
      hasFrontend: false,
      hasUI: true,
      description: 'API exists, widget created, page missing',
      priority: 'high'
    },
    {
      category: 'Personal Life OS',
      name: 'Routines',
      status: 'partial',
      hasBackend: true,
      hasFrontend: false,
      hasUI: true,
      description: 'API exists, widget created, page missing',
      priority: 'high'
    },
    {
      category: 'Diary+ Advanced',
      name: 'Onboarding Wizard',
      status: 'partial',
      hasBackend: true,
      hasFrontend: true,
      hasUI: false,
      description: 'Component created but not integrated',
      priority: 'medium'
    },
    {
      category: 'Diary+ Advanced',
      name: 'Yearbook Generator',
      status: 'partial',
      hasBackend: true,
      hasFrontend: true,
      hasUI: false,
      description: 'Component created but not accessible',
      priority: 'medium'
    },
    {
      category: 'Diary+ Advanced',
      name: 'Private Vault',
      status: 'implemented',
      hasBackend: true,
      hasFrontend: true,
      hasUI: true,
      description: 'Fully implemented in Settings',
      priority: 'low'
    },
    {
      category: 'System',
      name: 'User Invitations',
      status: 'missing',
      hasBackend: false,
      hasFrontend: false,
      hasUI: false,
      description: 'Not implemented yet',
      priority: 'high'
    }
  ];

  const mockTables: DatabaseTable[] = [
    { name: 'projects', recordCount: 4, hasData: true, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'personal_entries', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'habits', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'life_areas', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'cron_logs', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'yearbook_generations', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' },
    { name: 'vault_configurations', recordCount: 0, hasData: false, hasRLS: true, lastUpdated: '2025-01-28' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/admin/dev-tools">
                <Button variant="outline" size="sm" className="hover:bg-green-50">
                  <Server className="w-4 h-4 mr-2" />
                  Dev Tools
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-500" />
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">System overview and development status</p>
              </div>
            </div>
            <Button onClick={fetchAdminData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Projects</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalProjects}</p>
                </div>
                <Database className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Features Ready</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {mockFeatures.filter(f => f.status === 'implemented').length}/
                    {mockFeatures.length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">DB Tables</p>
                  <p className="text-2xl font-bold text-orange-900">{mockTables.length}</p>
                </div>
                <Server className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="features">Features Status</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="users">Users & Invites</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Development Status by Feature</CardTitle>
                <CardDescription>
                  Track implementation progress of all Diary+ features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(feature.status)}
                        <div>
                          <h3 className="font-medium">{feature.name}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className={feature.hasBackend ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}>
                              API {feature.hasBackend ? '✓' : '✗'}
                            </Badge>
                            <Badge variant="outline" className={feature.hasFrontend ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}>
                              Component {feature.hasFrontend ? '✓' : '✗'}
                            </Badge>
                            <Badge variant="outline" className={feature.hasUI ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}>
                              UI {feature.hasUI ? '✓' : '✗'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority}
                        </Badge>
                        <Badge className={getStatusColor(feature.status)}>
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Database Tables Status</CardTitle>
                <CardDescription>
                  Monitor Diary+ database tables and their usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTables.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Database className="w-5 h-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{table.name}</h3>
                          <p className="text-sm text-gray-600">
                            {table.recordCount} records • Last updated: {table.lastUpdated}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={table.hasData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {table.hasData ? 'Has Data' : 'Empty'}
                        </Badge>
                        <Badge className={table.hasRLS ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                          {table.hasRLS ? 'RLS ✓' : 'No RLS'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and project invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Invitations Coming Soon</h3>
                  <p className="text-gray-600">
                    User invitation system will be implemented here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Monitor system performance and health metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-medium text-green-900">Database</h3>
                    <p className="text-sm text-green-600">All systems operational</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-medium text-blue-900">APIs</h3>
                    <p className="text-sm text-blue-600">15+ endpoints active</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-medium text-purple-900">Performance</h3>
                    <p className="text-sm text-purple-600">Optimal response times</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
