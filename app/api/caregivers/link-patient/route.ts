import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// POST: Link a patient to the current caregiver
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user (caregiver)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { patient_email, relationship, is_primary } = body;

    if (!patient_email) {
      return NextResponse.json({ error: "Patient email is required" }, { status: 400 });
    }

    // Get caregiver profile
    const { data: caregiver, error: caregiverError } = await supabase
      .from("caregivers")
      .select("caregiver_id")
      .eq("user_id", user.id)
      .single();

    if (caregiverError || !caregiver) {
      return NextResponse.json({ error: "Caregiver profile not found" }, { status: 404 });
    }

    // Find patient by email (lookup in auth.users)
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      // Fallback: Try to find by looking up in users table
      const { data: patients, error: patientsError } = await supabase
        .from("users")
        .select("user_id")
        .ilike("other_info->>email", patient_email)
        .single();

      if (patientsError || !patients) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Link patient to caregiver
      const { data: link, error: linkError } = await supabase
        .from("patient_caregivers")
        .insert({
          patient_id: patients.user_id,
          caregiver_id: caregiver.caregiver_id,
          relationship: relationship || null,
          is_primary: is_primary || false
        })
        .select()
        .single();

      if (linkError) {
        if (linkError.code === '23505') {
          return NextResponse.json({ error: "Patient already linked to this caregiver" }, { status: 400 });
        }
        console.error("Error linking patient:", linkError);
        return NextResponse.json({ error: "Failed to link patient" }, { status: 500 });
      }

      return NextResponse.json({ link }, { status: 201 });
    }

    // Find patient in auth.users
    const patient = authUsers.users.find(u => u.email === patient_email);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Link patient to caregiver
    const { data: link, error: linkError } = await supabase
      .from("patient_caregivers")
      .insert({
        patient_id: patient.id,
        caregiver_id: caregiver.caregiver_id,
        relationship: relationship || null,
        is_primary: is_primary || false
      })
      .select()
      .single();

    if (linkError) {
      if (linkError.code === '23505') {
        return NextResponse.json({ error: "Patient already linked to this caregiver" }, { status: 400 });
      }
      console.error("Error linking patient:", linkError);
      return NextResponse.json({ error: "Failed to link patient" }, { status: 500 });
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
