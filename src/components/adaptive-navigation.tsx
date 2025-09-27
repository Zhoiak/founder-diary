"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Target, BarChart3, FileText, Calendar, TrendingUp,
  Heart, Zap, Users, GraduationCap, Camera, Lightbulb, 
  Settings, Home, Briefcase
} from "lucide-react";
import { useFeatureFlags, type FeatureFlags } from "@/hooks/use-feature-flags";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredFlag?: keyof FeatureFlags;
  mode: 'founder' | 'personal' | 'both';
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  // Founder Mode Items
  {
    id: 'logs',
    label: 'Daily Logs',
    href: '/logs',
    icon: BookOpen,
    description: 'Record your progress',
    mode: 'founder'
  },
  {
    id: 'goals',
    label: 'Goals & OKRs',
    href: '/goals',
    icon: Target,
    description: 'Track objectives',
    mode: 'founder'
  },
  {
    id: 'weekly',
    label: 'Weekly Reviews',
    href: '/weekly',
    icon: FileText,
    description: 'Weekly summaries',
    mode: 'founder'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'View insights',
    mode: 'founder'
  },
  {
    id: 'decisions',
    label: 'Decisions',
    href: '/decisions',
    icon: FileText,
    description: 'Architecture decisions',
    mode: 'founder'
  },
  {
    id: 'investor-updates',
    label: 'Investor Updates',
    href: '/investor-updates',
    icon: TrendingUp,
    description: 'Monthly reports',
    mode: 'founder'
  },

  // Personal Mode Items
  {
    id: 'journal',
    label: 'Personal Journal',
    href: '/journal',
    icon: Heart,
    description: 'Daily life & thoughts',
    requiredFlag: 'diary_personal',
    mode: 'personal'
  },
  {
    id: 'habits',
    label: 'Habits',
    href: '/habits',
    icon: Zap,
    description: 'Track daily habits',
    requiredFlag: 'habits',
    mode: 'personal'
  },
  {
    id: 'routines',
    label: 'Routines',
    href: '/routines',
    icon: Calendar,
    description: 'Morning & evening routines',
    requiredFlag: 'routines',
    mode: 'personal',
    badge: 'New'
  },
  {
    id: 'people',
    label: 'Relationships',
    href: '/people',
    icon: Users,
    description: 'Personal CRM',
    requiredFlag: 'people',
    mode: 'personal'
  },
  {
    id: 'learning',
    label: 'Learning',
    href: '/learning',
    icon: GraduationCap,
    description: 'Books & flashcards',
    requiredFlag: 'learning',
    mode: 'personal'
  },
  {
    id: 'memories',
    label: 'Memories',
    href: '/memories',
    icon: Camera,
    description: 'Photos & time capsules',
    requiredFlag: 'memories',
    mode: 'personal',
    badge: 'Beta'
  },
  {
    id: 'insights',
    label: 'Insights',
    href: '/insights',
    icon: Lightbulb,
    description: 'Wellbeing correlations',
    requiredFlag: 'insights',
    mode: 'personal',
    badge: 'Beta'
  }
];

interface AdaptiveNavigationProps {
  projectId?: string;
  mode: 'founder' | 'personal';
  className?: string;
}

export function AdaptiveNavigation({ projectId, mode, className }: AdaptiveNavigationProps) {
  const { flags, loading, isEnabled } = useFeatureFlags(projectId);
  const pathname = usePathname();

  const getVisibleItems = (): NavigationItem[] => {
    return navigationItems.filter(item => {
      // Check mode compatibility
      if (item.mode !== 'both' && item.mode !== mode) {
        return false;
      }

      // Check feature flag requirement
      if (item.requiredFlag && !isEnabled(item.requiredFlag)) {
        return false;
      }

      return true;
    });
  };

  const visibleItems = getVisibleItems();

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <nav className={`space-y-2 ${className}`}>
      {/* Home Link */}
      <Link href="/">
        <Button 
          variant={pathname === '/' ? 'default' : 'ghost'} 
          className="w-full justify-start gap-3 h-12"
        >
          <Home className="w-5 h-5" />
          <div className="flex-1 text-left">
            <div className="font-medium">Dashboard</div>
            <div className="text-xs text-gray-500">Overview & projects</div>
          </div>
        </Button>
      </Link>

      {/* Mode Indicator */}
      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-t border-gray-200 mt-4 pt-4">
        {mode === 'personal' ? (
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-pink-500" />
            Personal Life OS
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Briefcase className="w-3 h-3 text-blue-500" />
            Founder Tools
          </div>
        )}
      </div>

      {/* Navigation Items */}
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link key={item.id} href={item.href}>
            <Button 
              variant={isActive ? 'default' : 'ghost'} 
              className="w-full justify-start gap-3 h-12"
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </Button>
          </Link>
        );
      })}

      {/* Settings */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <Link href="/settings">
          <Button 
            variant={pathname === '/settings' ? 'default' : 'ghost'} 
            className="w-full justify-start gap-3 h-12"
          >
            <Settings className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-medium">Settings</div>
              <div className="text-xs text-gray-500">Preferences & flags</div>
            </div>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
