import { useState, useEffect } from "react";
import { Play, X, Loader2 } from "lucide-react";
import BicademyVideoPlayer from "./BicademyVideoPlayer";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Props {
  /** Bicademy lesson id (preferred) OR course_code:lesson_number ("BMI:1"). */
  lessonRef: string;
  /** Optional button label override. Default: "Watch tutorial". */
  label?: string;
  /** Optional className for the trigger button. */
  className?: string;
}

interface LessonVideo {
  id: string;
  title: string;
  video_url: string;
  video_id: string | null;
  video_thumbnail_url: string | null;
  video_duration_seconds: number | null;
  video_provider: string | null;
  video_status: string | null;
}

/**
 * HelpVideo — in-app tutorial trigger. Drops a small "▶ Watch tutorial"
 * button into any utility tool (BMI calc, calorie calc, etc.). When tapped,
 * opens a fullscreen lightbox containing the Bicademy video player.
 *
 * The lesson is resolved lazily: the button just stores the ref string,
 * and the lightbox fetches the lesson metadata only when opened. So pages
 * with HelpVideo cost nothing on load.
 *
 * If the lesson has no published video, the button is hidden — that way a
 * page can pre-declare its HelpVideo for a tutorial that's still in draft,
 * and the button will simply appear once it's published.
 */
export default function HelpVideo({ lessonRef, label, className }: Props) {
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<LessonVideo | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Probe availability once on mount so we hide the button when there's
  // no published video. Cheap (one row) and gives us instant button state.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/bicademy/lessons/${encodeURIComponent(lessonRef)}/video`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j?.ok && j.data?.video_url && j.data?.video_status === "published") {
          setLesson(j.data);
          setAvailable(true);
        } else {
          setAvailable(false);
        }
      })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, [lessonRef]);

  if (available === false || available === null) return null;

  const handleOpen = () => {
    if (lesson) { setOpen(true); return; }
    setLoading(true);
    fetch(`${API}/api/bicademy/lessons/${encodeURIComponent(lessonRef)}/video`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.data) setLesson(j.data);
        setOpen(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ??
          "inline-flex items-center gap-1.5 text-xs text-indigo hover:text-indigo/80 font-medium"
        }
        aria-label={label ?? "Watch tutorial"}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        {label ?? "Watch tutorial"}
      </button>

      {open && lesson && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Tutorial: ${lesson.title}`}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{lesson.title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Close tutorial"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <BicademyVideoPlayer
              videoUrl={lesson.video_url}
              videoId={lesson.video_id}
              thumbnailUrl={lesson.video_thumbnail_url}
              durationSeconds={lesson.video_duration_seconds}
              provider={lesson.video_provider}
              title={lesson.title}
            />
          </div>
        </div>
      )}
    </>
  );
}
