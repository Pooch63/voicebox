import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET: Fetch therapy word lists for a patient
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If patientId provided, fetch for that patient; otherwise fetch for current user
    const targetPatientId = patientId || user.id;

    const { data: wordLists, error } = await supabase
      .from("therapy_word_lists")
      .select(`*`)
      .eq("patient_id", targetPatientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Therapy Words GET] Error:", error);
      return NextResponse.json({ error: "Failed to fetch therapy words" }, { status: 500 });
    }

    return NextResponse.json({ wordLists });
  } catch (error) {
    console.error("[Therapy Words GET] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create or update therapy word list
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { words, isActive = true } = body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ 
        error: "Words array is required" 
      }, { status: 400 });
    }

    const patientId = user.id;

    // If this is active, deactivate other lists for this patient
    if (isActive) {
      await supabase
        .from("therapy_word_lists")
        .update({ is_active: false })
        .eq("patient_id", patientId);
    }

    // Create new word list
    const { data: wordList, error: insertError } = await supabase
      .from("therapy_word_lists")
      .insert({
        patient_id: patientId,
        words: words,
        is_active: isActive
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Therapy Words POST] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create word list" }, { status: 500 });
    }

    return NextResponse.json({ wordList });
  } catch (error) {
    console.error("[Therapy Words POST] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update an existing therapy word list
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { wordListId, words, isActive } = body;

    if (!wordListId) {
      return NextResponse.json({ error: "Word list ID is required" }, { status: 400 });
    }

    // Verify user owns this word list
    const { data: wordList } = await supabase
      .from("therapy_word_lists")
      .select("patient_id")
      .eq("id", wordListId)
      .single();

    if (!wordList || wordList.patient_id !== user.id) {
      return NextResponse.json({ 
        error: "Not authorized to modify this word list" 
      }, { status: 403 });
    }

    // If setting to active, deactivate other lists for this patient
    if (isActive === true) {
      await supabase
        .from("therapy_word_lists")
        .update({ is_active: false })
        .eq("patient_id", wordList.patient_id)
        .neq("id", wordListId);
    }

    // Update the word list
    const updates: any = { updated_at: new Date().toISOString() };
    if (words !== undefined) updates.words = words;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: updated, error: updateError } = await supabase
      .from("therapy_word_lists")
      .update(updates)
      .eq("id", wordListId)
      .select()
      .single();

    if (updateError) {
      console.error("[Therapy Words PATCH] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update word list" }, { status: 500 });
    }

    return NextResponse.json({ wordList: updated });
  } catch (error) {
    console.error("[Therapy Words PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
