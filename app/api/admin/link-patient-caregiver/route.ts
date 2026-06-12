import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await req.json();
    const { patient_id, caregiver_id, relationship, is_primary } = body;

    if (!patient_id || !caregiver_id) {
      return NextResponse.json({ error: "patient_id and caregiver_id are required" }, { status: 400 });
    }

    // Link patient to caregiver
    const { data: link, error } = await supabase
      .from("patient_caregivers")
      .insert({
        patient_id,
        caregiver_id,
        relationship: relationship || null,
        is_primary: is_primary || false
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "This patient-caregiver link already exists" }, { status: 400 });
      }
      console.error("Error linking patient to caregiver:", error);
      return NextResponse.json({ error: error.message || "Failed to link" }, { status: 500 });
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
