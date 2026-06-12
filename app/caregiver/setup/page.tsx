"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function CaregiverSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'link'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Caregiver creation form
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  
  // Patient linking form
  const [patientEmail, setPatientEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleCreateCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // This would call your API to create caregiver profile
      const res = await fetch("/api/caregivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: caregiverName,
          email: caregiverEmail,
          phone: caregiverPhone
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create caregiver profile");
      }

      setStep('link');
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // This would call your API to link patient to caregiver
      const res = await fetch("/api/caregivers/link-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_email: patientEmail,
          relationship,
          is_primary: isPrimary
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to link patient");
      }

      // Success! Redirect to caregiver dashboard
      router.push("/caregiver");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pt-6">
          <Link href="/caregiver" className="p-3 bg-[var(--surface)] rounded-full text-[var(--foreground)] hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Caregiver Setup
          </h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 text-red-500">
            {error}
          </div>
        )}

        {step === 'create' ? (
          <div className="bg-[var(--surface)] rounded-3xl p-8 border border-[var(--border)]/50">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
              <UserPlus size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Create Caregiver Profile
            </h2>
            <p className="text-[var(--foreground)] opacity-60 mb-6">
              Set up your caregiver account to receive patient notifications.
            </p>

            <form onSubmit={handleCreateCaregiver} className="space-y-4">
              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="555-1234"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 mt-6"
              >
                {loading ? "Creating..." : "Create Profile"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-3xl p-8 border border-[var(--border)]/50">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-500">
              <LinkIcon size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Link Patient
            </h2>
            <p className="text-[var(--foreground)] opacity-60 mb-6">
              Connect with a patient to start receiving their notifications.
            </p>

            <form onSubmit={handleLinkPatient} className="space-y-4">
              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Patient Email *
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="patient@example.com"
                />
              </div>

              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="Spouse, Family, Professional, etc."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isPrimary" className="text-[var(--foreground)] font-semibold">
                  Set as primary caregiver
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 mt-6"
              >
                {loading ? "Linking..." : "Link Patient"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/caregiver")}
                className="w-full py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Skip for Now
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
