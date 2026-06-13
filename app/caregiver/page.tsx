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
      case 'urgent': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'normal': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-[var(--foreground)] bg-black/5 dark:bg-white/5';
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
          <Bell size={40} className="text-[var(--foreground)] animate-pulse mx-auto mb-4 opacity-50" />
          <p className="text-base text-[var(--foreground)] opacity-60">Loading notifications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] pb-20 sm:pb-24 font-sans">
      {/* Header - mobile optimized */}
      <div className="pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 sm:px-6 safe-top">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--foreground)] tracking-tight mb-2">
              Caregiver Dashboard
            </h1>
            <p className="text-base sm:text-lg text-[var(--foreground)] opacity-50 font-medium">
              {pendingNotifications.length} pending notification{pendingNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/"
              className="px-5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[var(--foreground)] active:scale-95 transition-all text-sm font-medium touch-manipulation"
            >
              Patient View
            </Link>
            <UserMenu />
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-3 mt-10 max-w-5xl mx-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center ${
              activeTab === 'notifications'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'text-[var(--foreground)] opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Bell size={16} className="mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('therapy-words')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'therapy-words'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'text-[var(--foreground)] opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Therapy Words
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'therapy-words' && renderTherapyWords()}
      </div>

      {/* Info Modal */}
      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-md">
          <div className="bg-[var(--surface)] rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start mb-5">
              <div className={`p-2.5 rounded-lg mr-4 ${modalInfo.isError ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {modalInfo.isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  {modalInfo.isError ? 'Error' : 'Success'}
                </h3>
                <p className="text-[var(--foreground)] opacity-60 text-sm">
                  {modalInfo.message}
                </p>
              </div>
              <button 
                onClick={() => setModalInfo(null)}
                className="text-[var(--foreground)] opacity-40 hover:opacity-100 transition-opacity ml-2"
              >
                <X size={18} />
              </button>
            </div>
            <button
              onClick={() => setModalInfo(null)}
              className="w-full py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--foreground)] rounded-lg font-medium transition-all"
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
      <div className="space-y-10 sm:space-y-16 pb-12">
        
        {/* Pending Notifications */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] tracking-tight">
              Pending Requests
            </h2>
            <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[var(--foreground)] rounded-md text-xs font-medium">
              {pendingNotifications.length}
            </span>
          </div>

          {pendingNotifications.length === 0 ? (
            <div className="bg-[var(--surface)] rounded-lg p-10 text-center">
              <CheckCircle2 size={32} className="text-[var(--foreground)] opacity-20 mx-auto mb-4" />
              <p className="text-[var(--foreground)] opacity-50 text-sm font-medium">
                All caught up! No pending notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="bg-[var(--surface)] rounded-lg p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-6"
                >
                  <div className="flex items-start gap-5 flex-1 w-full">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-[var(--foreground)] break-words">
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      
                      <p className="text-[var(--foreground)] opacity-70 mb-4 text-sm break-words leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-[var(--foreground)] opacity-40 font-medium">
                        <span>
                          From: {notification.patient?.name || "Patient"}
                        </span>
                        <span>•</span>
                        <span>{new Date(notification.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</span>
                      </div>

                      {/* Restaurant info if available */}
                      {notification.metadata?.restaurant_name && (
                        <div className="mt-5 p-4 bg-black/5 dark:bg-white/5 rounded-lg border-l-2 border-blue-500">
                          <p className="font-medium text-[var(--foreground)] mb-1 text-sm break-words">
                            Restaurant: {notification.metadata.restaurant_name as string}
                          </p>
                          {notification.metadata?.order_details && (
                            <p className="text-xs text-[var(--foreground)] opacity-60">
                              Rating: ⭐ {(notification.metadata.order_details as Record<string, unknown>).rating}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={() => updateNotificationStatus(notification.notification_id, 'acknowledged')}
                      disabled={updating === notification.notification_id}
                      className="px-5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 text-[var(--foreground)] rounded-lg font-medium text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {updating === notification.notification_id ? "..." : "Acknowledge"}
                    </button>
                    <button
                      onClick={() => updateNotificationStatus(notification.notification_id, 'completed')}
                      disabled={updating === notification.notification_id}
                      className="px-5 py-2.5 bg-[var(--foreground)] hover:opacity-90 active:scale-95 text-[var(--background)] rounded-lg font-medium text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {updating === notification.notification_id ? "..." : "Complete"}
                    </button>
                    <button
                      onClick={() => updateNotificationStatus(notification.notification_id, 'dismissed')}
                      disabled={updating === notification.notification_id}
                      className="px-5 py-2.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[var(--foreground)] opacity-50 hover:opacity-100 rounded-lg font-medium text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acknowledged Notifications */}
        {acknowledgedNotifications.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] tracking-tight">
                In Progress
              </h2>
              <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[var(--foreground)] rounded-md text-xs font-medium">
                {acknowledgedNotifications.length}
              </span>
            </div>

            <div className="space-y-3">
              {acknowledgedNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="bg-[var(--surface)] rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--foreground)] mb-1.5 text-sm sm:text-base break-words">
                      {notification.title}
                    </h3>
                    <p className="text-xs text-[var(--foreground)] opacity-50 font-medium">
                      From: {notification.patient?.name || "Patient"}
                    </p>
                  </div>
                  <button
                    onClick={() => updateNotificationStatus(notification.notification_id, 'completed')}
                    disabled={updating === notification.notification_id}
                    className="w-full sm:w-auto px-5 py-2 bg-[var(--foreground)] hover:opacity-90 active:scale-95 text-[var(--background)] rounded-lg font-medium text-sm transition-all disabled:opacity-50"
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
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] tracking-tight">
                Completed
              </h2>
            </div>

            <div className="space-y-2">
              {completedNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.notification_id}
                  className="bg-transparent rounded-lg py-3 px-4 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--foreground)] text-sm break-words">
                      {notification.title}
                    </h3>
                    <p className="text-xs text-[var(--foreground)] opacity-60 mt-1 font-medium">
                      Completed: {notification.completed_at ? new Date(notification.completed_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'}) : 'N/A'}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-[var(--foreground)] opacity-40 flex-shrink-0" />
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
      <div className="space-y-8 pb-12">
        <section className="bg-[var(--surface)] shadow-sm rounded-lg p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-6 tracking-tight">
            Manage Therapy Words
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] opacity-70 mb-2">
                Therapy Words (comma-separated)
              </label>
              <textarea
                value={therapyWords}
                onChange={(e) => setTherapyWords(e.target.value)}
                placeholder="Apple, Water, Hello, Yes, No, Please, Thank you"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5 text-[var(--foreground)] placeholder:text-[var(--foreground)] placeholder:opacity-20 focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] focus:ring-opacity-20 resize-none transition-all"
              />
              <p className="text-xs text-[var(--foreground)] opacity-40 mt-2 font-medium">
                Enter words separated by commas. These will be used for therapy prompts.
              </p>
            </div>
            
            <button
              onClick={saveTherapyWords}
              disabled={!therapyWords.trim() || savingWords}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
            >
              {savingWords ? "Saving..." : "Save Therapy Words"}
            </button>
            
            {/* Current Word Lists */}
            {currentWordLists.length > 0 && (
              <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
                <h3 className="text-sm font-medium text-[var(--foreground)] opacity-70 mb-4">
                  Current Word Lists
                </h3>
                <div className="space-y-3">
                  {currentWordLists.map((list) => (
                    <div
                      key={list.id}
                      className={`p-4 sm:p-5 rounded-lg ${
                        list.is_active
                          ? 'bg-black/5 dark:bg-white/5'
                          : 'bg-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-[var(--foreground)] flex items-center">
                          {list.is_active && (
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          )}
                          Created by {list.caregiver?.name}
                        </span>
                        <span className="text-xs text-[var(--foreground)] opacity-40 font-medium">
                          {new Date(list.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] opacity-80 leading-relaxed">
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
