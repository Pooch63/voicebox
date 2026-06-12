import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET: Fetch notifications for current user (as patient)
// This shows what notifications would be sent to their caregivers
export async function GET(req: NextRequest) {
  try {
    console.log("[Notifications GET] Request received");
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Notifications GET] Auth check:", { userId: user?.id, authError: authError?.message });
    if (authError || !user) {
      console.error("[Notifications GET] Unauthorized:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch notifications where current user is the patient (emulating caregiver view)
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select(`
        *,
        patient:patient_id (
          name,
          user_id
        )
      `)
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    console.log("[Notifications GET] Query result:", { count: notifications?.length, error: notificationsError });
    if (notificationsError) {
      console.error("[Notifications GET] Error fetching notifications:", notificationsError);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    console.log("[Notifications GET] Success, returning", notifications?.length, "notifications");
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[Notifications GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new notification
export async function POST(req: NextRequest) {
  try {
    console.log("[Notifications POST] Request received");
    const supabase = await createClient();
    
    // Get current user (patient)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Notifications POST] Auth check:", { userId: user?.id, authError: authError?.message });
    if (authError || !user) {
      console.error("[Notifications POST] Unauthorized:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[Notifications POST] Request body:", body);
    const { notification_type, title, message, metadata, priority } = body;

    // Create notification attached to patient
    // Caregivers will see this through their patient linkage
    const notificationToInsert = {
      patient_id: user.id,
      notification_type,
      title,
      message,
      metadata: metadata || {},
      priority: priority || 'normal',
      status: 'pending'
    };

    console.log("[Notifications POST] Inserting notification:", notificationToInsert);
    const { data: createdNotifications, error: insertError } = await supabase
      .from("notifications")
      .insert(notificationToInsert)
      .select();

    if (insertError) {
      console.error("[Notifications POST] Error creating notifications:", insertError);
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 });
    }

    console.log("[Notifications POST] Success, created", createdNotifications?.length, "notifications");
    return NextResponse.json({ 
      success: true, 
      notifications: createdNotifications 
    });
  } catch (error) {
    console.error("[Notifications POST] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
