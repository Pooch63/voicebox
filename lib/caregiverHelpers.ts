import { createClient } from "./supabase-server";

/**
 * Get caregiver profile for the current authenticated user
 */
export async function getCurrentCaregiver() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { caregiver: null, error: "Not authenticated" };
  }

  const { data: caregiver, error } = await supabase
    .from("caregivers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { caregiver, error: error?.message };
}

/**
 * Get all caregivers for a patient
 */
export async function getPatientCaregivers(patientId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("patient_caregivers")
    .select(`
      *,
      caregiver:caregivers(*)
    `)
    .eq("patient_id", patientId);

  return { caregivers: data, error: error?.message };
}

/**
 * Get all patients for a caregiver
 */
export async function getCaregiverPatients(caregiverId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("patient_caregivers")
    .select(`
      *,
      patient:users(*)
    `)
    .eq("caregiver_id", caregiverId);

  return { patients: data, error: error?.message };
}

/**
 * Create a caregiver profile for the current user
 */
export async function createCaregiverProfile(name: string, email: string, phone?: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { caregiver: null, error: "Not authenticated" };
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

  return { caregiver, error: error?.message };
}

/**
 * Link a patient to a caregiver
 */
export async function linkPatientToCaregiver(
  patientId: string,
  caregiverId: string,
  relationship?: string,
  isPrimary: boolean = false
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("patient_caregivers")
    .insert({
      patient_id: patientId,
      caregiver_id: caregiverId,
      relationship: relationship || null,
      is_primary: isPrimary
    })
    .select()
    .single();

  return { link: data, error: error?.message };
}
