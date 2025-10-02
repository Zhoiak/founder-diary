"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Server, Database, Layers, Activity, HardDrive, BarChart3 } from "lucide-react";

interface Service {
  name: string;
  description: string;
  url: string;
  port: number;
  icon: React.ReactNode;
  status?: "online" | "offline" | "checking";
  credentials?: {
    username?: string;
    password?: string;
  };
}

export default function DevToolsPage() {
  const [services, setServices] = useState<Service[]>([
    {
      name: "Dokploy",
      description: "Docker orchestration and deployment management",
      url: "https://panel.founder-diary.com",
      port: 3000,
      icon: <Server className="h-6 w-6" />,
      status: "checking",
    },
    {
      name: "pgAdmin",
      description: "PostgreSQL database administration",
      url: "https://pg.founder-diary.com",
      port: 5433,
      icon: <Database className="h-6 w-6" />,
      status: "checking",
      credentials: {
        username: "admin@founder-diary.com",
      },
    },
    {
      name: "Redis Commander",
      description: "Redis cache and session management",
      url: "http://85.10.194.199:6380",
      port: 6380,
      icon: <Layers className="h-6 w-6" />,
      status: "checking",
    },
    {
      name: "Grafana",
      description: "Metrics and monitoring (Coming soon)",
      url: "#",
      port: 3001,
      icon: <BarChart3 className="h-6 w-6" />,
      status: "offline",
    },
    {
      name: "MinIO Console",
      description: "S3-compatible file storage (Coming soon)",
      url: "#",
      port: 9001,
      icon: <HardDrive className="h-6 w-6" />,
      status: "offline",
    },
  ]);

  useEffect(() => {
    // Check service status
    const checkServices = async () => {
      const updatedServices = await Promise.all(
        services.map(async (service) => {
          if (service.status === "offline") return service;

          try {
            const response = await fetch(`/api/admin/check-service?url=${encodeURIComponent(service.url)}`, {
              method: "GET",
              signal: AbortSignal.timeout(5000),
            });
            
            return {
              ...service,
              status: (response.ok ? "online" : "offline") as "online" | "offline" | "checking",
            };
          } catch (error) {
            return {
              ...service,
              status: "offline" as "online" | "offline" | "checking",
            };
          }
        })
      );
      setServices(updatedServices);
    };

    checkServices();
    const interval = setInterval(checkServices, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "checking":
        return "bg-yellow-500 animate-pulse";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "checking":
        return "Checking...";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dev Tools Panel</h1>
          <p className="text-muted-foreground mt-2">
            Centralized access to all development and infrastructure tools
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Server: 85.10.194.199
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.name} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {service.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${getStatusColor(service.status)}`}
                    >
                      <span className="text-white text-xs">
                        {getStatusText(service.status)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-2">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Port:</span>
                <code className="px-2 py-1 rounded bg-muted">{service.port}</code>
              </div>

              {service.credentials && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">
                    Credentials:
                  </p>
                  {service.credentials.username && (
                    <div className="flex items-center justify-between text-xs">
                      <span>Username:</span>
                      <code className="px-2 py-0.5 rounded bg-background">
                        {service.credentials.username}
                      </code>
                    </div>
                  )}
                  {service.credentials.password && (
                    <div className="flex items-center justify-between text-xs">
                      <span>Password:</span>
                      <code className="px-2 py-0.5 rounded bg-background">
                        {service.credentials.password}
                      </code>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                variant={service.status === "online" ? "default" : "outline"}
                disabled={service.status === "offline" || service.url === "#"}
                asChild={service.status === "online" && service.url !== "#"}
              >
                {service.status === "online" && service.url !== "#" ? (
                  <a href={service.url} target="_blank" rel="noopener noreferrer">
                    Open Tool
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <span>
                    {service.status === "offline" ? "Coming Soon" : "Open Tool"}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Info</CardTitle>
          <CardDescription>Important server and infrastructure details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Server IP</p>
              <code className="text-sm px-2 py-1 rounded bg-muted">85.10.194.199</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Main Domain</p>
              <code className="text-sm px-2 py-1 rounded bg-muted">founder-diary.com</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Docker Network</p>
              <code className="text-sm px-2 py-1 rounded bg-muted">founder-diary-network</code>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Environment</p>
              <Badge>Production</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <Activity className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This panel is only accessible to admin users. All connections to external tools
            should be made through secure channels (HTTPS/SSH). Never share credentials in
            public channels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
