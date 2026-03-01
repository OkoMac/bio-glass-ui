import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RealtimeMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  messageType: string;
  createdAt: string;
}

type SupaMsg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean | null;
  message_type: string | null;
  created_at: string;
};

function mapMsg(r: SupaMsg): RealtimeMessage {
  return {
    id:          r.id,
    senderId:    r.sender_id,
    receiverId:  r.receiver_id,
    content:     r.content,
    isRead:      r.is_read ?? false,
    messageType: r.message_type ?? "text",
    createdAt:   r.created_at,
  };
}

/**
 * Hook for a 1:1 conversation between the current user and `partnerId`.
 * `partnerId` should be the partner's profiles.id (not auth user id).
 * Falls back to empty array (no-op) when no real user session exists.
 */
export function useMessages(partnerId: string | null) {
  const { user } = useAuth();
  // profiles.id is the FK used in messages — distinct from auth user id
  const profileId = user?.profileId;
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!profileId || !partnerId) return;

    // Fetch message history — filter by conversation partner only;
    // RLS restricts rows to those where auth user is sender or receiver
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`,
        )
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages((data as SupaMsg[]).map(mapMsg));
        // Mark received messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", partnerId)
          .eq("receiver_id", profileId)
          .eq("is_read", false);
      }
    };

    fetchMessages();

    // Realtime: listen for new messages in this conversation
    const channel = supabase
      .channel(`messages-${profileId}-${partnerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as SupaMsg;
        // RLS already limits events to this user; just filter by partner
        const isRelevant =
          msg.sender_id === partnerId || msg.receiver_id === partnerId;
        if (isRelevant) {
          setMessages(prev => [...prev, mapMsg(msg)]);
          // Auto-mark incoming as read
          if (msg.receiver_id === profileId) {
            supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId, partnerId]);

  const sendMessage = useCallback(async (content: string, messageType = "text") => {
    if (!profileId || !partnerId || !content.trim()) return;
    setSending(true);
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: RealtimeMessage = {
      id: tempId, senderId: profileId, receiverId: partnerId,
      content: content.trim(), isRead: false, messageType,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const { data, error } = await supabase.from("messages").insert({
      sender_id:    profileId,
      receiver_id:  partnerId,
      content:      content.trim(),
      message_type: messageType,
      is_read:      false,
    }).select().single();

    if (!error && data) {
      // Replace optimistic with real row
      setMessages(prev =>
        prev.map(m => m.id === tempId ? mapMsg(data as SupaMsg) : m),
      );
    }
    setSending(false);
  }, [profileId, partnerId]);

  return { messages, sendMessage, sending };
}

/** Get unread count for a specific partner, or total if partnerId is null */
export function useUnreadCount(partnerId?: string) {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profileId) return;

    const fetchCount = async () => {
      let query = supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("receiver_id", profileId)
        .eq("is_read", false);

      if (partnerId) query = query.eq("sender_id", partnerId) as typeof query;

      const { count: c } = await query;
      setCount(c ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`unread-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId, partnerId]);

  return count;
}
