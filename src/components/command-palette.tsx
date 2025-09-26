"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Target, 
  FileText, 
  BarChart3, 
  Calendar,
  Plus,
  Search,
  Home,
  Settings,
  Lightbulb,
  GraduationCap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
  category: 'navigation' | 'create' | 'search' | 'settings';
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: Home,
      action: () => router.push('/'),
      keywords: ['home', 'dashboard', 'main'],
      category: 'navigation'
    },
    {
      id: 'nav-logs',
      label: 'Go to Daily Logs',
      description: 'View and manage your daily logs',
      icon: BookOpen,
      action: () => router.push('/logs'),
      keywords: ['logs', 'daily', 'journal', 'entries'],
      category: 'navigation'
    },
    {
      id: 'nav-goals',
      label: 'Go to Goals & OKRs',
      description: 'Manage your objectives and key results',
      icon: Target,
      action: () => router.push('/goals'),
      keywords: ['goals', 'okrs', 'objectives', 'targets'],
      category: 'navigation'
    },
    {
      id: 'nav-decisions',
      label: 'Go to Decisions',
      description: 'View architectural decision records',
      icon: FileText,
      action: () => router.push('/decisions'),
      keywords: ['decisions', 'adr', 'architecture'],
      category: 'navigation'
    },
    {
      id: 'nav-weekly',
      label: 'Go to Weekly Reviews',
      description: 'View and generate weekly summaries',
      icon: Calendar,
      action: () => router.push('/weekly'),
      keywords: ['weekly', 'reviews', 'summaries'],
      category: 'navigation'
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'View insights and statistics',
      icon: BarChart3,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'stats', 'insights', 'charts'],
      category: 'navigation'
    },
    {
      id: 'nav-learning',
      label: 'Go to Learning & Flashcards',
      description: 'Manage your learning materials and review flashcards',
      icon: GraduationCap,
      action: () => router.push('/learning'),
      keywords: ['learning', 'flashcards', 'study', 'spaced repetition', 'highlights'],
      category: 'navigation'
    },

    // Quick Create Actions
    {
      id: 'create-log',
      label: 'New Daily Log',
      description: 'Create a new daily log entry',
      icon: Plus,
      action: () => {
        router.push('/logs');
        // Note: In a real implementation, you'd trigger the dialog
        toast.success('Navigate to Daily Logs to create a new entry');
      },
      keywords: ['new', 'create', 'log', 'daily', 'entry'],
      category: 'create'
    },
    {
      id: 'create-goal',
      label: 'New Goal',
      description: 'Create a new goal or OKR',
      icon: Target,
      action: () => {
        router.push('/goals');
        toast.success('Navigate to Goals to create a new objective');
      },
      keywords: ['new', 'create', 'goal', 'okr', 'objective'],
      category: 'create'
    },
    {
      id: 'create-decision',
      label: 'New Decision',
      description: 'Document a new architectural decision',
      icon: FileText,
      action: () => {
        router.push('/decisions');
        toast.success('Navigate to Decisions to create a new ADR');
      },
      keywords: ['new', 'create', 'decision', 'adr'],
      category: 'create'
    },
    {
      id: 'create-weekly',
      label: 'Generate Weekly Review',
      description: 'Create a new weekly summary',
      icon: Calendar,
      action: () => {
        router.push('/weekly');
        toast.success('Navigate to Weekly Reviews to generate a summary');
      },
      keywords: ['new', 'create', 'weekly', 'review', 'summary'],
      category: 'create'
    },

    // Templates
    {
      id: 'templates',
      label: 'Browse Templates',
      description: 'View available content templates',
      icon: Lightbulb,
      action: () => {
        toast.info('Templates are available when creating new content');
      },
      keywords: ['templates', 'examples', 'starter'],
      category: 'create'
    },

    // Settings
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all available keyboard shortcuts',
      icon: Settings,
      action: () => router.push('/shortcuts'),
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'help'],
      category: 'settings'
    }
  ];

  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    create: 'Create New',
    search: 'Search',
    settings: 'Settings'
  };

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onOpenChange(false);
      }
    }
  };

  const executeCommand = (command: Command) => {
    command.action();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="border-b">
          <div className="flex items-center px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="border-0 focus-visible:ring-0 text-base"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found for "{search}"
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                  {commands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const Icon = command.icon;
                    return (
                      <Button
                        key={command.id}
                        variant="ghost"
                        className={`w-full justify-start px-4 py-3 h-auto rounded-none ${
                          globalIndex === selectedIndex ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => executeCommand(command)}
                      >
                        <Icon className="w-4 h-4 mr-3 text-gray-400" />
                        <div className="text-left">
                          <div className="font-medium">{command.label}</div>
                          <div className="text-sm text-gray-500">{command.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t px-4 py-3 text-xs text-gray-500 bg-gray-50">
          <div className="flex justify-between">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
