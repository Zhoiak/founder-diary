"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, Database, TrendingUp, DollarSign, 
  Server, Zap, RefreshCw, AlertTriangle,
  BarChart3, Globe, HardDrive, Activity,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  total_users: number;
  active_users: number;
  total_entries: number;
  user_growth_rate: number;
  total_data_size_bytes: number;
  total_data_size_gb: number;
  avg_entries_per_user: number;
  estimated_monthly_bandwidth_gb: number;
  estimated_monthly_cost_usd: number;
  last_updated: string;
}

interface HostingOption {
  cost: number;
  bandwidth_limit: string;
  overage: string;
}

export default function AdminMetricsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [hostingAnalysis, setHostingAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadMetrics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data.dashboard);
        setTrends(data.trends);
        setHostingAnalysis(data.hosting_analysis);
      } else {
        toast.error('Failed to load metrics');
      }
    } catch (error) {
      toast.error('Error loading metrics');
    } finally {
      setLoading(false);
    }
  };

  const forceSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_sync' })
      });

      if (res.ok) {
        toast.success('Metrics synced successfully');
        await loadMetrics();
      } else {
        toast.error('Failed to sync metrics');
      }
    } catch (error) {
      toast.error('Error syncing metrics');
    } finally {
      setSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (rate < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getHostingRecommendation = () => {
    if (!dashboard || !hostingAnalysis) return null;

    const monthlyBandwidth = dashboard.estimated_monthly_bandwidth_gb;
    
    if (monthlyBandwidth < 100) {
      return { provider: "Vercel Pro", reason: "Low bandwidth, managed solution" };
    } else if (monthlyBandwidth < 1000) {
      return { provider: "Hetzner VPS", reason: "Cost-effective for medium bandwidth" };
    } else {
      return { provider: "Hetzner Dedicated", reason: "High bandwidth, best value" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading admin metrics...</p>
        </div>
      </div>
    );
  }

  const recommendation = getHostingRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  System Metrics & Analytics
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time monitoring and data collection analysis
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="text-green-600 border-green-200">
                Auto-sync: ON
              </Badge>
              <Button onClick={forceSync} disabled={syncing} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Force Sync'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboard?.total_users?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {getGrowthIcon(dashboard?.user_growth_rate || 0)}
                <span className={dashboard?.user_growth_rate > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(dashboard?.user_growth_rate || 0).toFixed(1)}%
                </span>
                <span className="text-gray-500">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Users (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboard?.active_users?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboard?.total_users > 0 
                  ? `${((dashboard.active_users / dashboard.total_users) * 100).toFixed(1)}% retention`
                  : '0% retention'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboard?.total_entries?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboard?.avg_entries_per_user?.toFixed(1) || 0} avg per user
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Data Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboard?.total_data_size_gb?.toFixed(2) || 0} GB
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {formatBytes(dashboard?.total_data_size_bytes || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hosting Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Server className="w-5 h-5 text-blue-600" />
                Current Hosting Analysis
              </CardTitle>
              <CardDescription>
                Bandwidth usage and cost projections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Monthly Bandwidth</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboard?.estimated_monthly_bandwidth_gb?.toFixed(1) || 0} GB
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboard?.estimated_monthly_cost_usd || 0)}
                  </div>
                </div>
              </div>
              
              {recommendation && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">Recommendation</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>{recommendation.provider}</strong> - {recommendation.reason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-purple-600" />
                Hosting Providers Comparison
              </CardTitle>
              <CardDescription>
                Cost analysis for different providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hostingAnalysis?.cost_breakdown && (
                <div className="space-y-3">
                  {Object.entries(hostingAnalysis.cost_breakdown).map(([provider, data]: [string, any]) => (
                    <div key={provider} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {provider.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {data.bandwidth_limit} included
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${data.cost}/mo</div>
                        <div className="text-sm text-gray-600">
                          {data.overage} overage
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Collection Stats */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              Data Collection Capacity
            </CardTitle>
            <CardDescription>
              Real-time monitoring of data collection systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends?.data_collection && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trends.data_collection.map((stat: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">
                        {stat.collection_type.replace('_', ' ')}
                      </h4>
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Records: </span>
                        <span className="font-bold">{stat.total_records?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Size: </span>
                        <span className="font-bold">{formatBytes(stat.data_size_bytes)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Quality: </span>
                        <span className="font-bold text-green-600">
                          {((stat.quality_score || 0.8) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monetization Potential */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              Monetization Potential
            </CardTitle>
            <CardDescription>
              Revenue projections based on current data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">AI Coaching</h4>
                <div className="text-3xl font-bold text-yellow-700 mb-2">
                  {formatCurrency((dashboard?.active_users || 0) * 29)}
                </div>
                <div className="text-sm text-yellow-600">
                  Potential MRR at $29/user
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Enterprise</h4>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {formatCurrency(Math.floor((dashboard?.total_users || 0) / 50) * 99)}
                </div>
                <div className="text-sm text-blue-600">
                  Team plans at $99/team
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Data API</h4>
                <div className="text-3xl font-bold text-green-700 mb-2">
                  {formatCurrency((dashboard?.total_entries || 0) * 0.001)}
                </div>
                <div className="text-sm text-green-600">
                  API calls at $0.001/query
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Last updated: {dashboard?.last_updated ? new Date(dashboard.last_updated).toLocaleString() : 'Never'}
        </div>
      </main>
    </div>
  );
}
