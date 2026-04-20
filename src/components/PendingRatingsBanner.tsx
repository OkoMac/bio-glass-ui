import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import GlassCard from "./GlassCard";
import ReviewForm from "./ReviewForm";
import { usePendingRatings, type PendingRating } from "@/hooks/useReviews";

/**
 * Shows a banner on the Home page when the user has unrated completed bookings.
 * Tapping a pending item opens the ReviewForm modal.
 */
export default function PendingRatingsBanner() {
  const { pending, loading, refresh } = usePendingRatings();
  const [activeRating, setActiveRating] = useState<PendingRating | null>(null);

  if (loading || pending.length === 0) return null;

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber fill-amber" />
          <h2 className="text-lg font-semibold text-foreground">Rate Your Sessions</h2>
          <span className="ml-auto text-xs font-data text-muted-foreground">
            {pending.length} pending
          </span>
        </div>

        <div className="space-y-2">
          {pending.slice(0, 3).map((item) => (
            <motion.div
              key={item.bookingId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard
                className="p-4 cursor-pointer hover:border-amber/20 transition-colors border border-white/[0.08]"
                onClick={() => setActiveRating(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.service}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(item.date).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                      })}
                      {item.time ? ` at ${item.time}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-3.5 h-3.5 text-amber/30"
                        />
                      ))}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {pending.length > 3 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{pending.length - 3} more to rate
            </p>
          )}
        </div>
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {activeRating && (
          <ReviewForm
            bookingId={activeRating.bookingId}
            providerName={activeRating.service}
            onClose={() => setActiveRating(null)}
            onSubmitted={() => {
              setActiveRating(null);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
