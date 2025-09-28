"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, Target, FileText, TrendingUp, 
  Lightbulb, DollarSign, Calendar, Users,
  Heart, Zap, BookOpen, Camera, Brain,
  ArrowRight, Plus, Activity
} from "lucide-react";
import Link from "next/link";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

interface Widget {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
  stats?: string;
  enabled: boolean;
}

interface DashboardWidgetsProps {
  projectId: string;
  mode: 'founder' | 'personal';
  className?: string;
}

export function DashboardWidgets({ projectId, mode, className }: DashboardWidgetsProps) {
  const { flags, isEnabled } = useFeatureFlags(projectId);

  const founderWidgets: Widget[] = [
    {
      id: 'logs',
      title: 'Daily Logs',
      subtitle: 'Record your progress',
      icon: FileText,
      href: '/logs',
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-100',
      stats: '12 this week',
      enabled: true
    },
    {
      id: 'goals',
      title: 'Goals & OKRs',
      subtitle: 'Track objectives',
      icon: Target,
      href: '/goals',
      color: 'text-green-600',
      bgGradient: 'from-green-50 to-green-100',
      iconBg: 'bg-green-100',
      stats: '3 active goals',
      enabled: isEnabled('goals') || true
    },
    {
      id: 'weekly',
      title: 'Weekly Reviews',
      subtitle: 'Weekly summaries',
      icon: Calendar,
      href: '/weekly',
      color: 'text-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'bg-purple-100',
      stats: 'Due Monday',
      enabled: isEnabled('weekly_reviews') || true
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'text-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      iconBg: 'bg-orange-100',
      stats: '↗️ +15% growth',
      enabled: isEnabled('analytics') || true
    },
    {
      id: 'decisions',
      title: 'Decisions',
      subtitle: 'Architecture decisions',
      icon: Lightbulb,
      href: '/decisions',
      color: 'text-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'bg-indigo-100',
      stats: '2 pending',
      enabled: isEnabled('decisions') || true
    },
    {
      id: 'investor',
      title: 'Investor Updates',
      subtitle: 'Monthly reports',
      icon: TrendingUp,
      href: '/investor-updates',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-100',
      badge: 'New',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      enabled: isEnabled('investor_updates') || true
    }
  ];

  const personalWidgets: Widget[] = [
    {
      id: 'journal',
      title: 'Personal Journal',
      subtitle: 'Daily life entries',
      icon: Heart,
      href: '/journal',
      color: 'text-pink-600',
      bgGradient: 'from-pink-50 to-rose-100',
      iconBg: 'bg-pink-100',
      stats: '5 entries this week',
      enabled: isEnabled('diary_personal')
    },
    {
      id: 'habits',
      title: 'Habits Tracking',
      subtitle: 'Build consistency',
      icon: Zap,
      href: '/habits',
      color: 'text-yellow-600',
      bgGradient: 'from-yellow-50 to-amber-100',
      iconBg: 'bg-yellow-100',
      stats: '4/7 completed',
      enabled: isEnabled('habits')
    },
    {
      id: 'routines',
      title: 'Routines',
      subtitle: 'Morning & evening',
      icon: Calendar,
      href: '/routines',
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-sky-100',
      iconBg: 'bg-blue-100',
      badge: 'Active',
      badgeColor: 'bg-blue-100 text-blue-700',
      enabled: isEnabled('routines')
    },
    {
      id: 'people',
      title: 'Relationships',
      subtitle: 'Personal CRM',
      icon: Users,
      href: '/people',
      color: 'text-violet-600',
      bgGradient: 'from-violet-50 to-purple-100',
      iconBg: 'bg-violet-100',
      stats: '12 contacts',
      enabled: isEnabled('people')
    },
    {
      id: 'learning',
      title: 'Learning',
      subtitle: 'Knowledge & flashcards',
      icon: Brain,
      href: '/learning',
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-50 to-green-100',
      iconBg: 'bg-emerald-100',
      stats: '8 cards due',
      enabled: isEnabled('learning')
    },
    {
      id: 'memories',
      title: 'Memories',
      subtitle: 'Photos & moments',
      icon: Camera,
      href: '/memories',
      color: 'text-teal-600',
      bgGradient: 'from-teal-50 to-cyan-100',
      iconBg: 'bg-teal-100',
      badge: 'Beta',
      badgeColor: 'bg-teal-100 text-teal-700',
      enabled: isEnabled('memories')
    }
  ];

  const widgets = mode === 'personal' ? personalWidgets : founderWidgets;
  const enabledWidgets = widgets.filter(widget => widget.enabled);

  if (enabledWidgets.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets enabled</h3>
        <p className="text-gray-600">Enable features in Settings to see widgets here.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {enabledWidgets.map((widget) => {
        const Icon = widget.icon;
        
        return (
          <Link key={widget.id} href={widget.href}>
            <Card className="group hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/50 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-2 bg-gradient-to-r ${widget.bgGradient}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${widget.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-6 h-6 ${widget.color}`} />
                    </div>
                    {widget.badge && (
                      <Badge className={`text-xs px-2 py-1 ${widget.badgeColor} border-0`}>
                        {widget.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-gray-700 transition-colors">
                      {widget.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {widget.subtitle}
                    </p>
                    {widget.stats && (
                      <div className="flex items-center gap-2 pt-2">
                        <Activity className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">
                          {widget.stats}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowRight className={`w-4 h-4 ${widget.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
