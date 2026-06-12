"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Clock, X, ExternalLink, AlertCircle, Utensils, Settings, Plus } from "lucide-react";
import { supabase, type Notification } from "@/lib/db";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

type NotificationWithPatient = Notification & {
  patient: {
    name: string | null;
    user_id: string;
  };
};

type TabType = 'notifications' | 'therapy-words' | 'schedules';

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [notifications, setNotifications] = useState<NotificationWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Therapy words management
  const [therapyWords, setTherapyWords] = useState<string>("");
  const [currentWordLists, setCurrentWordLists] = useState<any[]>([]);
  const [savingWords, setSavingWords] = useState(false);
  const [sendingPrompt, setSendingPrompt] = useState(false);

  // Modal state
  const [modalInfo, setModalInfo] = useState<{message: string; isError: boolean} | null>(null);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('caregiver-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Realtime notification:', payload);
          loadNotifications(); // Reload all notifications
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    if (activeTab === 'therapy-words') {
      loadWordLists();
    }
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadWordLists = async () => {
    try {
      const res = await fetch(`/api/therapy-words`);
      if (!res.ok) throw new Error("Failed to fetch word lists");
      const data = await res.json();
      setCurrentWordLists(data.wordLists || []);
    } catch (error) {
      console.error("Error loading word lists:", error);
    }
  };
  
  const saveTherapyWords = async () => {
    if (!therapyWords.trim()) return;
    
    setSavingWords(true);
    try {
      const words = therapyWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
      const res = await fetch("/api/therapy-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: words,
          isActive: true
        })
      });
      
      if (!res.ok) throw new Error("Failed to save therapy words");
      
      setTherapyWords("");
      loadWordLists();
      setModalInfo({ message: "Therapy words saved successfully!", isError: false });
    } catch (error) {
      console.error("Error saving therapy words:", error);
      setModalInfo({ message: "Failed to save therapy words", isError: true });
    } finally {
      setSavingWords(false);
    }
  };
  
  const sendTherapyPrompt = async () => {
    setSendingPrompt(true);
    try {
      // Get active word list
      const res = await fetch(`/api/therapy-words`);
      if (!res.ok) throw new Error("Failed to fetch word lists");
      const data = await res.json();
      const activeList = data.wordLists?.find((list: any) => list.is_active);
      
      if (!activeList || activeList.words.length === 0) {
        setModalInfo({ message: "No active therapy words found for this patient. Please add words first.", isError: true });
        setSendingPrompt(false);
        return;
      }
      
      // Pick a random word
      const randomWord = activeList.words[Math.floor(Math.random() * activeList.words.length)];
      
      // Create notification
      const notifRes = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_type: "therapy_prompt",
          title: "Therapy Practice Requested",
          message: `Please practice saying: ${randomWord}`,
          metadata: { therapy_word: randomWord },
          priority: "high"
        })
      });
      
      if (!notifRes.ok) throw new Error("Failed to send prompt");
      
      setModalInfo({ message: `Therapy prompt sent! Word: ${randomWord}`, isError: false });
    } catch (error) {
      console.error("Error sending therapy prompt:", error);
      setModalInfo({ message: "Failed to send therapy prompt", isError: true });
    } finally {
      setSendingPrompt(false);
    }
  };

  const updateNotificationStatus = async (notificationId: string, status: string) => {
    setUpdating(notificationId);
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error("Failed to update notification");
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId
            ? { ...n, status: status as Notification['status'] }
            : n
        )
      );
    } catch (error) {
      console.error("Error updating notification:", error);
    } finally {
      setUpdating(null);
    }
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const acknowledgedNotifications = notifications.filter(n => n.status === 'acknowledged');
  const completedNotifications = notifications.filter(n => n.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/50';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
      case 'normal': return 'text-blue-500 bg-blue-500/10 border-blue-500/50';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/50';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'food_request':
      case 'food_order':
        return <Utensils size={24} />;
      case 'emergency':
        return <AlertCircle size={24} />;
      default:
        return <Bell size={24} />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <Bell size={40} className="text-[var(--primary)] animate-pulse mx-auto mb-3 sm:w-12 sm:h-12" />
          <p className="text-lg sm:text-xl text-[var(--foreground)] opacity-70">Loading notifications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] pb-20 sm:pb-24">
      {/* Header - mobile optimized */}
      <div className="pt-6 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 bg-gradient-to-b from-[var(--surface)] to-transparent safe-top">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 max-w-6xl mx-auto w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1.5 sm:mb-2">
              Caregiver Dashboard
            </h1>
            <p className="text-lg sm:text-xl text-[var(--foreground)] opacity-60">
              {pendingNotifications.length} pending notification{pendingNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link 
              href="/"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--surface)] rounded-full text-[var(--foreground)] hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-[var(--border)] text-sm sm:text-base touch-manipulation"
            >
              Patient View
            </Link>
            <UserMenu />
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-3 mt-6 max-w-6xl mx-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-white/10'
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('therapy-words')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${
              activeTab === 'therapy-words'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-white/10'
            }`}
          >
            Therapy Words
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'therapy-words' && renderTherapyWords()}
      </div>

      {/* Info Modal */}
      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start mb-4">
              <div className={`p-3 rounded-full mr-4 ${modalInfo.isError ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                {modalInfo.isError ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                  {modalInfo.isError ? 'Error' : 'Success'}
                </h3>
                <p className="text-[var(--foreground)] opacity-80 text-sm">
                  {modalInfo.message}
                </p>
              </div>
              <button 
                onClick={() => setModalInfo(null)}
                className="text-[var(--foreground)] opacity-50 hover:opacity-100 transition-opacity ml-2"
              >
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => setModalInfo(null)}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold transition-all hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
  
  function renderNotifications() {
    return (
      <div className="space-y-6 sm:space-y-8">
        
        {/* Pending Notifications */}
        <section>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <Bell size={22} className="text-[var(--primary)] sm:w-6 sm:h-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Pending Requests
            </h2>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[var(--primary)]/20 text-[var(--primary)] rounded-full text-xs sm:text-sm font-bold">
              {pendingNotifications.length}
            </span>
          </div>

          {pendingNotifications.length === 0 ? (
            <div className="bg-[var(--surface)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-[var(--border)]/50">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3 sm:w-12 sm:h-12 opacity-50" />
              <p className="text-[var(--foreground)] opacity-60 text-base sm:text-lg">
                All caught up! No pending notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`bg-[var(--surface)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 ${getPriorityColor(notification.priority)} shadow-lg active:shadow-md transition-all`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] break-words">
                            {notification.title}
                          </h3>
                          <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(notification.priority)} self-start`}>
                            {notification.priority}
                          </span>
                        </div>
                        
                        <p className="text-[var(--foreground)] opacity-80 mb-2 sm:mb-3 text-sm sm:text-base break-words">
                          {notification.message}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-[var(--foreground)] opacity-60">
                          <span className="font-semibold">
                            From: {notification.patient?.name || "Patient"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-xs">{new Date(notification.created_at).toLocaleString()}</span>
                        </div>

                        {/* Restaurant info if available */}
                        {notification.metadata?.restaurant_name && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl">
                            <p className="font-semibold text-[var(--foreground)] mb-1 text-sm sm:text-base break-words">
                              Restaurant: {notification.metadata.restaurant_name as string}
                            </p>
                            {notification.metadata?.order_details && (
                              <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-60">
                                Rating: ⭐ {(notification.metadata.order_details as Record<string, unknown>).rating}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => updateNotificationStatus(notification.notification_id, 'acknowledged')}
                        disabled={updating === notification.notification_id}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-600 text-white rounded-xl font-bold text-sm sm:text-base transition-colors disabled:opacity-50 whitespace-nowrap touch-manipulation active:scale-[0.98]"
                      >
                        {updating === notification.notification_id ? "..." : "Acknowledge"}
                      </button>
                      <button
                        onClick={() => updateNotificationStatus(notification.notification_id, 'completed')}
                        disabled={updating === notification.notification_id}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 active:bg-green-600 text-white rounded-xl font-bold text-sm sm:text-base transition-colors disabled:opacity-50 whitespace-nowrap touch-manipulation active:scale-[0.98]"
                      >
                        {updating === notification.notification_id ? "..." : "Complete"}
                      </button>
                      <button
                        onClick={() => updateNotificationStatus(notification.notification_id, 'dismissed')}
                        disabled={updating === notification.notification_id}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-600 text-white rounded-xl font-bold text-sm sm:text-base transition-colors disabled:opacity-50 whitespace-nowrap touch-manipulation active:scale-[0.98]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acknowledged Notifications */}
        {acknowledgedNotifications.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <Clock size={22} className="text-yellow-500 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                In Progress
              </h2>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs sm:text-sm font-bold">
                {acknowledgedNotifications.length}
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {acknowledgedNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="bg-[var(--surface)] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-yellow-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--foreground)] mb-1 text-base sm:text-lg break-words">
                      {notification.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-60">
                      From: {notification.patient?.name || "Patient"}
                    </p>
                  </div>
                  <button
                    onClick={() => updateNotificationStatus(notification.notification_id, 'completed')}
                    disabled={updating === notification.notification_id}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2 bg-green-500 hover:bg-green-600 active:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 touch-manipulation active:scale-[0.98]"
                  >
                    Mark Complete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed Notifications */}
        {completedNotifications.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <CheckCircle2 size={22} className="text-green-500 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                Completed
              </h2>
            </div>

            <div className="space-y-2">
              {completedNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.notification_id}
                  className="bg-[var(--surface)] rounded-xl p-3.5 sm:p-4 border border-green-500/20 opacity-60"
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base break-words">
                        {notification.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-60 mt-0.5">
                        Completed: {notification.completed_at ? new Date(notification.completed_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 sm:w-5 sm:h-5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }
  
  function renderTherapyWords() {
    return (
      <div className="space-y-6 sm:space-y-8 mt-6">
        {/* Patient Selector */}
        <section className="bg-[var(--surface)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[var(--border)]/50">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-4">
            Manage Therapy Words
          </h2>
          
          <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                    Therapy Words (comma-separated)
                  </label>
                  <textarea
                    value={therapyWords}
                    onChange={(e) => setTherapyWords(e.target.value)}
                    placeholder="Apple, Water, Hello, Yes, No, Please, Thank you"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <p className="text-xs text-[var(--foreground)] opacity-60 mt-2">
                    Enter words separated by commas. These will be used for therapy prompts.
                  </p>
                </div>
                
                <button
                  onClick={saveTherapyWords}
                  disabled={!therapyWords.trim() || savingWords}
                  className="w-full sm:w-auto px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90"
                >
                  {savingWords ? "Saving..." : "Save Therapy Words"}
                </button>
                
                {/* Current Word Lists */}
                {currentWordLists.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">
                      Current Word Lists
                    </h3>
                    <div className="space-y-3">
                      {currentWordLists.map((list) => (
                        <div
                          key={list.id}
                          className={`p-4 rounded-xl border ${
                            list.is_active
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-[var(--background)] border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-semibold text-[var(--foreground)]">
                              {list.is_active && (
                                <span className="text-green-500 mr-2">● Active</span>
                              )}
                              Created by {list.caregiver?.name}
                            </span>
                            <span className="text-xs text-[var(--foreground)] opacity-60">
                              {new Date(list.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--foreground)]">
                            {list.words.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        </section>
      </div>
    );
  }
}
