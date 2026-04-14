import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronRight, X, Truck, MapPin, AlertCircle } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useMyOrders, ORDER_STATUS_META, type OrderRow } from "@/hooks/useMyOrders";
import DisputeForm from "@/components/wallet/DisputeForm";

export default function MyOrdersSection() {
  const { orders, loading } = useMyOrders();
  const [selected, setSelected] = useState<OrderRow | null>(null);

  if (loading) return null;
  if (orders.length === 0) return null;

  const active = orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status));
  const visible = active.length > 0 ? active : orders.slice(0, 3);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">My orders</p>
          <span className="text-xs text-muted-foreground">{orders.length} total</span>
        </div>

        <div className="space-y-2">
          {visible.slice(0, 5).map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            const firstItem = o.items[0];
            const remaining = o.items.length - 1;
            const isDispute = o.status === "disputed";
            return (
              <GlassCard key={o.id} hover className="p-3 cursor-pointer" onClick={() => setSelected(o)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                    {firstItem?.product_photo_snapshot ? (
                      <img src={firstItem.product_photo_snapshot} alt={firstItem.product_title_snapshot}
                        className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {firstItem?.product_title_snapshot ?? "Order"}
                      {remaining > 0 && <span className="text-muted-foreground"> +{remaining}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      from {o.provider_name ?? "—"} · {new Date(o.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isDispute && <AlertCircle className="w-3 h-3 text-coral" />}
                      <p className={`text-[11px] font-medium ${meta.tone}`}>{meta.label}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-data text-foreground">R{Number(o.total_charged_rand).toFixed(2)}</p>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline mt-1" />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}

function OrderDetailSheet({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const meta = ORDER_STATUS_META[order.status];
  const [disputing, setDisputing] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Order</p>
            <p className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</p>
            <p className={`text-sm font-semibold mt-1 ${meta.tone}`}>{meta.label}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          From <span className="text-foreground font-medium">{order.provider_name ?? "—"}</span>
          {" · "}
          {new Date(order.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02]">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                {it.product_photo_snapshot ? (
                  <img src={it.product_photo_snapshot} alt={it.product_title_snapshot} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{it.product_title_snapshot}</p>
                <p className="text-[10px] text-muted-foreground">
                  R{Number(it.unit_price_rand).toFixed(2)} × {it.quantity}
                </p>
              </div>
              <p className="text-xs font-semibold font-data">R{Number(it.line_total_rand).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Delivery */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {order.pickup_at_provider ? <MapPin className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            <span className="capitalize">{order.delivery_zone.replace(/_/g, " ")}</span>
          </div>
          {order.tracking_number && (
            <p className="text-xs">
              Tracking: <span className="font-mono font-medium text-foreground">{order.tracking_number}</span>
            </p>
          )}
        </div>

        {/* Fee breakdown */}
        <div className="space-y-1 text-xs">
          <Row label="Subtotal" value={order.subtotal_rand} />
          <Row label="Delivery" value={order.delivery_cost_rand} />
          <Row label="Service fee" value={order.client_fee_rand} muted />
          <div className="border-t border-white/5 pt-1 mt-1">
            <Row label="Paid" value={order.total_charged_rand} bold />
          </div>
        </div>

        {!["cancelled", "refunded", "pending"].includes(order.status) && (
          <button
            onClick={() => setDisputing(true)}
            className="w-full py-2.5 rounded-xl bg-coral/10 text-coral hover:bg-coral/20 text-xs font-semibold transition-colors"
          >
            {order.status === "disputed" ? "View dispute" : "Report a problem"}
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {disputing && <DisputeForm orderId={order.id} onClose={() => setDisputing(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: number; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={`font-data ${bold ? "font-bold text-foreground text-sm" : muted ? "text-muted-foreground" : "text-foreground"}`}>
        R{Number(value).toFixed(2)}
      </span>
    </div>
  );
}
