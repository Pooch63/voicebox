"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Link2, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
  const [tab, setTab] = useState<'create' | 'link'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Caregiver creation
  const [caregiverUserId, setCaregiverUserId] = useState("");
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");

  // Patient-Caregiver linking
  const [patientId, setPatientId] = useState("");
  const [caregiverId, setCaregiverId] = useState("");

  const handleCreateCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/create-caregiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: caregiverUserId,
          name: caregiverName,
          email: caregiverEmail
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create caregiver");
      }

      setMessage(`Caregiver created! ID: ${data.caregiver.caregiver_id}`);
      setCaregiverUserId("");
      setCaregiverName("");
      setCaregiverEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPatientCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/link-patient-caregiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          caregiver_id: caregiverId
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to link patient and caregiver");
      }

      setMessage("Patient and caregiver linked successfully!");
      setPatientId("");
      setCaregiverId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pt-6">
          <Link href="/" className="p-3 bg-[var(--surface)] rounded-full text-[var(--foreground)] hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Panel</h1>
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl mb-6 flex items-center gap-3 text-green-500">
            <CheckCircle2 size={24} />
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 text-red-500">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
              tab === 'create'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            <Users className="inline-block mr-2" size={20} />
            Create Caregiver
          </button>
          <button
            onClick={() => setTab('link')}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
              tab === 'link'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            <Link2 className="inline-block mr-2" size={20} />
            Link Patient
          </button>
        </div>

        {tab === 'create' ? (
          <div className="bg-[var(--surface)] rounded-3xl p-8 border border-[var(--border)]/50">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Create Caregiver Profile
            </h2>

            <form onSubmit={handleCreateCaregiver} className="space-y-4">
              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Auth User ID *
                </label>
                <input
                  type="text"
                  value={caregiverUserId}
                  onChange={(e) => setCaregiverUserId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="UUID from auth.users table"
                />
              </div>

              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="Caregiver Name"
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
                  placeholder="caregiver@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 mt-6"
              >
                {loading ? "Creating..." : "Create Caregiver"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-3xl p-8 border border-[var(--border)]/50">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Link Patient to Caregiver
            </h2>

            <form onSubmit={handleLinkPatientCaregiver} className="space-y-4">
              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="UUID from users.user_id"
                />
              </div>

              <div>
                <label className="block text-[var(--foreground)] font-semibold mb-2">
                  Caregiver ID *
                </label>
                <input
                  type="text"
                  value={caregiverId}
                  onChange={(e) => setCaregiverId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  placeholder="UUID from caregivers.caregiver_id"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold text-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 mt-6"
              >
                {loading ? "Linking..." : "Link Patient & Caregiver"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 bg-blue-500/10 border border-blue-500/50 p-6 rounded-2xl">
          <h3 className="font-bold text-[var(--foreground)] mb-3">Quick Guide:</h3>
          <ol className="list-decimal list-inside space-y-2 text-[var(--foreground)] opacity-80">
            <li>First, create a caregiver profile using an auth user ID</li>
            <li>Then, link a patient (user_id) to that caregiver</li>
            <li>The patient can now trigger notifications that the caregiver will see</li>
            <li>Visit <Link href="/caregiver" className="text-[var(--primary)] underline">/caregiver</Link> to view the dashboard</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
