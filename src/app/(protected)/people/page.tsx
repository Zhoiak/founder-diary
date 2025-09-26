"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, ArrowLeft, Users, Phone, Mail, MessageCircle, 
  Calendar, Gift, Clock, Heart, Star, Cake,
  MapPin, Edit, MoreHorizontal, Video
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Person {
  id: string;
  name: string;
  aka?: string;
  tags: string[];
  birthday?: string;
  timezone: string;
  email?: string;
  phone?: string;
  notes_md?: string;
  relationship_type?: string;
  importance: number;
  last_contact?: string;
  interaction_count: number;
  last_interaction_date?: string;
  days_since_last_contact?: number;
  days_until_birthday?: number;
  avg_sentiment?: number;
  created_at: string;
}

interface Interaction {
  id: string;
  date: string;
  type: 'call' | 'text' | 'email' | 'meet' | 'gift' | 'other';
  notes_md?: string;
  sentiment?: number;
  duration_minutes?: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  birthday: string;
  days_until_birthday: number;
  upcoming_birthday: string;
  turning_age: number;
}

const interactionTypes = {
  call: { icon: Phone, label: "Phone Call", color: "text-green-600" },
  text: { icon: MessageCircle, label: "Text/Message", color: "text-blue-600" },
  email: { icon: Mail, label: "Email", color: "text-purple-600" },
  meet: { icon: Users, label: "In Person", color: "text-orange-600" },
  gift: { icon: Gift, label: "Gift/Card", color: "text-pink-600" },
  other: { icon: MoreHorizontal, label: "Other", color: "text-gray-600" }
};

const importanceLabels = {
  1: { label: "Acquaintance", color: "text-gray-500" },
  2: { label: "Friend", color: "text-blue-500" },
  3: { label: "Good Friend", color: "text-green-500" },
  4: { label: "Close Friend", color: "text-orange-500" },
  5: { label: "Family/VIP", color: "text-red-500" }
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  // Form data for new person
  const [formData, setFormData] = useState({
    name: "",
    aka: "",
    tags: "",
    birthday: "",
    timezone: "UTC",
    email: "",
    phone: "",
    notes_md: "",
    relationship_type: "",
    importance: 3
  });

  // Form data for new interaction
  const [interactionData, setInteractionData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "other" as const,
    notes_md: "",
    sentiment: "",
    duration_minutes: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchPeople();
      fetchUpcomingBirthdays();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
      
      // Look for "Personal" project or use first project
      const personalProject = data.projects?.find((p: Project) => p.name === "Personal");
      if (personalProject) {
        setSelectedProject(personalProject.id);
      } else if (data.projects?.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/people?projectId=${selectedProject}`);
      if (!res.ok) throw new Error("Failed to fetch people");
      const data = await res.json();
      setPeople(data.people || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load people");
    }
  };

  const fetchUpcomingBirthdays = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await fetch(`/api/people/birthdays?projectId=${selectedProject}&days=30`);
      if (!res.ok) throw new Error("Failed to fetch birthdays");
      const data = await res.json();
      setUpcomingBirthdays(data.birthdays || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load birthdays");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      aka: "",
      tags: "",
      birthday: "",
      timezone: "UTC",
      email: "",
      phone: "",
      notes_md: "",
      relationship_type: "",
      importance: 3
    });
  };

  const resetInteractionForm = () => {
    setInteractionData({
      date: new Date().toISOString().split('T')[0],
      type: "other",
      notes_md: "",
      sentiment: "",
      duration_minutes: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          name: formData.name,
          aka: formData.aka || undefined,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          birthday: formData.birthday || undefined,
          timezone: formData.timezone,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes_md: formData.notes_md || undefined,
          relationship_type: formData.relationship_type || undefined,
          importance: formData.importance,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create person");
      }
      
      const data = await res.json();
      setPeople([...people, { ...data.person, interaction_count: 0 }]);
      resetForm();
      setDialogOpen(false);
      toast.success("Person added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create person");
    } finally {
      setCreating(false);
    }
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;

    try {
      const res = await fetch(`/api/people/${selectedPerson.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: interactionData.date,
          type: interactionData.type,
          notes_md: interactionData.notes_md || undefined,
          sentiment: interactionData.sentiment ? parseInt(interactionData.sentiment) : undefined,
          duration_minutes: interactionData.duration_minutes ? parseInt(interactionData.duration_minutes) : undefined,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to log interaction");
      }
      
      // Refresh people data to update stats
      fetchPeople();
      resetInteractionForm();
      setInteractionDialogOpen(false);
      setSelectedPerson(null);
      toast.success("Interaction logged!");
    } catch (err: any) {
      toast.error(err.message || "Failed to log interaction");
    }
  };

  const openInteractionDialog = (person: Person) => {
    setSelectedPerson(person);
    setInteractionDialogOpen(true);
  };

  const getContactFrequency = (daysSince: number | null) => {
    if (daysSince === null) return { label: "Never", color: "text-gray-500" };
    if (daysSince <= 7) return { label: "Recent", color: "text-green-500" };
    if (daysSince <= 30) return { label: "This month", color: "text-blue-500" };
    if (daysSince <= 90) return { label: "This quarter", color: "text-yellow-500" };
    return { label: "Long time", color: "text-red-500" };
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
              <h1 className="text-2xl font-bold text-gray-900">Relationships</h1>
            </div>
            <div className="flex items-center gap-4">
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Person</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aka">Nickname</Label>
                        <Input
                          id="aka"
                          value={formData.aka}
                          onChange={(e) => setFormData({ ...formData, aka: e.target.value })}
                          placeholder="Johnny"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input
                          id="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship</Label>
                        <Input
                          id="relationship"
                          value={formData.relationship_type}
                          onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                          placeholder="Friend, Colleague, Family..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="importance">Importance</Label>
                      <Select 
                        value={formData.importance.toString()} 
                        onValueChange={(value) => setFormData({ ...formData, importance: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(importanceLabels).map(([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="work, college, neighbor"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes_md}
                        onChange={(e) => setFormData({ ...formData, notes_md: e.target.value })}
                        placeholder="Any additional notes about this person..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                      {creating ? "Adding..." : "Add Person"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedProject ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-600 text-center">
                Select a project to manage your relationships and contacts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cake className="w-5 h-5 text-pink-500" />
                    Upcoming Birthdays
                  </CardTitle>
                  <CardDescription>
                    Don't forget to reach out!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingBirthdays.slice(0, 6).map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-pink-50 to-purple-50"
                      >
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-sm text-gray-600">
                            {person.days_until_birthday === 0 ? "Today!" :
                             person.days_until_birthday === 1 ? "Tomorrow" :
                             `In ${person.days_until_birthday} days`}
                          </div>
                          <div className="text-xs text-gray-500">
                            Turning {person.turning_age}
                          </div>
                        </div>
                        <Cake className="w-6 h-6 text-pink-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* People List */}
            {people.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No People Yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Start building your personal CRM by adding people you want to stay in touch with.
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Person
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {people.map((person) => {
                  const contactFreq = getContactFrequency(person.days_since_last_contact);
                  const ImportanceIcon = Star;
                  
                  return (
                    <Card key={person.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {person.name}
                              {person.aka && (
                                <span className="text-sm text-gray-500 font-normal">
                                  ({person.aka})
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              {person.relationship_type && (
                                <span>{person.relationship_type}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <ImportanceIcon className="w-3 h-3 text-yellow-500" />
                                <span className={importanceLabels[person.importance as keyof typeof importanceLabels].color}>
                                  {importanceLabels[person.importance as keyof typeof importanceLabels].label}
                                </span>
                              </div>
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInteractionDialog(person)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          {person.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{person.email}</span>
                            </div>
                          )}
                          {person.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{person.phone}</span>
                            </div>
                          )}
                          {person.birthday && (
                            <div className="flex items-center gap-2 text-sm">
                              <Cake className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {new Date(person.birthday).toLocaleDateString()}
                                {person.days_until_birthday !== undefined && person.days_until_birthday <= 30 && (
                                  <span className="ml-2 text-pink-600 font-medium">
                                    ({person.days_until_birthday === 0 ? "Today!" : 
                                      person.days_until_birthday === 1 ? "Tomorrow" :
                                      `${person.days_until_birthday} days`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Last Contact */}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Last contact:</span>
                            <span className={contactFreq.color}>
                              {person.last_interaction_date ? 
                                new Date(person.last_interaction_date).toLocaleDateString() : 
                                "Never"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-500">Interactions:</span>
                            <span className="text-gray-700">{person.interaction_count}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {person.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {person.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Notes Preview */}
                        {person.notes_md && (
                          <div className="text-sm text-gray-600 line-clamp-2">
                            <ReactMarkdown>{person.notes_md}</ReactMarkdown>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interaction Dialog */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Log Interaction with {selectedPerson?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInteractionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="int-date">Date</Label>
                <Input
                  id="int-date"
                  type="date"
                  value={interactionData.date}
                  onChange={(e) => setInteractionData({ ...interactionData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="int-type">Type</Label>
                <Select 
                  value={interactionData.type} 
                  onValueChange={(value: any) => setInteractionData({ ...interactionData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(interactionTypes).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sentiment">How was it? (1-5)</Label>
                <Select 
                  value={interactionData.sentiment} 
                  onValueChange={(value) => setInteractionData({ ...interactionData, sentiment: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate the interaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">😞 Difficult</SelectItem>
                    <SelectItem value="2">😕 Challenging</SelectItem>
                    <SelectItem value="3">😐 Neutral</SelectItem>
                    <SelectItem value="4">😊 Good</SelectItem>
                    <SelectItem value="5">😄 Great</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={interactionData.duration_minutes}
                  onChange={(e) => setInteractionData({ ...interactionData, duration_minutes: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="int-notes">Notes</Label>
              <Textarea
                id="int-notes"
                value={interactionData.notes_md}
                onChange={(e) => setInteractionData({ ...interactionData, notes_md: e.target.value })}
                placeholder="What did you talk about? Any follow-ups needed?"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setInteractionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Log Interaction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
