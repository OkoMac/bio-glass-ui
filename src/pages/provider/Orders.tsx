import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import ProviderDisputePanel from "@/components/provider/ProviderDisputePanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, Truck, Check, X, Loader2, ShoppingBag, MapPin, Home, Clock, AlertCircle, ArrowLeft,
} from "lucide-react";

interface Order {
  id: string;
  buyer_id: string;
  provider_id: string;
  status: string;
  delivery_zone: string;
  delivery_address: any;
  pickup_at_provider: boolean;
  subtotal_rand: number;
  provider_payout_rand: number;
  total_charged_rand: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items?: any[];
  buyer_profile?: { full_name: string; phone: string | null };
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:          { label: "Awaiting payment", color: "text-amber" },
  paid:             { label: "Paid — prepare",   color: "text-indigo" },
  preparing:        { label: "Preparing",         color: "text-indigo" },
  ready_for_pickup: { label: "Ready for pickup",  color: "text-teal" },
  shipped:          { label: "Shipped",           color: "text-teal" },
  delivered:        { label: "Delivered",         color: "text-teal" },
  cancelled:        { label: "Cancelled",         color: "text-muted-foreground" },
  disputed:         { label: "Disputed",          color: "text-coral" },
  refunded:         { label: "Refunded",          color: "text-muted-foreground" },
};

export default function ProviderOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "shipped" | "delivered">("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user?.profileId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("product_orders")
        .select("*, order_items(*), buyer_profile:profiles!product_orders_buyer_id_fkey(full_name, phone)")
        .eq("provider_id", user.profileId)
        .order("created_at", { ascending: false });

      if (data) setOrders(data as unknown as Order[]);
      setLoading(false);
    };

    fetch();

    // Realtime new orders
    const channel = supabase
      .channel(`orders-${user.profileId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "product_orders", filter: `provider_id=eq.${user.profileId}` },
        fetch
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "product_orders", filter: `provider_id=eq.${user.profileId}` },
        fetch
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.profileId]);

  const updateStatus = async (orderId: string, newStatus: string, extra?: any) => {
    setUpdating(true);
    const updates: any = { status: newStatus, ...extra };
    if (newStatus === "shipped") updates.shipped_at = new Date().toISOString();
    if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

    await supabase.from("product_orders").update(updates as any).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    setUpdating(false);
    setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, ...updates } : prev);
    setTracking("");
  };

  const activeStatuses = ["pending", "paid", "preparing", "ready_for_pickup"];
  const shippedStatuses = ["shipped"];
  const deliveredStatuses = ["delivered"];

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "active") return activeStatuses.includes(o.status);
    if (filter === "shipped") return shippedStatuses.includes(o.status);
    if (filter === "delivered") return deliveredStatuses.includes(o.status);
    return true;
  });

  // Stats
  const totalRevenue = orders
    .filter(o => ["paid", "preparing", "ready_for_pickup", "shipped", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.provider_payout_rand), 0);
  const pendingFulfillment = orders.filter(o => ["paid", "preparing"].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 pb-32 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-5xl px-4 md:px-8 pt-20 md:pt-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-teal" /> Orders
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Manage storefront sales</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total orders</p>
            <p className="text-lg font-bold text-foreground font-data mt-1">{orders.length}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue (net)</p>
            <p className="text-lg font-bold text-teal font-data mt-1">R{totalRevenue.toFixed(0)}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">To fulfil</p>
            <p className="text-lg font-bold text-amber font-data mt-1">{pendingFulfillment}</p>
          </GlassCard>
        </div>

        {/* Filter tabs */}
        <div className="glass-1 rounded-pill p-1 flex">
          {(["active", "shipped", "delivered", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-pill py-2 text-xs font-medium capitalize transition-all ${
                filter === f ? "gradient-indigo text-white" : "text-muted-foreground"
              }`}
             title="setFilter(f)} className= `} >" aria-label="setFilter(f)} className= `} >">
              {f}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <GlassCard className="p-6 text-center">
            <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
          </GlassCard>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "active" ? "No active orders to fulfil" : `No ${filter} orders`}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map(o => (
              <button key={o.id} onClick={() => setSelectedOrder(o)}
                className="w-full text-left glass-1 rounded-2xl p-4 hover:bg-white/[0.04] transition-colors" title="setSelectedOrder(o)} className='w-full text-left glass-1 rounded-2xl p-4 hove…" aria-label="setSelectedOrder(o)} className='w-full text-left glass-1 rounded-2xl p-4 hove…">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {(o.buyer_profile as any)?.full_name ?? "Customer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className={`text-xs font-semibold ${STATUS_META[o.status]?.color ?? "text-muted-foreground"}`}>
                    {STATUS_META[o.status]?.label ?? o.status}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {o.pickup_at_provider ? <Home className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                    {o.delivery_zone}
                    {o.order_items && o.order_items.length > 0 && <span>· {o.order_items.length} item{o.order_items.length > 1 ? "s" : ""}</span>}
                  </div>
                  <p className="text-sm font-bold font-data text-foreground">
                    R{Number(o.provider_payout_rand).toFixed(0)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          tracking={tracking}
          setTracking={setTracking}
          updating={updating}
          onUpdate={updateStatus}
        />
      )}

      <ProviderNav />
      <BionAssistant />
    </div>
  );
}

function OrderDetailModal({ order, onClose, tracking, setTracking, updating, onUpdate }: any) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-obsidian/70 z-[80]" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
        style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Order #{order.id.slice(0, 8)}</h3>
          <button onClick={onClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="glass-1 rounded-2xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Customer</p>
          <p className="text-sm font-semibold text-foreground">{order.buyer_profile?.full_name ?? "Unknown"}</p>
          {order.buyer_profile?.phone && (
            <p className="text-xs text-muted-foreground">{order.buyer_profile.phone}</p>
          )}
        </div>

        <div className="glass-1 rounded-2xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Items</p>
          <div className="space-y-1.5">
            {(order.order_items ?? []).map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">{item.product_title_snapshot} × {item.quantity}</span>
                <span className="text-foreground font-data">R{Number(item.line_total_rand).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {order.delivery_address && (
          <div className="glass-1 rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Delivery address
            </p>
            <p className="text-sm text-foreground">
              {order.delivery_address.street}, {order.delivery_address.suburb}, {order.delivery_address.city}, {order.delivery_address.postal_code}
            </p>
          </div>
        )}

        <div className="glass-1 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-data">R{Number(order.subtotal_rand).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="text-coral font-data">-R{Number(order.provider_fee_rand).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
            <span className="text-foreground font-medium">Your payout</span>
            <span className="text-teal font-bold font-data">R{Number(order.provider_payout_rand).toFixed(2)}</span>
          </div>
        </div>

        {/* Dispute panel (if order is disputed) */}
        {order.status === "disputed" && (
          <ProviderDisputePanel orderId={order.id} onResolved={onClose} />
        )}

        {/* Actions based on status */}
        {order.status === "paid" && (
          <button onClick={() => onUpdate(order.id, "preparing")}
            disabled={updating}
            className="w-full rounded-pill py-3 gradient-indigo text-white text-sm font-semibold" title="onUpdate(order.id, 'preparing')} disabled= className='w-full rounded-pill py-…" aria-label="onUpdate(order.id, 'preparing')} disabled= className='w-full rounded-pill py-…">
            Start preparing
          </button>
        )}

        {order.status === "preparing" && (
          <>
            {order.pickup_at_provider ? (
              <button onClick={() => onUpdate(order.id, "ready_for_pickup")}
                disabled={updating}
                className="w-full rounded-pill py-3 gradient-indigo text-white text-sm font-semibold" title="onUpdate(order.id, 'ready_for_pickup')} disabled= className='w-full rounded-p…" aria-label="onUpdate(order.id, 'ready_for_pickup')} disabled= className='w-full rounded-p…">
                Mark ready for pickup
              </button>
            ) : (
              <div className="space-y-2">
                <input value={tracking} onChange={e => setTracking(e.target.value)}
                  placeholder="Tracking number (optional)"
                  className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]" />
                <button onClick={() => onUpdate(order.id, "shipped", { tracking_number: tracking || null })}
                  disabled={updating}
                  className="w-full rounded-pill py-3 gradient-indigo text-white text-sm font-semibold" title="onUpdate(order.id, 'shipped', )} disabled= className='w-full rounded-pill py-…" aria-label="onUpdate(order.id, 'shipped', )} disabled= className='w-full rounded-pill py-…">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Mark shipped"}
                </button>
              </div>
            )}
          </>
        )}

        {(order.status === "shipped" || order.status === "ready_for_pickup") && (
          <button onClick={() => onUpdate(order.id, "delivered")}
            disabled={updating}
            className="w-full rounded-pill py-3 gradient-indigo text-white text-sm font-semibold" title="onUpdate(order.id, 'delivered')} disabled= className='w-full rounded-pill py-…" aria-label="onUpdate(order.id, 'delivered')} disabled= className='w-full rounded-pill py-…">
            Mark delivered
          </button>
        )}

        {order.tracking_number && (
          <p className="text-xs text-muted-foreground text-center">
            Tracking: <span className="font-data text-foreground">{order.tracking_number}</span>
          </p>
        )}
      </motion.div>
    </>
  );
}
