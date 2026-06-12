import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET: Get current user's caregiver profile
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: caregiver, error } = await supabase
      .from("caregivers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No caregiver profile found
        return NextResponse.json({ caregiver: null });
      }
      console.error("Error fetching caregiver:", error);
      return NextResponse.json({ error: "Failed to fetch caregiver" }, { status: 500 });
    }

    return NextResponse.json({ caregiver });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create caregiver profile
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if caregiver profile already exists
    const { data: existing } = await supabase
      .from("caregivers")
      .select("caregiver_id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Caregiver profile already exists" }, { status: 400 });
    }

    const { data: caregiver, error } = await supabase
      .from("caregivers")
      .insert({
        user_id: user.id,
        name,
        email,
        phone: phone || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating caregiver:", error);
      return NextResponse.json({ error: "Failed to create caregiver profile" }, { status: 500 });
    }

    return NextResponse.json({ caregiver }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
