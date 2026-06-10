import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";

export default function CaregiverCallPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--background)] text-center animate-fade-in">
      <div className="bg-[var(--surface)] p-10 rounded-3xl shadow-xl max-w-md w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-primary-gradient rounded-full flex items-center justify-center mb-8 shadow-lg shadow-[var(--primary)]/30 animate-pulse-ring">
          <Phone size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Caregiver Conversation</h1>
        <p className="text-[var(--foreground)] opacity-70 mb-10 text-lg">
          This feature is currently under development. Soon, you'll be able to have a live conversation with your caregiver here.
        </p>

        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-white/10 transition-colors w-full justify-center"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
