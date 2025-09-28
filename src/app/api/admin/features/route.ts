import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

interface FeatureStatus {
  category: string;
  name: string;
  status: 'implemented' | 'partial' | 'missing';
  hasBackend: boolean;
  hasFrontend: boolean;
  hasUI: boolean;
  description: string;
  priority: 'high' | 'medium' | 'low';
  route?: string;
  apiEndpoint?: string;
  component?: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access
    const { data: adminAccess } = await supabase
      .from('project_members')
      .select('role, projects!inner(slug)')
      .eq('user_id', session.user.id)
      .eq('projects.slug', 'admin')
      .eq('role', 'owner')
      .single();

    if (!adminAccess) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Define all features and their current status
    const features: FeatureStatus[] = [
      // Founder Tools (Implemented)
      {
        category: 'Founder Tools',
        name: 'Daily Logs',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Fully functional CRUD for daily logs',
        priority: 'low',
        route: '/logs',
        apiEndpoint: '/api/logs',
        component: 'LogsPage'
      },
      {
        category: 'Founder Tools',
        name: 'Goals & OKRs',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Complete goals management system',
        priority: 'low',
        route: '/goals',
        apiEndpoint: '/api/goals',
        component: 'GoalsPage'
      },
      {
        category: 'Founder Tools',
        name: 'Weekly Reviews',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Weekly review system with templates',
        priority: 'low',
        route: '/weekly',
        apiEndpoint: '/api/weekly',
        component: 'WeeklyPage'
      },
      {
        category: 'Founder Tools',
        name: 'Analytics Dashboard',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Complete analytics with charts',
        priority: 'low',
        route: '/analytics',
        apiEndpoint: '/api/analytics',
        component: 'AnalyticsPage'
      },
      {
        category: 'Founder Tools',
        name: 'Decision Architecture',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Architecture decision records',
        priority: 'low',
        route: '/decisions',
        apiEndpoint: '/api/decisions',
        component: 'DecisionsPage'
      },
      {
        category: 'Founder Tools',
        name: 'Investor Updates',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Monthly investor reporting',
        priority: 'low',
        route: '/investor-updates',
        apiEndpoint: '/api/investor-updates',
        component: 'InvestorUpdatesPage'
      },

      // Personal Life OS (Partial - APIs exist, pages missing)
      {
        category: 'Personal Life OS',
        name: 'Personal Journal',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'high',
        route: '/journal',
        apiEndpoint: '/api/personal-entries',
        component: 'DashboardWidgets (widget only)'
      },
      {
        category: 'Personal Life OS',
        name: 'Habits Tracking',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'high',
        route: '/habits',
        apiEndpoint: '/api/habits',
        component: 'DashboardWidgets (widget only)'
      },
      {
        category: 'Personal Life OS',
        name: 'Morning/Evening Routines',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'high',
        route: '/routines',
        apiEndpoint: '/api/personal/routines',
        component: 'DashboardWidgets (widget only)'
      },
      {
        category: 'Personal Life OS',
        name: 'Relationships CRM',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'high',
        route: '/people',
        apiEndpoint: '/api/people',
        component: 'DashboardWidgets (widget only)'
      },
      {
        category: 'Personal Life OS',
        name: 'Learning & Flashcards',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'medium',
        route: '/learning',
        apiEndpoint: '/api/learning',
        component: 'DashboardWidgets (widget only)'
      },
      {
        category: 'Personal Life OS',
        name: 'Memories & Photos',
        status: 'partial',
        hasBackend: true,
        hasFrontend: false,
        hasUI: true,
        description: 'API and widget exist, page missing',
        priority: 'medium',
        route: '/memories',
        apiEndpoint: '/api/memories',
        component: 'DashboardWidgets (widget only)'
      },

      // Diary+ Advanced Features
      {
        category: 'Diary+ Advanced',
        name: 'Onboarding Wizard',
        status: 'partial',
        hasBackend: true,
        hasFrontend: true,
        hasUI: false,
        description: 'Component created but not integrated automatically',
        priority: 'medium',
        apiEndpoint: '/api/user/onboarding-complete',
        component: 'OnboardingWizard'
      },
      {
        category: 'Diary+ Advanced',
        name: 'Yearbook Generator',
        status: 'partial',
        hasBackend: true,
        hasFrontend: true,
        hasUI: false,
        description: 'Component created but not accessible from UI',
        priority: 'medium',
        apiEndpoint: '/api/yearbook',
        component: 'YearbookGenerator'
      },
      {
        category: 'Diary+ Advanced',
        name: 'Private Vault',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Fully implemented in Settings page',
        priority: 'low',
        route: '/settings',
        apiEndpoint: '/api/vault',
        component: 'VaultManager'
      },
      {
        category: 'Diary+ Advanced',
        name: 'Beta Feedback System',
        status: 'partial',
        hasBackend: false,
        hasFrontend: true,
        hasUI: false,
        description: 'Component created but not integrated',
        priority: 'low',
        component: 'BetaFeedback'
      },
      {
        category: 'Diary+ Advanced',
        name: 'Cron Jobs Admin',
        status: 'partial',
        hasBackend: true,
        hasFrontend: true,
        hasUI: false,
        description: 'Admin dashboard exists but not linked',
        priority: 'low',
        route: '/admin/cron',
        apiEndpoint: '/api/cron',
        component: 'CronAdminPage'
      },

      // System Features
      {
        category: 'System',
        name: 'User Invitations',
        status: 'missing',
        hasBackend: false,
        hasFrontend: false,
        hasUI: false,
        description: 'Not implemented yet',
        priority: 'high'
      },
      {
        category: 'System',
        name: 'Feature Flags Management',
        status: 'implemented',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Complete feature flags system',
        priority: 'low',
        route: '/settings',
        apiEndpoint: '/api/projects/[id]/feature-flags',
        component: 'SettingsPage'
      },
      {
        category: 'System',
        name: 'Admin Dashboard',
        status: 'partial',
        hasBackend: true,
        hasFrontend: true,
        hasUI: true,
        description: 'Currently being implemented',
        priority: 'medium',
        route: '/admin',
        apiEndpoint: '/api/admin',
        component: 'AdminDashboard'
      }
    ];

    return NextResponse.json(features);

  } catch (error: any) {
    console.error("Error fetching features status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
