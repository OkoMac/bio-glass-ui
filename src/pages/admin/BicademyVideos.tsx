/**
 * /admin/bicademy-videos — Bicademy video tutorial draft queue.
 *
 * The recorder/composer pipeline (Slices 2-4) drops finished mp4s onto
 * Cloudflare Stream and inserts a `lessons` row with video_status='draft'.
 * This page lists those drafts so a human can:
 *   1. Watch the rendered video inline
 *   2. Promote it to `published` (becomes live in BicademyLesson + HelpVideo)
 *   3. Send it back to `archived` if the take was bad
 *
 * No drafts → empty state; pipeline isn't producing yet.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import BicademyVideoPlayer from "@/components/BicademyVideoPlayer";
import { authFetch } from "@/lib/authFetch";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, Archive } from "lucide-react";

interface Draft {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  video_url: string;
  video_id: string | null;
  video_thumbnail_url: string | null;
  video_duration_seconds: number | null;
  video_uploaded_at: string | null;
  video_status: "draft" | "published" | "archived";
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export default function AdminBicademyVideos() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/bicademy/admin/video-drafts");
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");
      setDrafts(j.data as Draft[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "published" | "archived") => {
    setActing((s) => ({ ...s, [id]: true }));
    try {
      const res = await authFetch(`/api/bicademy/admin/lessons/${id}/video-status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed");
      toast.success(status === "published" ? "Published" : "Archived");
      setDrafts((d) => d.filter((row) => row.id !== id));
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setActing((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AdminNav />
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 space-y-6">
        <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Admin
        </button>
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Bicademy video drafts</h1>
          <p className="text-sm text-muted-foreground">
            Review videos produced by the recorder pipeline. Publish to make them live in BicademyLesson and in-tool HelpVideo buttons.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            No draft videos yet. The recorder pipeline will drop them here once Slices 2-4 are wired up.
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {drafts.map((d) => (
              <GlassCard key={d.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Lesson {d.lesson_number}</p>
                    <h3 className="text-base font-semibold text-foreground truncate">{d.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Uploaded {fmtDate(d.video_uploaded_at)}</p>
                  </div>
                </div>
                <BicademyVideoPlayer
                  videoUrl={d.video_url}
                  videoId={d.video_id}
                  thumbnailUrl={d.video_thumbnail_url}
                  durationSeconds={d.video_duration_seconds}
                  title={d.title}
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setStatus(d.id, "published")}
                    disabled={acting[d.id]}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo to-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {acting[d.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Publish
                  </button>
                  <button
                    onClick={() => setStatus(d.id, "archived")}
                    disabled={acting[d.id]}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
