import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await req.json();
    const { user_id, name, email, phone } = body;

    if (!user_id || !name || !email) {
      return NextResponse.json({ error: "user_id, name, and email are required" }, { status: 400 });
    }

    // Create caregiver directly (admin operation)
    const { data: caregiver, error } = await supabase
      .from("caregivers")
      .insert({
        user_id,
        name,
        email,
        phone: phone || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating caregiver:", error);
      return NextResponse.json({ error: error.message || "Failed to create caregiver" }, { status: 500 });
    }

    return NextResponse.json({ caregiver }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
