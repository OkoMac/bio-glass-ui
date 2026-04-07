import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, CheckCircle, Loader2 } from "lucide-react";
import GlassCard from "./GlassCard";

interface ReviewFormProps {
  bookingId: string;
  providerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function ReviewForm({
  bookingId,
  providerName,
  onClose,
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("supabase_token") ?? "";
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit review");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
      }, 1500);
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-md mx-4 sm:mx-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <GlassCard variant="glass-1" className="p-6 rounded-t-3xl sm:rounded-3xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full text-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {submitted ? (
              /* Success state */
              <motion.div
                className="flex flex-col items-center py-8 gap-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <CheckCircle size={56} className="text-teal-500" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground">
                  Review Submitted!
                </h3>
                <p className="text-sm text-muted text-center">
                  Thank you for reviewing {providerName}.
                </p>
              </motion.div>
            ) : (
              /* Review form */
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Rate your experience
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    How was your session with{" "}
                    <span className="font-medium text-foreground">
                      {providerName}
                    </span>
                    ?
                  </p>
                </div>

                {/* Star rating */}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled =
                        star <= (hoveredStar || rating);
                      return (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => {
                            setRating(star);
                            setError(null);
                          }}
                          className="focus:outline-none"
                        >
                          <Star
                            size={36}
                            className={
                              filled
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300"
                            }
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                  {(hoveredStar || rating) > 0 && (
                    <motion.span
                      className="text-sm font-medium text-indigo-900"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {ratingLabels[hoveredStar || rating]}
                    </motion.span>
                  )}
                </div>

                {/* Comment textarea */}
                <div className="mb-6">
                  <textarea
                    placeholder="Share your experience (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
                  />
                  <p className="text-xs text-muted mt-1 text-right">
                    {comment.length}/2000
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    className="text-sm text-red-500 text-center mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-900 to-teal-600 text-white font-semibold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </motion.button>
              </>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
