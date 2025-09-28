"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, Search, Users, Send, Check, X, 
  Clock, UserPlus, MessageSquare, Hash,
  Eye, EyeOff, Settings, Bell, Handshake
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserProfile {
  id: string;
  user_id: string;
  user_number: number;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_discoverable: boolean;
}

interface CollaborationRequest {
  id: string;
  requester_id: string;
  target_id: string;
  project_id: string;
  message: string;
  status: string;
  permissions: string[];
  created_at: string;
  requester: {
    user_number: number;
    display_name: string;
    avatar_url: string;
  };
  target: {
    user_number: number;
    display_name: string;
    avatar_url: string;
  };
  project: {
    name: string;
    description: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  // Form states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [collaborationMessage, setCollaborationMessage] = useState('');
  const [permissions, setPermissions] = useState(['read']);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadMyProfile(),
      loadRequests(),
      loadProjects()
    ]);
  };

  const loadMyProfile = async () => {
    try {
      const res = await fetch('/api/collaboration/users');
      if (res.ok) {
        const data = await res.json();
        // The API returns other users, we need to get our own profile differently
        // For now, we'll create a placeholder
        setMyProfile({
          id: 'current-user',
          user_id: 'current-user',
          user_number: 0, // Will be loaded from backend
          display_name: 'Your Profile',
          bio: '',
          avatar_url: '',
          is_discoverable: true
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/collaboration/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const isUserNumber = searchQuery.startsWith('#') || /^\d+$/.test(searchQuery);
      const params = new URLSearchParams();
      
      if (isUserNumber) {
        params.append('userNumber', searchQuery);
      } else {
        params.append('search', searchQuery);
      }

      const res = await fetch(`/api/collaboration/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
        if (data.users.length === 0) {
          toast.info('No users found');
        }
      } else {
        toast.error('Error searching users');
      }
    } catch (error) {
      toast.error('Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const sendCollaborationRequest = async () => {
    if (!selectedUser || !selectedProject || !collaborationMessage.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/collaboration/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_number: selectedUser.user_number,
          project_id: selectedProject,
          message: collaborationMessage,
          permissions
        })
      });

      if (res.ok) {
        toast.success('Collaboration request sent!');
        setSelectedUser(null);
        setSelectedProject('');
        setCollaborationMessage('');
        setPermissions(['read']);
        await loadRequests();
        setActiveTab('requests');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error sending request');
      }
    } catch (error) {
      toast.error('Error sending request');
    }
  };

  const handleRequestAction = async (requestId: string, action: string) => {
    try {
      const res = await fetch(`/api/collaboration/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        toast.success(`Request ${action}ed successfully`);
        await loadRequests();
      } else {
        const error = await res.json();
        toast.error(error.error || `Error ${action}ing request`);
      }
    } catch (error) {
      toast.error(`Error ${action}ing request`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                  <Handshake className="w-6 h-6 text-blue-600" />
                  Collaboration Hub
                </h1>
                <p className="text-sm text-gray-600 mt-1">Connect and collaborate with other users</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Hash className="w-3 h-3 mr-1" />
                {myProfile?.user_number || '####'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Users
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Requests
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">
                  {requests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600" />
                  Find Users to Collaborate
                </CardTitle>
                <CardDescription>
                  Search by user number (#1234) or name to find potential collaborators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search by #1234 or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    className="flex-1"
                  />
                  <Button onClick={searchUsers} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid gap-4 mt-6">
                    {searchResults.map((user) => (
                      <Card key={user.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                #{user.user_number}
                              </div>
                              <div>
                                <h4 className="font-semibold">{user.display_name}</h4>
                                <p className="text-sm text-gray-600">#{user.user_number}</p>
                                {user.bio && (
                                  <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setActiveTab('requests');
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Invite
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Invitation Form */}
            {selectedUser && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Send className="w-5 h-5" />
                    Send Collaboration Request
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Invite {selectedUser.display_name} (#{selectedUser.user_number}) to collaborate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      placeholder="Hi! I'd like to collaborate with you on this project..."
                      value={collaborationMessage}
                      onChange={(e) => setCollaborationMessage(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={sendCollaborationRequest}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Request
                    </Button>
                    <Button
                      onClick={() => setSelectedUser(null)}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid gap-6">
              {requests.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Collaboration Requests</h3>
                    <p className="text-gray-600 text-center">
                      Start by searching for users to collaborate with, or wait for others to find you!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            Collaboration Request
                          </CardTitle>
                          <CardDescription>
                            {request.requester.display_name} (#{request.requester.user_number}) → {request.target.display_name} (#{request.target.user_number})
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium">Project: {request.project?.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                      </div>

                      <div className="flex gap-2">
                        {request.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'accept')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, 'reject')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  My Collaboration Profile
                </CardTitle>
                <CardDescription>
                  Manage how other users can find and collaborate with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    #{myProfile?.user_number || '####'}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{myProfile?.display_name}</h3>
                  <p className="text-gray-600">Your unique collaboration number</p>
                  <p className="text-sm text-gray-500 mt-4">
                    Share your number with others so they can find and collaborate with you!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
