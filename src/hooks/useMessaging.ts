/**
 * Realtime messaging hooks for BION.
 *
 * useConversations()  — lists every thread the caller participates in,
 *                       with unread counts, last-message preview and
 *                       live updates via Supabase Realtime.
 * useConversation(id) — messages for a single thread, with optimistic
 *                       sending, auto-mark-read and live inbound updates.
 *
 * The existing useMessages/useUnreadCount hooks in ./useMessages.ts are
 * left alone so we don't break Messages.tsx — those can be migrated to
 * these hooks incrementally.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ── Types ──────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  partnerSpecialty: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string | null;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  _pending?: boolean;
}

// ── Row -> domain mapping ──────────────────────────────────────────

type SupaMsgRow = {
  id: string;
  conversation_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string | null;
  is_read: boolean | null;
  created_at: string;
};

function mapMsg(r: SupaMsgRow): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    content: r.content,
    messageType: r.message_type ?? "text",
    isRead: r.is_read ?? false,
    createdAt: r.created_at,
  };
}

// ── Auth-aware fetch ───────────────────────────────────────────────

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(`${API}${path}`, { ...init, headers });
}

// ── useConversations ───────────────────────────────────────────────

/**
 * Returns all conversations the caller participates in. Re-fetches
 * whenever a relevant `messages` row is inserted/updated.
 */
export function useConversations() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!profileId || profileId.startsWith("demo_")) {
      setConversations([]);
      setLoading(false);
      return;
    }
    try {
      const r = await authFetch("/api/messages/conversations");
      const json = await r.json();
      if (json?.ok) setConversations(json.data ?? []);
    } catch {
      // Silent — the UI falls back to empty list.
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime — any new/updated message that involves the caller should
  // refresh the conversations list (re-orders + bumps unread counts).
  useEffect(() => {
    if (!profileId || profileId.startsWith("demo_")) return;

    // 2026-04-29 (Mistake 16): channel name was deterministic
    // (`conversations-for-${profileId}`). React 18 effect re-runs (and
    // Supabase's internal channel cache) caused the second mount to
    // grab the still-subscribed channel and the second `.on()` chain
    // fired "cannot add postgres_changes callbacks after subscribe()",
    // crashing the page into the ErrorBoundary. Suffix with a random
    // id so each mount gets a fresh channel; cleanup removes it by
    // reference regardless.
    const channel = supabase
      .channel(`conversations-for-${profileId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload: any /* TODO(types) */) => {
          const row = (payload.new ?? payload.old) as SupaMsgRow | null;
          if (!row) return;
          // RLS already restricts to rows we can see, but double-check so we
          // don't refetch on unrelated traffic.
          if (row.sender_id === profileId || row.receiver_id === profileId) {
            fetchConversations();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread ?? 0), 0);

  return { conversations, loading, totalUnread, refresh: fetchConversations };
}

// ── useConversation ────────────────────────────────────────────────

/**
 * Messages for a single thread. Subscribes to inserts/updates on the
 * conversation. `sendMessage` is optimistic — the pending bubble shows
 * instantly and is reconciled when the backend responds OR when the
 * realtime echo lands, whichever arrives first.
 */
export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  // Dedupe incoming realtime rows against already-present ones (both
  // optimistic and server-echoed).
  const knownIdsRef = useRef<Set<string>>(new Set());

  // ── Initial fetch ──
  useEffect(() => {
    if (!conversationId || !profileId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const r = await authFetch(
          `/api/messages/conversations/${conversationId}/messages?limit=50`,
        );
        const json = await r.json();
        if (cancelled) return;
        if (json?.ok) {
          // Backend returns newest-first, flip for display.
          const list: Message[] = ((json.data as SupaMsgRow[]) ?? [])
            .map(mapMsg)
            .reverse();
          knownIdsRef.current = new Set(list.map(m => m.id));
          setMessages(list);
        }
      } catch {
        // Keep previous messages; UI will retry on next open.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, profileId]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!conversationId || !profileId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any /* TODO(types) */) => {
          const msg = mapMsg(payload.new as SupaMsgRow);
          if (knownIdsRef.current.has(msg.id)) return;
          knownIdsRef.current.add(msg.id);
          setMessages(prev => [...prev, msg]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any /* TODO(types) */) => {
          const updated = mapMsg(payload.new as SupaMsgRow);
          setMessages(prev =>
            prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  // ── Send (optimistic) ──
  const sendMessage = useCallback(
    async (body: string) => {
      if (!body.trim() || !conversationId || !profileId) return;

      // Find the partner from the current messages (if any). If we can't
      // tell yet, bail — the message list hydrates on mount so this is rare.
      const sample = messages[0] ?? messages[messages.length - 1];
      let toProfileId: string | null = null;
      if (sample) {
        toProfileId =
          sample.senderId === profileId ? sample.receiverId : sample.senderId;
      }
      if (!toProfileId) {
        // Fall back to reading the conversation row directly.
        const { data: conv } = await supabase
          .from("conversations" as any)
          .select("participant_a, participant_b")
          .eq("id", conversationId)
          .maybeSingle();
        if (conv) {
          const pa = (conv as any).participant_a;
          const pb = (conv as any).participant_b;
          toProfileId = pa === profileId ? pb : pa;
        }
      }
      if (!toProfileId) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: profileId,
        receiverId: toProfileId,
        content: body.trim(),
        messageType: "text",
        isRead: false,
        createdAt: new Date().toISOString(),
        _pending: true,
      };
      setMessages(prev => [...prev, optimistic]);

      try {
        const r = await authFetch("/api/messages/send", {
          method: "POST",
          body: JSON.stringify({ toProfileId, body: body.trim() }),
        });
        const json = await r.json();
        if (json?.ok && json.data) {
          const real = mapMsg(json.data as SupaMsgRow);
          knownIdsRef.current.add(real.id);
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? real : m)),
          );
        } else {
          // Drop the optimistic bubble on failure so the user can retry.
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    },
    [conversationId, profileId, messages],
  );

  // ── Mark-read ──
  const markRead = useCallback(async () => {
    if (!conversationId || !profileId) return;
    try {
      await authFetch("/api/messages/mark-read", {
        method: "POST",
        body: JSON.stringify({ conversationId }),
      });
    } catch {
      // non-fatal
    }
  }, [conversationId, profileId]);

  // Auto mark-read while the conversation is open + there are unread inbound
  // messages. Re-runs whenever a new inbound message arrives.
  useEffect(() => {
    if (!conversationId || !profileId) return;
    const hasUnreadInbound = messages.some(
      m => m.receiverId === profileId && !m.isRead && !m._pending,
    );
    if (hasUnreadInbound) {
      markRead();
    }
  }, [messages, conversationId, profileId, markRead]);

  return { messages, loading, sendMessage, markRead };
}
