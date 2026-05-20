import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import WhatsAppCRMTabs from "@/components/WhatsAppCRMTabs";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, UserPlus, Users, MessageSquare, X, Plus, Trash2, StickyNote, Tag as TagIcon, Phone, Mail, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Tag { id: string; name: string; color: string; description?: string | null }
interface Contact {
  phone: string;
  profile_id: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  marketing_opt_in: boolean | null;
  joined_at: string | null;
  last_message_at: string | null;
  msgs_in: number; msgs_out: number; msgs_total: number;
  tags: Tag[];
}
interface ContactDetail {
  phone: string;
  profile: any | null;
  messages: Array<{ id: string; direction: "in" | "out"; content: string; created_at: string; meta?: any }>;
  tags: Array<{ id: string; tag_id: string; added_at: string; name: string; color: string }>;
  notes: Array<{ id: string; body: string; author_id: string | null; created_at: string }>;
  bookings: Array<{ id: string; booking_date: string; booking_time: string | null; status: string; services?: { title: string } | null; profiles?: { full_name: string } | null }>;
}

function fmtPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("27")) return `+27 ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return p.startsWith("+") ? p : `+${d}`;
}

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms)) return "—";
  const min = Math.round(ms / 60_000);
  if (min < 1)    return "just now";
  if (min < 60)   return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24)    return `${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 30)     return `${d}d`;
  const mo = Math.round(d / 30);
  return `${mo}mo`;
}

export default function AdminCRMContacts() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const headers = useMemo<Record<string, string>>(
    () => {
      const h: Record<string, string> = {};
      if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
      return h;
    },
    [session?.access_token],
  );

  // Initial load
  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (tagFilter) params.set("tag", tagFilter);
        const [cRes, tRes] = await Promise.all([
          fetch(`${API}/api/crm/contacts?${params}`, { headers }),
          fetch(`${API}/api/crm/tags`, { headers }),
        ]);
        const cJson = await cRes.json().catch(() => ({}));
        const tJson = await tRes.json().catch(() => ({}));
        if (cancelled) return;
        setContacts(cJson?.data ?? []);
        setTags(tJson?.data ?? []);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "Couldn't load contacts", { duration: 8000 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.access_token, q, tagFilter, headers]);

  // Detail fetch
  const openContact = useCallback(async (phone: string) => {
    setSelectedPhone(phone);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`${API}/api/crm/contacts/${encodeURIComponent(phone)}`, { headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setDetail({
        phone: j.phone, profile: j.profile, messages: j.messages ?? [],
        tags: j.tags ?? [], notes: j.notes ?? [], bookings: j.bookings ?? [],
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't load contact", { duration: 8000 });
    } finally {
      setDetailLoading(false);
    }
  }, [headers]);

  const addTag = async (tagId: string) => {
    if (!selectedPhone) return;
    try {
      const res = await fetch(`${API}/api/crm/contacts/${encodeURIComponent(selectedPhone)}/tags`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await openContact(selectedPhone);
      toast.success("Tag added");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't add tag", { duration: 8000 });
    }
  };

  const removeTag = async (tagId: string) => {
    if (!selectedPhone) return;
    try {
      const res = await fetch(`${API}/api/crm/contacts/${encodeURIComponent(selectedPhone)}/tags/${tagId}`, {
        method: "DELETE", headers,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await openContact(selectedPhone);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't remove tag", { duration: 8000 });
    }
  };

  const addNote = async () => {
    if (!selectedPhone || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API}/api/crm/contacts/${encodeURIComponent(selectedPhone)}/notes`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ body: newNote.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setNewNote("");
      await openContact(selectedPhone);
      toast.success("Note saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save note", { duration: 8000 });
    } finally {
      setSavingNote(false);
    }
  };

  // Counts for the headline strip
  const counts = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400_000;
    return {
      total:    contacts.length,
      active7d: contacts.filter(c => c.last_message_at && new Date(c.last_message_at).getTime() > sevenDaysAgo).length,
      tagged:   contacts.filter(c => c.tags.length > 0).length,
      lapsed:   contacts.filter(c => c.last_message_at && Date.now() - new Date(c.last_message_at).getTime() > 30 * 86400_000).length,
    };
  }, [contacts]);

  const availableTagsForContact = useMemo(() => {
    if (!detail) return tags;
    const have = new Set(detail.tags.map(t => t.tag_id));
    return tags.filter(t => !have.has(t.id));
  }, [tags, detail]);

  return (
    <>
      <AdminNav />
      <div className="md:ml-56 min-h-screen pt-16 md:pt-0 px-4 md:px-8 py-6 space-y-5">
        <WhatsAppCRMTabs />

        {/* Header + counts */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#10B981,#0D9488)" }}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Contacts</h1>
            <p className="text-[11px] text-muted-foreground">
              Registered users + anyone who has ever messaged the BION WhatsApp number.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Total",       value: counts.total },
            { label: "Active 7d",   value: counts.active7d },
            { label: "Tagged",      value: counts.tagged },
            { label: "Lapsed 30d+", value: counts.lapsed },
          ].map((c) => (
            <div key={c.label} className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <p className="text-xl font-semibold text-foreground tabular-nums">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Search + tag filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, email…"
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-pill pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => setTagFilter(null)}
              className={`text-[10px] px-2.5 py-1 rounded-full border ${
                tagFilter === null ? "bg-coral/15 text-coral border-coral/30" : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:bg-white/[0.04]"
              }`}>All</button>
            {tags.map((t) => (
              <button key={t.id} onClick={() => setTagFilter(t.id === tagFilter ? null : t.id)}
                className={`text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  tagFilter === t.id ? "border-white/[0.16]" : "border-white/[0.06] hover:bg-white/[0.04]"
                }`}
                style={tagFilter === t.id ? { background: `${t.color}22`, color: t.color } : {}}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Layout: list (left) + detail (right on md+) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
          {/* Contacts list */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Contacts</p>
              <p className="text-[10px] text-muted-foreground">{contacts.length} shown</p>
            </div>
            {loading ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-coral animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <UserPlus className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No contacts yet. Anyone who messages the BION WhatsApp number or signs up will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-[70vh] overflow-y-auto">
                {contacts.map((c) => {
                  const isSelected = selectedPhone === c.phone;
                  return (
                    <button key={c.phone} onClick={() => openContact(c.phone)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"
                      }`}>
                      <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center text-xs font-semibold text-foreground shrink-0 overflow-hidden">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (c.full_name ?? c.phone).slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-medium text-foreground truncate">{c.full_name ?? fmtPhone(c.phone)}</p>
                          {c.tags.slice(0, 3).map((t) => (
                            <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded-full border"
                              style={{ background: `${t.color}22`, color: t.color, borderColor: `${t.color}44` }}>
                              {t.name}
                            </span>
                          ))}
                          {c.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{c.tags.length - 3}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.full_name ? fmtPhone(c.phone) : ""} · {c.msgs_total} msg{c.msgs_total === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground tabular-nums">{relTime(c.last_message_at)}</p>
                        <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Detail panel */}
          <GlassCard className="p-0 overflow-hidden lg:sticky lg:top-4 self-start max-h-[80vh] overflow-y-auto">
            {!selectedPhone ? (
              <div className="p-10 text-center space-y-2">
                <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">Pick a contact on the left to see profile, tags, notes, and conversation history.</p>
              </div>
            ) : detailLoading || !detail ? (
              <div className="p-10 flex items-center justify-center"><Loader2 className="w-5 h-5 text-coral animate-spin" /></div>
            ) : (
              <div>
                {/* Header */}
                <div className="px-4 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/[0.04] flex items-center justify-center text-sm font-semibold text-foreground overflow-hidden">
                      {detail.profile?.avatar_url ? (
                        <img src={detail.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (detail.profile?.full_name ?? detail.phone).slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {detail.profile?.full_name ?? "(no name)"}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {fmtPhone(detail.phone)}
                      </p>
                      {detail.profile?.email && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {detail.profile.email}
                        </p>
                      )}
                    </div>
                    <button onClick={() => { setSelectedPhone(null); setDetail(null); }}
                      className="p-1.5 rounded-full hover:bg-white/[0.06] text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {detail.profile && (
                    <button onClick={() => navigate(`/admin/whatsapp?phone=${encodeURIComponent(detail.phone)}`)}
                      className="text-[10px] text-coral mt-2 hover:underline">
                      Open full conversation →
                    </button>
                  )}
                </div>

                {/* Tags */}
                <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <TagIcon className="w-3 h-3" /> Tags
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {detail.tags.length === 0 && <p className="text-[11px] text-muted-foreground">No tags yet.</p>}
                    {detail.tags.map((t) => (
                      <span key={t.id} className="text-[10px] pl-2 pr-1 py-0.5 rounded-full border flex items-center gap-1"
                        style={{ background: `${t.color}22`, color: t.color, borderColor: `${t.color}44` }}>
                        {t.name}
                        <button onClick={() => removeTag(t.tag_id)} className="hover:bg-white/[0.08] rounded-full p-0.5">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {availableTagsForContact.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {availableTagsForContact.map((t) => (
                        <button key={t.id} onClick={() => addTag(t.id)}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-white/[0.16] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5" /> {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <StickyNote className="w-3 h-3" /> Notes
                  </p>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {detail.notes.length === 0 && <p className="text-[11px] text-muted-foreground">No notes.</p>}
                    {detail.notes.map((n) => (
                      <div key={n.id} className="p-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <p className="text-[11px] text-foreground whitespace-pre-wrap">{n.body}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("en-ZA")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-1">
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a private note…" rows={2}
                      className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40 resize-none" />
                    <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                      className="px-3 py-1.5 rounded-pill text-[10px] font-semibold bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25 disabled:opacity-50">
                      {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>

                {/* Bookings */}
                {detail.bookings.length > 0 && (
                  <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recent bookings</p>
                    {detail.bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="text-[11px] text-foreground">
                        <span className="tabular-nums">{b.booking_date}</span>
                        {b.booking_time && <span className="text-muted-foreground"> · {b.booking_time}</span>}
                        {b.services?.title && <span className="text-muted-foreground"> · {b.services.title}</span>}
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground">{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent messages */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Recent messages
                  </p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {detail.messages.length === 0 && <p className="text-[11px] text-muted-foreground">No messages.</p>}
                    {detail.messages.slice(0, 20).map((m) => (
                      <div key={m.id} className={`p-2 rounded-xl text-[11px] ${
                        m.direction === "in"
                          ? "bg-white/[0.04] text-foreground mr-6"
                          : "bg-coral/15 text-foreground ml-6"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{relTime(m.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </>
  );
}
