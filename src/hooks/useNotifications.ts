import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

/**
 * Fetches the user's in-app notifications from Supabase.
 * Subscribes to realtime inserts so new notifications appear instantly.
 */
export function useNotifications() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId || profileId.startsWith("demo_")) { setLoading(false); return; }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as unknown as DbNotification[]);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Realtime subscription — listen for new notifications AND updates (mark-read
    // from another tab/device, or backend-driven read status changes).
    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profileId}` },
        (payload) => {
          setNotifications(prev => [payload.new as DbNotification, ...prev]);
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${profileId}` },
        (payload) => {
          const updated = payload.new as DbNotification;
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? updated : n),
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!profileId || profileId.startsWith("demo_")) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", profileId).eq("read", false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
