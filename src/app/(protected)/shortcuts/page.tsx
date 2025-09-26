"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Command, Keyboard } from "lucide-react";
import Link from "next/link";

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'creation' | 'general';
}

const shortcuts: Shortcut[] = [
  // General
  {
    keys: ['⌘', 'K'],
    description: 'Open command palette',
    category: 'general'
  },
  {
    keys: ['Esc'],
    description: 'Close dialogs and modals',
    category: 'general'
  },

  // Navigation
  {
    keys: ['G', 'H'],
    description: 'Go to Dashboard (Home)',
    category: 'navigation'
  },
  {
    keys: ['G', 'L'],
    description: 'Go to Daily Logs',
    category: 'navigation'
  },
  {
    keys: ['G', 'G'],
    description: 'Go to Goals & OKRs',
    category: 'navigation'
  },
  {
    keys: ['G', 'D'],
    description: 'Go to Decisions (ADR)',
    category: 'navigation'
  },
  {
    keys: ['G', 'W'],
    description: 'Go to Weekly Reviews',
    category: 'navigation'
  },
  {
    keys: ['G', 'A'],
    description: 'Go to Analytics',
    category: 'navigation'
  },

  // Creation
  {
    keys: ['N', 'L'],
    description: 'New Daily Log',
    category: 'creation'
  },
  {
    keys: ['N', 'G'],
    description: 'New Goal',
    category: 'creation'
  },
  {
    keys: ['N', 'D'],
    description: 'New Decision',
    category: 'creation'
  },
  {
    keys: ['N', 'W'],
    description: 'New Weekly Review',
    category: 'creation'
  },
];

const categoryLabels = {
  general: 'General',
  navigation: 'Navigation',
  creation: 'Quick Create'
};

const categoryDescriptions = {
  general: 'Universal shortcuts that work anywhere',
  navigation: 'Quickly jump between different sections',
  creation: 'Create new content without clicking'
};

export default function ShortcutsPage() {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const renderKeys = (keys: string[]) => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <Badge variant="outline" className="px-2 py-1 font-mono text-xs">
              {key}
            </Badge>
            {index < keys.length - 1 && (
              <span className="mx-1 text-gray-400">+</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Keyboard className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Work faster with keyboard shortcuts
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Master these shortcuts to navigate and create content more efficiently. 
            Press <Badge variant="outline" className="mx-1 font-mono">⌘K</Badge> anytime to open the command palette.
          </p>
        </div>

        {/* Shortcuts by Category */}
        <div className="space-y-8">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Command className="w-5 h-5 text-blue-500" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </CardTitle>
                <CardDescription>
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{shortcut.description}</span>
                      {renderKeys(shortcut.keys)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>💡 Pro Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Command Palette:</strong> Press <Badge variant="outline" className="mx-1 font-mono">⌘K</Badge> 
                  from anywhere to quickly search and execute commands
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>
                  <strong>Sequential Keys:</strong> Navigation shortcuts like <Badge variant="outline" className="mx-1 font-mono">G</Badge> 
                  then <Badge variant="outline" className="mx-1 font-mono">L</Badge> work by pressing keys in sequence, not together
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span>
                  <strong>Templates:</strong> When creating new content, look for the template button to get started faster
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>
                  <strong>Focus Mode:</strong> Use <Badge variant="outline" className="mx-1 font-mono">Tab</Badge> 
                  to navigate between form fields efficiently
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="mt-8 border-dashed">
          <CardContent className="text-center py-8">
            <h3 className="font-medium text-gray-900 mb-2">More shortcuts coming soon!</h3>
            <p className="text-gray-600 text-sm">
              We're working on adding more keyboard shortcuts to make your workflow even faster. 
              Have suggestions? Let us know!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
