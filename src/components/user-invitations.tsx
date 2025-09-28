"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  UserPlus, Mail, Clock, CheckCircle, XCircle, 
  Trash2, Send, Users, Shield, Eye, Settings
} from "lucide-react";

interface Invitation {
  id: string;
  invited_email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  projects: { name: string };
}

interface UserInvitationsProps {
  projectId: string;
  projectName: string;
  userRole: string;
  className?: string;
}

export function UserInvitations({ projectId, projectName, userRole, className }: UserInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchInvitations();
    }
  }, [projectId]);

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations`);
      if (!res.ok) throw new Error("Failed to fetch invitations");
      
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          message: message.trim()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully!");
      
      // Reset form
      setEmail('');
      setRole('member');
      setMessage('');
      setDialogOpen(false);
      
      // Refresh invitations
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
      console.error("Error sending invitation:", error);
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations?invitationId=${invitationId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invitation");
      console.error("Error cancelling invitation:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4 text-red-500" />;
      case 'admin': return <Settings className="w-4 h-4 text-orange-500" />;
      case 'member': return <Users className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const canManageInvitations = ['owner', 'admin'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Team Members & Invitations
            </CardTitle>
            <CardDescription>
              Manage who has access to "{projectName}"
            </CardDescription>
          </div>
          {canManageInvitations && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    Invite User to {projectName}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-500" />
                            Viewer - Read only access
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Member - Can create and edit
                          </div>
                        </SelectItem>
                        {userRole === 'owner' && (
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-orange-500" />
                              Admin - Can manage users
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Input
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Join me on this project..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={sendInvitation} disabled={inviting}>
                      {inviting ? "Sending..." : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations yet</h3>
            <p className="text-gray-600 mb-4">
              Invite team members to collaborate on this project
            </p>
            {canManageInvitations && (
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Send First Invitation
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
                {canManageInvitations && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.invited_email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invitation.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(invitation.status)}
                        {invitation.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </TableCell>
                  {canManageInvitations && (
                    <TableCell>
                      {invitation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
