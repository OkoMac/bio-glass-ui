import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Video, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export default function VideoCall() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  useEffect(() => {
    if (!bookingId || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError("Not signed in"); setLoading(false); return; }

        // First try to get existing room
        const getRes = await fetch(`${API}/api/telehealth/room/${bookingId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const getData = await getRes.json();

        if (cancelled) return;

        if (getData.ok && getData.data?.url) {
          setRoomUrl(getData.data.url);
          setBookingInfo(getData.data);
        } else {
          // Create room if none exists
          const createRes = await fetch(`${API}/api/telehealth/room`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ bookingId }),
          });
          const createData = await createRes.json();
          if (cancelled) return;
          if (createData.ok) {
            setRoomUrl(createData.data.url);
          } else {
            setError(createData.error ?? "Could not create video room");
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load video call");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [bookingId, user]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='shrink-0 w-9 h-9 glass-2 rounded-full flex items-cen…" aria-label="navigate(-1)} className='shrink-0 w-9 h-9 glass-2 rounded-full flex items-cen…">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Video Consultation</h1>
        </div>

        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-indigo animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Setting up your video call...</p>
          </GlassCard>
        ) : error ? (
          <GlassCard className="p-8 text-center">
            <p className="text-coral text-sm mb-3">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 glass-1 rounded-pill text-sm text-foreground" title="navigate(-1)} className='px-4 py-2 glass-1 rounded-pill text-sm text-foregrou…" aria-label="navigate(-1)} className='px-4 py-2 glass-1 rounded-pill text-sm text-foregrou…">
              Go Back
            </button>
          </GlassCard>
        ) : roomUrl ? (
          <div className="space-y-4">
            {/* Jitsi iframe embed */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: "16/9" }}>
              <iframe
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ width: "100%", height: "100%", border: "none" }}
                title="BION Video Consultation"
              />
            </div>

            <div className="flex gap-3">
              <a
                href={roomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 glass-1 rounded-pill text-sm font-medium text-indigo"
              >
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </a>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 glass-1 rounded-pill text-sm font-medium text-foreground"
               title="navigate(-1)} className='flex-1 flex items-center justify-center gap-2 py-3 g…" aria-label="navigate(-1)} className='flex-1 flex items-center justify-center gap-2 py-3 g…">
                <ArrowLeft className="w-4 h-4" /> Back to Booking
              </button>
            </div>

            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Consultation Tips</p>
                  <p className="text-xs text-muted-foreground">
                    Ensure good lighting, stable internet, and a quiet space. Your provider will join shortly.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}
