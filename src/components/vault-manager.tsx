"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Shield, Lock, Unlock, Key, AlertTriangle, CheckCircle, 
  Clock, Trash2, Archive, Bell, Settings, Eye, EyeOff,
  Calendar, Database, FileText
} from "lucide-react";

interface VaultConfig {
  id: string;
  isEnabled: boolean;
  setupAt: string;
  passwordStrengthScore: number;
  lastAccessedAt?: string;
}

interface RetentionPolicy {
  enabled: boolean;
  delete_after_months: number;
  archive_after_months: number;
  notify_before_days: number;
}

interface RetentionLog {
  id: string;
  action_type: 'archive' | 'delete' | 'notify' | 'restore';
  table_name: string;
  record_count: number;
  executed_at: string;
  dry_run: boolean;
  status: 'pending' | 'completed' | 'failed';
}

interface VaultManagerProps {
  projectId: string;
  className?: string;
}

export function VaultManager({ projectId, className }: VaultManagerProps) {
  const [vaultConfig, setVaultConfig] = useState<VaultConfig | null>(null);
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>({
    enabled: false,
    delete_after_months: 18,
    archive_after_months: 12,
    notify_before_days: 30
  });
  const [retentionLogs, setRetentionLogs] = useState<RetentionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [retentionDialogOpen, setRetentionDialogOpen] = useState(false);

  // Setup form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [settingUp, setSettingUp] = useState(false);

  // Retention form state
  const [updatingRetention, setUpdatingRetention] = useState(false);
  const [applyingRetention, setApplyingRetention] = useState(false);

  useEffect(() => {
    fetchVaultConfig();
    fetchRetentionPolicy();
  }, [projectId]);

  useEffect(() => {
    if (password) {
      validatePasswordStrength(password);
    }
  }, [password]);

  const fetchVaultConfig = async () => {
    try {
      const res = await fetch(`/api/vault/setup?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch vault config");
      
      const data = await res.json();
      setVaultConfig(data.vault);
    } catch (error) {
      console.error("Error fetching vault config:", error);
    }
  };

  const fetchRetentionPolicy = async () => {
    try {
      const res = await fetch(`/api/vault/retention?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch retention policy");
      
      const data = await res.json();
      setRetentionPolicy(data.retentionPolicy);
      setRetentionLogs(data.logs);
    } catch (error) {
      console.error("Error fetching retention policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordStrength = async (pwd: string) => {
    // Simple client-side validation
    const feedback: string[] = [];
    let score = 0;

    if (pwd.length >= 12) score += 2;
    else if (pwd.length >= 8) {
      score += 1;
      feedback.push('Consider using a longer password (12+ characters)');
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('Add numbers');
    
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('Add special characters');

    if (!/(.)\1{2,}/.test(pwd)) score += 1;
    if (!/123|abc|qwe/i.test(pwd)) score += 1;

    setPasswordStrength({ score, feedback });
  };

  const setupVault = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (passwordStrength.score < 6) {
      toast.error("Password is too weak");
      return;
    }

    setSettingUp(true);
    try {
      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          password,
          confirmPassword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to setup vault");
      }
      
      const data = await res.json();
      toast.success("Private Vault setup completed!");
      
      setVaultConfig(data.vault);
      setSetupDialogOpen(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || "Failed to setup vault");
      console.error("Error setting up vault:", error);
    } finally {
      setSettingUp(false);
    }
  };

  const updateRetentionPolicy = async () => {
    setUpdatingRetention(true);
    try {
      const res = await fetch("/api/vault/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          enabled: retentionPolicy.enabled,
          deleteAfterMonths: retentionPolicy.delete_after_months,
          archiveAfterMonths: retentionPolicy.archive_after_months,
          notifyBeforeDays: retentionPolicy.notify_before_days
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update retention policy");
      }
      
      toast.success("Retention policy updated successfully!");
      setRetentionDialogOpen(false);
      fetchRetentionPolicy();
    } catch (error: any) {
      toast.error(error.message || "Failed to update retention policy");
      console.error("Error updating retention policy:", error);
    } finally {
      setUpdatingRetention(false);
    }
  };

  const applyRetentionPolicy = async (dryRun: boolean = true) => {
    setApplyingRetention(true);
    try {
      const res = await fetch(`/api/vault/retention?projectId=${projectId}&dryRun=${dryRun}`, {
        method: "PUT"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to apply retention policy");
      }
      
      const data = await res.json();
      toast.success(dryRun 
        ? "Retention policy simulation completed - check logs for details" 
        : "Retention policy applied successfully!"
      );
      
      fetchRetentionPolicy();
    } catch (error: any) {
      toast.error(error.message || "Failed to apply retention policy");
      console.error("Error applying retention policy:", error);
    } finally {
      setApplyingRetention(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 4) return 'bg-red-500';
    if (score < 6) return 'bg-yellow-500';
    if (score < 8) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (score: number) => {
    if (score < 4) return 'Weak';
    if (score < 6) return 'Fair';
    if (score < 8) return 'Good';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Private Vault & Data Retention
          </h2>
          <p className="text-gray-600 mt-1">
            Manage encryption and data retention policies for your personal information
          </p>
        </div>
      </div>

      {/* Vault Status */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              vaultConfig?.isEnabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {vaultConfig?.isEnabled ? (
                <Lock className="w-5 h-5 text-green-600" />
              ) : (
                <Unlock className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                Private Vault {vaultConfig?.isEnabled ? 'Enabled' : 'Disabled'}
              </h3>
              <p className="text-sm text-gray-600 font-normal">
                {vaultConfig?.isEnabled 
                  ? 'Your sensitive data is encrypted and protected'
                  : 'Set up encryption to protect your sensitive entries'
                }
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vaultConfig?.isEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Encryption Active</p>
                <p className="text-sm text-gray-600">AES-256-GCM</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <Key className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Password Strength</p>
                <p className="text-sm text-gray-600">
                  {getPasswordStrengthLabel(vaultConfig.passwordStrengthScore)}/10
                </p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Setup Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(vaultConfig.setupAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Private Vault</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Encrypt your sensitive journal entries with a master password. 
                Only you will be able to decrypt and read this content.
              </p>
              <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Lock className="w-4 h-4 mr-2" />
                    Setup Private Vault
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      Setup Private Vault
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        <strong>Important:</strong> Your master password cannot be recovered. 
                        Make sure to remember it or store it securely.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Master Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a strong password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(passwordStrength.score / 8) * 100} 
                              className="flex-1 h-2"
                            />
                            <span className="text-sm font-medium">
                              {getPasswordStrengthLabel(passwordStrength.score)}
                            </span>
                          </div>
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {passwordStrength.feedback.map((item, index) => (
                                <li key={index}>• {item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={setupVault} 
                        disabled={settingUp || passwordStrength.score < 6 || password !== confirmPassword}
                      >
                        {settingUp ? "Setting up..." : "Setup Vault"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention Policy */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-600" />
                Data Retention Policy
              </CardTitle>
              <CardDescription>
                Automatically archive or delete old entries to manage storage and privacy
              </CardDescription>
            </div>
            <Dialog open={retentionDialogOpen} onOpenChange={setRetentionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Archive className="w-5 h-5 text-blue-500" />
                    Configure Data Retention
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="retentionEnabled">Enable Data Retention</Label>
                      <p className="text-sm text-gray-600">Automatically manage old data</p>
                    </div>
                    <Switch
                      id="retentionEnabled"
                      checked={retentionPolicy.enabled}
                      onCheckedChange={(enabled) => 
                        setRetentionPolicy(prev => ({ ...prev, enabled }))
                      }
                    />
                  </div>

                  {retentionPolicy.enabled && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="archiveAfter">Archive After (months)</Label>
                          <Input
                            id="archiveAfter"
                            type="number"
                            min="1"
                            max="120"
                            value={retentionPolicy.archive_after_months}
                            onChange={(e) => 
                              setRetentionPolicy(prev => ({ 
                                ...prev, 
                                archive_after_months: parseInt(e.target.value) || 12 
                              }))
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Entries will be encrypted and content hidden
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="deleteAfter">Delete After (months)</Label>
                          <Input
                            id="deleteAfter"
                            type="number"
                            min="1"
                            max="120"
                            value={retentionPolicy.delete_after_months}
                            onChange={(e) => 
                              setRetentionPolicy(prev => ({ 
                                ...prev, 
                                delete_after_months: parseInt(e.target.value) || 18 
                              }))
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Entries will be permanently deleted
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notifyBefore">Notify Before (days)</Label>
                        <Input
                          id="notifyBefore"
                          type="number"
                          min="1"
                          max="90"
                          value={retentionPolicy.notify_before_days}
                          onChange={(e) => 
                            setRetentionPolicy(prev => ({ 
                              ...prev, 
                              notify_before_days: parseInt(e.target.value) || 30 
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          You'll be notified before any action is taken
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          Deleted data cannot be recovered. Make sure to export important entries first.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setRetentionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateRetentionPolicy} disabled={updatingRetention}>
                      {updatingRetention ? "Updating..." : "Save Policy"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                retentionPolicy.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {retentionPolicy.enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <p className="font-medium text-gray-900">Status</p>
              <p className="text-sm text-gray-600">
                {retentionPolicy.enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Archive className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Archive After</p>
              <p className="text-sm text-gray-600">
                {retentionPolicy.archive_after_months} months
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Trash2 className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Delete After</p>
              <p className="text-sm text-gray-600">
                {retentionPolicy.delete_after_months} months
              </p>
            </div>
          </div>

          {retentionPolicy.enabled && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => applyRetentionPolicy(true)}
                disabled={applyingRetention}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Changes
              </Button>
              <Button
                onClick={() => applyRetentionPolicy(false)}
                disabled={applyingRetention}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {applyingRetention ? "Applying..." : "Apply Policy"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retention Logs */}
      {retentionLogs.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Retention Activity Log
            </CardTitle>
            <CardDescription>
              Recent data retention actions and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retentionLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.action_type === 'archive' && <Archive className="w-4 h-4 text-blue-500" />}
                        {log.action_type === 'delete' && <Trash2 className="w-4 h-4 text-red-500" />}
                        {log.action_type === 'notify' && <Bell className="w-4 h-4 text-yellow-500" />}
                        <span className="capitalize">{log.action_type}</span>
                        {log.dry_run && <Badge variant="outline" className="text-xs">Preview</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{log.table_name}</TableCell>
                    <TableCell>{log.record_count}</TableCell>
                    <TableCell>
                      {new Date(log.executed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.status === 'completed' ? 'default' : 'secondary'}
                        className={log.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
