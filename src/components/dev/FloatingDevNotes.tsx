"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  StickyNote, X, Plus, Send, Bug, Lightbulb, 
  Wrench, CheckSquare, Minimize2, Maximize2,
  MapPin, Clock, ArrowRight, Trash2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DevNote {
  id: string;
  page_url: string;
  page_title: string;
  section_context: string;
  note_content: string;
  note_type: string;
  priority: number;
  status: string;
  created_at: string;
  converted_to_todo_id?: string;
}

interface FloatingDevNotesProps {
  isAdmin?: boolean;
  userNumber?: number;
}

export default function FloatingDevNotes({ isAdmin = false, userNumber }: FloatingDevNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('improvement');
  const [priority, setPriority] = useState(3);
  const [showForm, setShowForm] = useState(false);

  // Auto-capture context
  const [pageContext, setPageContext] = useState({
    url: '',
    title: '',
    section: '',
    viewport: '',
    userAgent: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      capturePageContext();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const capturePageContext = () => {
    const context = {
      url: window.location.pathname,
      title: document.title,
      section: getPageSection(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    };
    setPageContext(context);
  };

  const getPageSection = () => {
    // Try to identify the current section based on URL and page elements
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Get the main heading or section
    const mainHeading = document.querySelector('h1, h2, [data-section]');
    const headingText = mainHeading?.textContent || '';
    
    // Combine path info with heading
    const section = segments.length > 0 
      ? `${segments.join(' > ')}${headingText ? ` - ${headingText}` : ''}`
      : headingText || 'Unknown section';
    
    return section;
  };

  const loadNotes = async () => {
    try {
      const res = await fetch('/api/dev/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/dev/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: pageContext.url,
          page_title: pageContext.title,
          section_context: pageContext.section,
          note_content: noteContent,
          note_type: noteType,
          priority,
          browser_info: {
            viewport: pageContext.viewport,
            userAgent: pageContext.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        toast.success('Dev note saved!');
        setNoteContent('');
        setShowForm(false);
        await loadNotes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error saving note');
      }
    } catch (error) {
      toast.error('Error saving note');
    } finally {
      setLoading(false);
    }
  };

  const convertToTodo = async (noteId: string) => {
    try {
      const res = await fetch(`/api/dev/notes/${noteId}/convert`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Note converted to TODO!');
        await loadNotes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error converting note');
      }
    } catch (error) {
      toast.error('Error converting note');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this dev note?')) return;

    try {
      const res = await fetch(`/api/dev/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Note deleted');
        await loadNotes();
      } else {
        toast.error('Error deleting note');
      }
    } catch (error) {
      toast.error('Error deleting note');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
      case 'feature': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'improvement': return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'todo': return <CheckSquare className="w-4 h-4 text-green-500" />;
      default: return <StickyNote className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800';
    if (priority >= 3) return 'bg-orange-100 text-orange-800';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Don't render if not admin
  if (!isAdmin) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <StickyNote className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {/* Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Dev Notes</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    #{userNumber}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {!isMinimized && (
                <CardDescription className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3" />
                  {pageContext.section || pageContext.url}
                </CardDescription>
              )}
            </CardHeader>

            {!isMinimized && (
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {/* Quick Add Button */}
                {!showForm && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dev Note
                  </Button>
                )}

                {/* Add Note Form */}
                {showForm && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">🐛 Bug</SelectItem>
                          <SelectItem value="feature">💡 Feature</SelectItem>
                          <SelectItem value="improvement">🔧 Improve</SelectItem>
                          <SelectItem value="todo">✅ TODO</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">P1</SelectItem>
                          <SelectItem value="2">P2</SelectItem>
                          <SelectItem value="3">P3</SelectItem>
                          <SelectItem value="4">P4</SelectItem>
                          <SelectItem value="5">P5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      placeholder="Describe the issue, improvement, or feature..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveNote}
                        disabled={loading}
                        className="flex-1"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setNoteContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes List */}
                <div className="space-y-2">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(note.note_type)}
                          <Badge className={getPriorityColor(note.priority)}>
                            P{note.priority}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {note.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => convertToTodo(note.id)}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNote(note.id)}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {note.note_content}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(note.created_at).toLocaleDateString()}
                        {note.converted_to_todo_id && (
                          <Badge variant="outline" className="text-xs">
                            → TODO
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {notes.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No dev notes yet. Add one to get started!
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
