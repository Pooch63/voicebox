import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint should be called by a cron job (e.g., Vercel Cron, external scheduler)
// It processes all pending pings and sends notifications to patients

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key-here";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date().toISOString();
    
    // Find all active schedules that are due for a ping
    const { data: dueSchedules, error: scheduleError } = await supabase
      .from("patient_ping_schedule")
      .select(`
        *,
        patient:patient_id (
          name,
          user_id
        )
      `)
      .eq("active", true)
      .lte("next_ping_at", now);

    if (scheduleError) {
      console.error("[Process Pings] Error fetching schedules:", scheduleError);
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }

    console.log(`[Process Pings] Found ${dueSchedules?.length || 0} due schedules`);

    const results = [];

    for (const schedule of dueSchedules || []) {
      try {
        let question = "";
        let notificationTitle = "";
        let notificationMessage = "";
        let therapyWord: string | null = null;

        if (schedule.ping_type === "hunger_check") {
          question = "Are you hungry?";
          notificationTitle = "Hunger Check";
          notificationMessage = `Time to check in with ${schedule.patient.name} about meals`;
        } else if (schedule.ping_type === "therapy_prompt") {
          // Get active therapy word list for this patient
          const { data: wordList } = await supabase
            .from("therapy_word_lists")
            .select("words")
            .eq("patient_id", schedule.patient_id)
            .eq("is_active", true)
            .single();

          if (wordList && wordList.words && wordList.words.length > 0) {
            // Pick a random word from the list
            therapyWord = wordList.words[Math.floor(Math.random() * wordList.words.length)];
            question = `Please say the word: ${therapyWord}`;
            notificationTitle = "Therapy Session";
            notificationMessage = `${schedule.patient.name} has a scheduled therapy prompt: "${therapyWord}"`;
          } else {
            // Skip if no word list available
            console.log(`[Process Pings] No active word list for patient ${schedule.patient_id}, skipping therapy prompt`);
            continue;
          }
        } else if (schedule.ping_type === "wellness_check") {
          question = "How are you feeling today?";
          notificationTitle = "Wellness Check-In";
          notificationMessage = `Time for a wellness check with ${schedule.patient.name}`;
        }

        // Create ping response record (initially unanswered)
        const { data: pingResponse, error: pingError } = await supabase
          .from("ping_responses")
          .insert({
            schedule_id: schedule.schedule_id,
            patient_id: schedule.patient_id,
            ping_type: schedule.ping_type,
            question: question,
            therapy_word: therapyWord,
            response_text: null,
            responded_at: null
          })
          .select()
          .single();

        if (pingError) {
          console.error(`[Process Pings] Error creating ping response:`, pingError);
          continue;
        }

        // Get all caregivers for this patient
        const { data: patientCaregivers } = await supabase
          .from("patient_caregivers")
          .select("caregiver_id")
          .eq("patient_id", schedule.patient_id);

        // Create notifications for each caregiver
        if (patientCaregivers && patientCaregivers.length > 0) {
          for (const link of patientCaregivers) {
            await supabase
              .from("notifications")
              .insert({
                patient_id: schedule.patient_id,
                caregiver_id: link.caregiver_id,
                notification_type: schedule.ping_type,
                title: notificationTitle,
                message: notificationMessage,
                metadata: {
                  ping_response_id: pingResponse.response_id,
                  therapy_word: therapyWord,
                  question: question
                },
                priority: schedule.ping_type === "therapy_prompt" ? "high" : "normal"
              });
          }
        }

        // Update schedule for next ping
        const nextPingTime = new Date(Date.now() + schedule.frequency_minutes * 60000).toISOString();
        await supabase
          .from("patient_ping_schedule")
          .update({
            last_ping_at: now,
            next_ping_at: nextPingTime,
            updated_at: now
          })
          .eq("schedule_id", schedule.schedule_id);

        results.push({
          scheduleId: schedule.schedule_id,
          patientId: schedule.patient_id,
          pingType: schedule.ping_type,
          question: question,
          nextPingAt: nextPingTime,
          success: true
        });

      } catch (error) {
        console.error(`[Process Pings] Error processing schedule ${schedule.schedule_id}:`, error);
        results.push({
          scheduleId: schedule.schedule_id,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results: results
    });

  } catch (error) {
    console.error("[Process Pings] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
