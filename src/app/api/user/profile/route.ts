import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with settings
    const { data: profile, error: profileError } = await supabase
      .from('user_numbers')
      .select(`
        *,
        user_settings (*)
      `)
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Get auth user info
    const authUser = session.user;

    return NextResponse.json({
      success: true,
      profile: {
        // Auth info
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        
        // Profile info
        user_number: profile?.user_number,
        display_name: profile?.display_name,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        bio: profile?.bio,
        avatar_url: profile?.avatar_url,
        phone: profile?.phone,
        timezone: profile?.timezone,
        language: profile?.language,
        theme: profile?.theme,
        is_discoverable: profile?.is_discoverable,
        notifications_enabled: profile?.notifications_enabled,
        email_notifications: profile?.email_notifications,
        marketing_emails: profile?.marketing_emails,
        
        // Settings
        settings: profile?.user_settings?.[0] || null
      }
    });

  } catch (error: any) {
    console.error("Unexpected error in profile GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      display_name, 
      first_name, 
      last_name, 
      bio, 
      phone, 
      timezone, 
      language, 
      theme,
      is_discoverable,
      notifications_enabled,
      email_notifications,
      marketing_emails,
      settings 
    } = body;

    // Update user_numbers table
    const profileUpdates: any = {};
    if (display_name !== undefined) profileUpdates.display_name = display_name;
    if (first_name !== undefined) profileUpdates.first_name = first_name;
    if (last_name !== undefined) profileUpdates.last_name = last_name;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (timezone !== undefined) profileUpdates.timezone = timezone;
    if (language !== undefined) profileUpdates.language = language;
    if (theme !== undefined) profileUpdates.theme = theme;
    if (is_discoverable !== undefined) profileUpdates.is_discoverable = is_discoverable;
    if (notifications_enabled !== undefined) profileUpdates.notifications_enabled = notifications_enabled;
    if (email_notifications !== undefined) profileUpdates.email_notifications = email_notifications;
    if (marketing_emails !== undefined) profileUpdates.marketing_emails = marketing_emails;

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      
      const { error: profileError } = await supabase
        .from('user_numbers')
        .update(profileUpdates)
        .eq('user_id', session.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    // Update user_settings table
    if (settings) {
      const settingsUpdates = {
        ...settings,
        updated_at: new Date().toISOString()
      };

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          ...settingsUpdates
        });

      if (settingsError) {
        console.error("Error updating settings:", settingsError);
        return NextResponse.json({ error: settingsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (error: any) {
    console.error("Unexpected error in profile PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
