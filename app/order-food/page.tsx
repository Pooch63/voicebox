"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Utensils, AlertCircle } from "lucide-react";

type Business = {
  id: string;
  name: string;
  image_url: string;
  rating: number;
};

export default function OrderFoodPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchFood() {
      try {
        const res = await fetch("/api/yelp");
        if (!res.ok) throw new Error("Failed to fetch food options");
        const data = await res.json();
        if (data.businesses) {
          setBusinesses(data.businesses);
        } else {
          setErrorMsg("Could not load food options.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load food options.");
      } finally {
        setLoading(false);
      }
    }
    fetchFood();
  }, []);

  const handleOrder = async (business: Business) => {
    setOrdering(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_name: "Custom Order", // Using a generic name for now, could add menu integration later
          restaurant_name: business.name,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      setSuccessMsg(`Your order from ${business.name} has been sent to your caregiver for approval!`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (successMsg) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Request Sent!</h1>
        <p className="text-xl text-[var(--foreground)] opacity-70 mb-12 max-w-md">{successMsg}</p>
        <Link 
          href="/" 
          className="px-8 py-4 bg-[var(--primary)] text-white rounded-full font-bold text-lg hover:bg-[var(--primary)]/90 transition-colors shadow-lg"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] p-6 relative">
      <div className="max-w-4xl mx-auto flex flex-col h-full">
        <div className="flex items-center gap-4 mb-8 pt-6">
          <Link href="/" className="p-3 bg-[var(--surface)] rounded-full text-[var(--foreground)] hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">What are you craving?</h1>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-8 flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <p>{errorMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
            <Utensils size={48} className="text-[var(--primary)] animate-bounce mb-4" />
            <p className="text-xl text-[var(--foreground)] opacity-70">Finding tasty food near you...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
            {businesses.map((business) => (
              <button
                key={business.id}
                onClick={() => handleOrder(business)}
                disabled={ordering}
                className="group relative overflow-hidden bg-[var(--surface)] rounded-3xl p-6 shadow-md border border-[var(--border)]/50 hover:border-[var(--primary)] transition-all duration-300 text-left flex items-center gap-6 disabled:opacity-50"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={business.image_url} 
                    alt={business.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">{business.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-bold">
                      ★ {business.rating}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
