"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Play, RefreshCw,
  Calendar, Mail, Sunrise, Moon, Package
} from "lucide-react";
import Link from "next/link";

interface CronLog {
  id: string;
  job_type: string;
  executed_at: string;
  processed_count: number;
  successful_count: number;
  error_message?: string;
  status: 'completed' | 'failed' | 'running';
  execution_time_ms?: number;
}

interface CronSummary {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  job_types: string[];
  last_7_days: any[];
}

const cronJobs = [
  {
    id: 'morning-routine',
    name: 'Morning Routine Reminders',
    description: 'Send morning routine prompts to users at 7:00 AM',
    schedule: '0 7 * * *',
    icon: Sunrise,
    color: 'text-yellow-500'
  },
  {
    id: 'evening-nudge',
    name: 'Evening Journal Nudges',
    description: 'Remind users to journal at 9:00 PM',
    schedule: '0 21 * * *',
    icon: Moon,
    color: 'text-purple-500'
  },
  {
    id: 'time-capsules',
    name: 'Time Capsule Delivery',
    description: 'Deliver time capsules when due (hourly check)',
    schedule: '0 */1 * * *',
    icon: Package,
    color: 'text-blue-500'
  }
];

export default function CronAdminPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [summary, setSummary] = useState<CronSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchCronLogs();
  }, [selectedJobType]);

  const fetchCronLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedJobType !== "all") {
        params.append("jobType", selectedJobType);
      }
      params.append("limit", "20");

      const res = await fetch(`/api/cron/logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch cron logs");
      
      const data = await res.json();
      setLogs(data.logs);
      setSummary(data.summary);
    } catch (error) {
      toast.error("Failed to load cron logs");
      console.error("Error fetching cron logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCronJob = async (jobType: string) => {
    setTriggering(jobType);
    try {
      const res = await fetch("/api/cron/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType })
      });

      if (!res.ok) throw new Error("Failed to trigger cron job");
      
      const data = await res.json();
      toast.success(`${jobType} job triggered successfully`);
      
      // Refresh logs after a short delay
      setTimeout(fetchCronLogs, 2000);
    } catch (error) {
      toast.error(`Failed to trigger ${jobType} job`);
      console.error("Error triggering cron job:", error);
    } finally {
      setTriggering(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobIcon = (jobType: string) => {
    const job = cronJobs.find(j => j.id === jobType);
    if (!job) return <Clock className="w-4 h-4" />;
    const Icon = job.icon;
    return <Icon className={`w-4 h-4 ${job.color}`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading cron logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Cron Jobs
                </h1>
                <p className="text-sm text-gray-600 mt-1">Monitor and manage scheduled tasks</p>
              </div>
            </div>
            <Button onClick={fetchCronLogs} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{summary.total_executions}</p>
                      <p className="text-sm text-gray-600">Total Executions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{summary.successful_executions}</p>
                      <p className="text-sm text-gray-600">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{summary.failed_executions}</p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{summary.job_types.length}</p>
                      <p className="text-sm text-gray-600">Job Types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cron Jobs Overview */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>
                Configured cron jobs and their schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cronJobs.map((job) => {
                  const Icon = job.icon;
                  return (
                    <div key={job.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Icon className={`w-4 h-4 ${job.color}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{job.name}</h4>
                            <p className="text-xs text-gray-500 font-mono">{job.schedule}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerCronJob(job.id)}
                          disabled={triggering === job.id}
                        >
                          {triggering === job.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Execution Logs */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>
                    Recent cron job executions and their results
                  </CardDescription>
                </div>
                <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {cronJobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No execution logs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Executed At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Successful</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getJobIcon(log.job_type)}
                            <span className="font-medium">{log.job_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.executed_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>{log.processed_count}</TableCell>
                        <TableCell>{log.successful_count}</TableCell>
                        <TableCell>
                          {log.error_message && (
                            <span className="text-red-600 text-sm truncate max-w-xs block">
                              {log.error_message}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
