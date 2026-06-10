"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, RefreshCcw } from "lucide-react";

type Order = {
  id: string;
  food_name: string;
  restaurant_name: string;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto refresh every 10 seconds for the hackathon
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Remove from list or update status
        setOrders((prev) => prev.filter((order) => order.id !== id));
      }
    } catch (error) {
      console.error("Failed to update order", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Caregiver Dashboard</h1>
            <p className="text-xl text-[var(--foreground)] opacity-60">Manage food requests and alerts</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)]/50 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={24} className="text-[var(--primary)]" />
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Pending Food Requests</h2>
          </div>

          {loading && orders.length === 0 ? (
            <div className="py-12 text-center text-[var(--foreground)] opacity-50">Loading requests...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-[var(--foreground)] opacity-50 border-2 border-dashed border-[var(--border)] rounded-2xl">
              No pending requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
                      {order.restaurant_name}
                    </h3>
                    <p className="text-[var(--foreground)] opacity-60">
                      Requested at: {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'rejected')}
                      disabled={processingId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors font-semibold disabled:opacity-50"
                    >
                      <X size={20} />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'approved')}
                      disabled={processingId === order.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-colors font-semibold disabled:opacity-50"
                    >
                      <Check size={20} />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
