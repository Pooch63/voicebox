import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET: Fetch ping schedules for a patient
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetPatientId = patientId || user.id;

    const { data: schedules, error } = await supabase
      .from("patient_ping_schedule")
      .select("*")
      .eq("patient_id", targetPatientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Ping Schedule GET] Error:", error);
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("[Ping Schedule GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new ping schedule
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, pingType, frequencyMinutes, active = true } = body;

    if (!patientId || !pingType || !frequencyMinutes) {
      return NextResponse.json({ 
        error: "Patient ID, ping type, and frequency are required" 
      }, { status: 400 });
    }

    // Verify user is a caregiver for this patient
    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("caregiver_id")
      .eq("user_id", user.id)
      .single();

    if (!caregiver) {
      return NextResponse.json({ 
        error: "User is not registered as a caregiver" 
      }, { status: 403 });
    }

    const { data: link } = await supabase
      .from("patient_caregivers")
      .select("id")
      .eq("patient_id", patientId)
      .eq("caregiver_id", caregiver.caregiver_id)
      .single();

    if (!link) {
      return NextResponse.json({ 
        error: "Caregiver not authorized for this patient" 
      }, { status: 403 });
    }

    // Create schedule
    const { data: schedule, error: insertError } = await supabase
      .from("patient_ping_schedule")
      .insert({
        patient_id: patientId,
        ping_type: pingType,
        frequency_minutes: frequencyMinutes,
        active: active,
        last_ping_at: null,
        next_ping_at: new Date(Date.now() + frequencyMinutes * 60000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Ping Schedule POST] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("[Ping Schedule POST] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a ping schedule
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scheduleId, frequencyMinutes, active } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    // Verify user is a caregiver
    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("caregiver_id")
      .eq("user_id", user.id)
      .single();

    if (!caregiver) {
      return NextResponse.json({ 
        error: "User is not registered as a caregiver" 
      }, { status: 403 });
    }

    // Verify caregiver has access to this schedule's patient
    const { data: schedule } = await supabase
      .from("patient_ping_schedule")
      .select("patient_id")
      .eq("schedule_id", scheduleId)
      .single();

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const { data: link } = await supabase
      .from("patient_caregivers")
      .select("id")
      .eq("patient_id", schedule.patient_id)
      .eq("caregiver_id", caregiver.caregiver_id)
      .single();

    if (!link) {
      return NextResponse.json({ 
        error: "Not authorized to modify this schedule" 
      }, { status: 403 });
    }

    // Update the schedule
    const updates: any = { updated_at: new Date().toISOString() };
    if (frequencyMinutes !== undefined) {
      updates.frequency_minutes = frequencyMinutes;
      // Recalculate next ping time
      updates.next_ping_at = new Date(Date.now() + frequencyMinutes * 60000).toISOString();
    }
    if (active !== undefined) updates.active = active;

    const { data: updated, error: updateError } = await supabase
      .from("patient_ping_schedule")
      .update(updates)
      .eq("schedule_id", scheduleId)
      .select()
      .single();

    if (updateError) {
      console.error("[Ping Schedule PATCH] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }

    return NextResponse.json({ schedule: updated });
  } catch (error) {
    console.error("[Ping Schedule PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a ping schedule
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("scheduleId");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!scheduleId) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    // Verify caregiver authorization (similar to PATCH)
    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("caregiver_id")
      .eq("user_id", user.id)
      .single();

    if (!caregiver) {
      return NextResponse.json({ 
        error: "User is not registered as a caregiver" 
      }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("patient_ping_schedule")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteError) {
      console.error("[Ping Schedule DELETE] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Ping Schedule DELETE] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
