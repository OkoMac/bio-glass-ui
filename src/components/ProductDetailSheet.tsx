import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Product, getDeliveryQuote, DeliveryQuote } from "@/hooks/useProducts";
import {
  X, ShoppingBag, MapPin, Package, Truck, Home, Loader2, Check, AlertCircle, Info,
} from "lucide-react";

interface Props {
  product: Product | null;
  providerId: string;
  storefrontName: string;
  onClose: () => void;
}

type DeliveryZone = "pickup" | "pudo" | "pargo" | "local" | "provincial" | "national";

const ZONE_META: Record<DeliveryZone, { label: string; icon: typeof Home; desc: string }> = {
  pickup:     { label: "Pickup at provider",  icon: Home,    desc: "Collect yourself, no fee" },
  pudo:       { label: "Pudo locker",         icon: Package, desc: "1-3 days, collect at locker" },
  pargo:      { label: "Pargo pickup point",  icon: MapPin,  desc: "2-4 days, collect at point" },
  local:      { label: "Local courier",       icon: Truck,   desc: "Under 25km, 1-3 days" },
  provincial: { label: "Provincial",          icon: Truck,   desc: "Gauteng-wide, 1-3 days" },
  national:   { label: "National",            icon: Truck,   desc: "Anywhere in SA, 2-5 days" },
};

export default function ProductDetailSheet({ product, providerId, storefrontName, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>("pickup");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [address, setAddress] = useState({ street: "", suburb: "", city: "", postal_code: "" });
  const [step, setStep] = useState<"detail" | "address" | "review" | "processing" | "success">("detail");
  const [error, setError] = useState("");

  // Reset on close
  useEffect(() => {
    if (!product) {
      setStep("detail");
      setQuantity(1);
      setSelectedZone("pickup");
      setError("");
    }
  }, [product]);

  // Fetch delivery quote when zone or quantity changes
  useEffect(() => {
    if (!product || selectedZone === "pickup") {
      setDeliveryQuote(null);
      return;
    }
    setLoadingQuote(true);
    const totalWeight = (product.weight_grams ?? 500) * quantity;
    getDeliveryQuote(selectedZone, totalWeight, product.largest_side_cm ?? 20).then(q => {
      setDeliveryQuote(q);
      setLoadingQuote(false);
    });
  }, [product, selectedZone, quantity]);

  if (!product) return null;

  const subtotal = product.price_rand * quantity;
  const clientFee = Math.round(subtotal * 0.05 * 100) / 100;
  const providerFee = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryCost = deliveryQuote?.client_pays ?? 0;
  const totalCharged = subtotal + clientFee + deliveryCost;
  const providerPayout = subtotal - providerFee;
  const bionRevenue = clientFee + providerFee + (deliveryQuote?.bion_markup ?? 0);

  const needsAddress = selectedZone !== "pickup" && selectedZone !== "pudo" && selectedZone !== "pargo";

  const handleContinue = () => {
    if (step === "detail") {
      if (needsAddress) setStep("address");
      else setStep("review");
    } else if (step === "address") {
      if (!address.street || !address.city || !address.postal_code) {
        setError("Please fill in all address fields");
        return;
      }
      setError("");
      setStep("review");
    }
  };

  const handleCheckout = async () => {
    if (!user?.profileId) {
      navigate("/welcome");
      return;
    }
    if (product.stock_remaining < quantity) {
      setError("Not enough stock available");
      return;
    }

    setStep("processing");
    setError("");

    try {
      // Create order
      const { data: order, error: orderError } = await supabase.from("product_orders").insert({
        buyer_id: user.profileId,
        provider_id: providerId,
        status: "pending",
        delivery_zone: selectedZone,
        delivery_address: needsAddress ? address : null,
        pickup_at_provider: selectedZone === "pickup",
        subtotal_rand: subtotal,
        client_fee_rand: clientFee,
        provider_fee_rand: providerFee,
        delivery_cost_rand: deliveryQuote?.courier_cost ?? 0,
        delivery_charged_rand: deliveryCost,
        bion_total_revenue_rand: bionRevenue,
        total_charged_rand: totalCharged,
        provider_payout_rand: providerPayout,
      } as any).select().single();

      if (orderError || !order) {
        setError(orderError?.message ?? "Could not create order");
        setStep("review");
        return;
      }

      // Create order item
      await supabase.from("order_items").insert({
        order_id: (order as any).id,
        product_id: product.id,
        quantity,
        unit_price_rand: product.price_rand,
        line_total_rand: subtotal,
        product_title_snapshot: product.title,
        product_photo_snapshot: product.photos?.[0] ?? null,
      } as any);

      // Debit wallet (if user has balance) OR mark pending for Paystack
      // For now: assume wallet payment if sufficient balance, otherwise redirect to Paystack
      const { data: walletTxs } = await supabase.from("wallet_transactions")
        .select("amount_rand").eq("user_id", user.profileId);

      const walletBalance = (walletTxs ?? []).reduce((sum: number, t: any) => sum + Number(t.amount_rand), 0);

      if (walletBalance >= totalCharged) {
        // Wallet payment
        await supabase.from("wallet_transactions").insert({
          user_id: user.profileId,
          amount_rand: -totalCharged,
          type: "booking_payment",
          reference_id: (order as any).id,
          description: `${product.title} × ${quantity} from ${storefrontName}`,
        } as any);

        // Mark order paid
        await supabase.from("product_orders").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        } as any).eq("id", (order as any).id);

        // Decrement stock
        await supabase.from("products").update({
          stock_remaining: product.stock_remaining - quantity,
          total_sold: (product.total_sold ?? 0) + quantity,
        } as any).eq("id", product.id);

        setStep("success");
        setTimeout(() => { onClose(); navigate("/wallet"); }, 3000);
      } else {
        // Insufficient wallet balance — redirect to Paystack (future integration)
        setError(`Insufficient wallet balance (R${walletBalance.toFixed(2)}). Top up R${(totalCharged - walletBalance).toFixed(2)} first.`);
        setStep("review");
      }
    } catch (err: any) {
      setError(err.message ?? "Checkout failed");
      setStep("review");
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={step === "processing" ? undefined : onClose}
        className="fixed inset-0 bg-obsidian/70 z-[80]" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl max-h-[95vh] overflow-y-auto"
        style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-3"
          style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)" }}>
          <h3 className="text-base font-bold text-foreground">
            {step === "detail" && "Product"}
            {step === "address" && "Delivery address"}
            {step === "review" && "Review order"}
            {step === "processing" && "Processing..."}
            {step === "success" && "Order confirmed!"}
          </h3>
          <button onClick={onClose} disabled={step === "processing"}
            className="w-8 h-8 glass-1 rounded-full flex items-center justify-center disabled:opacity-30" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step === "success" ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-teal" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Order placed!</h4>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedZone === "pickup"
                  ? "Provider will prepare your order for pickup"
                  : `Shipping via ${ZONE_META[selectedZone].label}`}
              </p>
              <p className="text-xs text-muted-foreground mt-3">Redirecting to wallet...</p>
            </div>
          ) : step === "processing" ? (
            <div className="py-16 text-center">
              <Loader2 className="w-10 h-10 text-indigo mx-auto animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Creating your order</p>
            </div>
          ) : step === "address" ? (
            <>
              <p className="text-xs text-muted-foreground">Where should we deliver this order?</p>
              <input value={address.street}
                onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                placeholder="Street address"
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]" />
              <input value={address.suburb}
                onChange={e => setAddress(a => ({ ...a, suburb: e.target.value }))}
                placeholder="Suburb"
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]" />
              <div className="grid grid-cols-2 gap-3">
                <input value={address.city}
                  onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                  placeholder="City"
                  className="px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]" />
                <input value={address.postal_code}
                  onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value }))}
                  placeholder="Postal code"
                  className="px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]" />
              </div>
              {error && <p className="text-xs text-coral">{error}</p>}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
                className="w-full rounded-pill py-3.5 gradient-indigo text-white font-semibold">
                Continue
              </motion.button>
            </>
          ) : step === "review" ? (
            <>
              <div className="glass-1 rounded-2xl p-4 flex items-center gap-3">
                {product.photos?.[0] && (
                  <img src={product.photos[0]} alt={product.title} className="w-14 h-14 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{product.title}</p>
                  <p className="text-[11px] text-muted-foreground">R{product.price_rand.toFixed(0)} × {quantity}</p>
                </div>
                <p className="text-sm font-bold font-data text-foreground">R{subtotal.toFixed(2)}</p>
              </div>

              <div className="glass-1 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Delivery method</p>
                <div className="flex items-center gap-2">
                  {(() => { const Icon = ZONE_META[selectedZone].icon; return <Icon className="w-4 h-4 text-indigo" />; })()}
                  <p className="text-sm text-foreground">{ZONE_META[selectedZone].label}</p>
                </div>
                {needsAddress && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {address.street}, {address.city}, {address.postal_code}
                  </p>
                )}
              </div>

              {/* Full breakdown */}
              <div className="glass-1 rounded-2xl p-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-data">R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">BION service fee (5%)</span>
                  <span className="text-muted-foreground font-data">R{clientFee.toFixed(2)}</span>
                </div>
                {deliveryCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delivery ({ZONE_META[selectedZone].label})</span>
                    <span className="text-muted-foreground font-data">R{deliveryCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-foreground font-bold font-data">R{totalCharged.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-xs text-coral glass-1 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}
              </p>}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCheckout}
                className="w-full rounded-pill py-3.5 gradient-indigo text-white font-semibold">
                Pay R{totalCharged.toFixed(2)} with wallet
              </motion.button>
            </>
          ) : (
            // step === "detail"
            <>
              {product.photos?.[0] && (
                <img src={product.photos[0]} alt={product.title}
                  className="w-full aspect-video rounded-2xl object-cover" />
              )}

              <div>
                <h4 className="text-lg font-bold text-foreground">{product.title}</h4>
                <p className="text-sm text-muted-foreground">by {storefrontName}</p>
                <p className="text-2xl font-bold font-data text-foreground mt-2">R{product.price_rand.toFixed(0)}</p>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">Quantity</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" title="setQuantity(q => Math.max(1, q - 1))} className='w-8 h-8 glass-1 rounded-full…" aria-label="setQuantity(q => Math.max(1, q - 1))} className='w-8 h-8 glass-1 rounded-full…">−</button>
                  <span className="w-10 text-center text-sm font-data text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock_remaining, q + 1))}
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" title="setQuantity(q => Math.min(product.stock_remaining, q + 1))} className='w-8 h-…" aria-label="setQuantity(q => Math.min(product.stock_remaining, q + 1))} className='w-8 h-…">+</button>
                </div>
                <p className="text-[11px] text-muted-foreground">{product.stock_remaining} in stock</p>
              </div>

              {/* Delivery zone selector */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Delivery method</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(ZONE_META) as [DeliveryZone, typeof ZONE_META[DeliveryZone]][]).map(([zone, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          selectedZone === zone
                            ? "border-indigo/40 bg-indigo/10"
                            : "border-white/[0.08] glass-1"
                        }`}
                       title="setSelectedZone(zone)} className= `} >" aria-label="setSelectedZone(zone)} className= `} >">
                        <Icon className={`w-4 h-4 mb-1 ${selectedZone === zone ? "text-indigo" : "text-muted-foreground"}`} />
                        <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                        <p className="text-[10px] text-muted-foreground">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedZone !== "pickup" && (
                <div className="glass-1 rounded-2xl p-3 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {loadingQuote ? (
                      <p className="text-xs text-muted-foreground">Calculating delivery...</p>
                    ) : deliveryQuote ? (
                      <div>
                        <p className="text-xs text-foreground">
                          <strong className="font-semibold">R{deliveryQuote.client_pays.toFixed(2)}</strong> delivery
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Delivered in {deliveryQuote.estimated_days_min}-{deliveryQuote.estimated_days_max} days
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Delivery quote unavailable</p>
                    )}
                  </div>
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
                className="w-full rounded-pill py-3.5 gradient-indigo text-white font-semibold flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Continue · R{totalCharged.toFixed(2)}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
