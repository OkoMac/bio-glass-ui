import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useStorefront } from "@/hooks/useStorefront";
import { useMyProducts, Product } from "@/hooks/useProducts";
import { useSubscription } from "@/hooks/useSubscription";
import ImageUpload from "@/components/ImageUpload";
import {
  Store, Package, Plus, X, Loader2, Check, AlertTriangle, Eye, EyeOff,
  TrendingUp, ShoppingBag, MapPin, Settings as SettingsIcon, Edit3, Trash2, ArrowLeft,
} from "lucide-react";

export default function ProviderStorefront() {
  const navigate = useNavigate();
  const sf = useStorefront();
  const { products, loading: productsLoading, createProduct, deleteProduct } = useMyProducts();
  const { subscription } = useSubscription();
  const canStorefront = subscription?.tier === "pro" || subscription?.tier === "elite";

  const [setupOpen, setSetupOpen] = useState(false);
  const [productModal, setProductModal] = useState(false);

  // Setup form state
  const [storeName, setStoreName] = useState(sf.storefront?.storefront_name ?? "");
  const [storeDesc, setStoreDesc] = useState(sf.storefront?.storefront_description ?? "");
  const [pickupAddress, setPickupAddress] = useState(sf.storefront?.pickup_address ?? "");
  const [shippingPolicy, setShippingPolicy] = useState(sf.storefront?.shipping_policy ?? "");
  const [returnPolicy, setReturnPolicy] = useState(sf.storefront?.return_policy ?? "");

  // Product form state
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("10");
  const [pWeight, setPWeight] = useState("500");
  const [pSize, setPSize] = useState("20");
  const [pCategory, setPCategory] = useState("supplements");
  const [pPhotoUrl, setPPhotoUrl] = useState("");
  const [pDigital, setPDigital] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleEnable = async () => {
    setSubmitting(true);
    await sf.enableStorefront({
      storefront_name: storeName.trim(),
      storefront_description: storeDesc.trim(),
      pickup_address: pickupAddress.trim(),
      shipping_policy: shippingPolicy.trim(),
      return_policy: returnPolicy.trim(),
    });
    setSubmitting(false);
    setSetupOpen(false);
  };

  const handleCreateProduct = async () => {
    if (!pTitle.trim() || !pPrice.trim()) return;
    setSubmitting(true);
    const result = await createProduct({
      title: pTitle.trim(),
      description: pDesc.trim() || undefined,
      category: pCategory,
      price_rand: parseFloat(pPrice),
      weight_grams: parseInt(pWeight, 10) || 500,
      largest_side_cm: parseInt(pSize, 10) || 20,
      stock_qty: parseInt(pStock, 10) || 10,
      photos: pPhotoUrl ? [pPhotoUrl] : [],
      digital: pDigital,
    });
    setSubmitting(false);
    if (result.ok) {
      setPTitle(""); setPDesc(""); setPPrice(""); setPStock("10");
      setPWeight("500"); setPSize("20"); setPPhotoUrl(""); setPDigital(false);
      setProductModal(false);
    }
  };

  // ── Storefront not enabled ──
  if (!sf.loading && !sf.storefront?.enabled) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 pb-32 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
        <div className="mx-auto max-w-3xl px-4 md:px-8 pt-20 md:pt-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-amber" /> Storefront
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Sell physical or digital products to your clients</p>
          </div>

          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-amber" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Open your storefront</h2>
            <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
              Sell supplements, equipment, branded merchandise — anything that complements your services.
            </p>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
              Available to <strong className="text-foreground">Pro</strong> and <strong className="text-foreground">Elite</strong> providers only.
            </p>

            <button
              onClick={() => canStorefront ? setSetupOpen(true) : navigate("/pro/billing?upgrade=pro")}
              className="rounded-pill px-6 py-3 gradient-indigo text-white text-sm font-semibold inline-flex items-center gap-2"
             title="canStorefront ? setSetupOpen(true) : navigate('/pro/billing?upgrade=pro')} cl…" aria-label="canStorefront ? setSetupOpen(true) : navigate('/pro/billing?upgrade=pro')} cl…">
              <Plus className="w-4 h-4" /> {canStorefront ? "Set up storefront" : "Upgrade to Pro to enable"}
            </button>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">How it works</p>
            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo/20 text-indigo flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Add products with photos, descriptions, and pricing</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo/20 text-indigo flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>B_ AI reviews each product within minutes for compliance</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo/20 text-indigo flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Approved products appear on your public profile and BION search</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo/20 text-indigo flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span>Customers buy with delivery (Pickup, Pudo, Pargo, Local, Provincial, National)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo/20 text-indigo flex items-center justify-center text-xs font-bold shrink-0">5</span>
                <span>You ship the order; payout lands in your wallet automatically</span>
              </li>
            </ol>
          </GlassCard>
        </div>

        {/* Setup modal */}
        <SetupModal
          open={setupOpen}
          onClose={() => setSetupOpen(false)}
          {...{ storeName, setStoreName, storeDesc, setStoreDesc, pickupAddress, setPickupAddress, shippingPolicy, setShippingPolicy, returnPolicy, setReturnPolicy }}
          onSubmit={handleEnable}
          submitting={submitting}
        />

        <ProviderNav />
        <BionAssistant />
      </div>
    );
  }

  // ── Storefront active ──
  const draftProducts = products.filter(p => p.status === "draft");
  const pendingProducts = products.filter(p => p.b_review_status === "pending" || p.status === "pending_b_review");
  const publishedProducts = products.filter(p => p.status === "published");
  const flaggedProducts = products.filter(p => p.status === "b_flagged" || p.status === "admin_rejected");

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 pb-32 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-5xl px-4 md:px-8 pt-20 md:pt-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-amber" /> {sf.storefront?.storefront_name ?? "My Storefront"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setSetupOpen(true)} className="text-xs text-indigo font-medium flex items-center gap-1" title="setSetupOpen(true)} className='text-xs text-indigo font-medium flex items-cen…" aria-label="setSetupOpen(true)} className='text-xs text-indigo font-medium flex items-cen…">
            <SettingsIcon className="w-3.5 h-3.5" /> Settings
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <ShoppingBag className="w-4 h-4 text-teal mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-data">{sf.storefront?.total_sales_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sales</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <TrendingUp className="w-4 h-4 text-indigo mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-data">R{(sf.storefront?.total_revenue_rand ?? 0).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Package className="w-4 h-4 text-amber mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground font-data">{publishedProducts.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</p>
          </GlassCard>
        </div>

        {/* Add product CTA */}
        <button
          onClick={() => setProductModal(true)}
          className="w-full rounded-2xl border-2 border-dashed border-white/[0.12] py-4 text-sm font-medium text-muted-foreground hover:border-white/[0.24] hover:text-foreground transition-colors flex items-center justify-center gap-2"
         title="setProductModal(true)} className='w-full rounded-2xl border-2 border-dashed b…" aria-label="setProductModal(true)} className='w-full rounded-2xl border-2 border-dashed b…">
          <Plus className="w-4 h-4" /> Add a product
        </button>

        {/* Pending review */}
        {pendingProducts.length > 0 && (
          <section>
            <p className="text-xs text-amber uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Pending B_ review ({pendingProducts.length})
            </p>
            <div className="space-y-2">
              {pendingProducts.map(p => (
                <ProductRow key={p.id} product={p} onDelete={deleteProduct} />
              ))}
            </div>
          </section>
        )}

        {/* Flagged */}
        {flaggedProducts.length > 0 && (
          <section>
            <p className="text-xs text-coral uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Needs attention ({flaggedProducts.length})
            </p>
            <div className="space-y-2">
              {flaggedProducts.map(p => (
                <ProductRow key={p.id} product={p} onDelete={deleteProduct} flagged />
              ))}
            </div>
          </section>
        )}

        {/* Published */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Published ({publishedProducts.length})
          </p>
          {publishedProducts.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No published products yet</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {publishedProducts.map(p => (
                <ProductRow key={p.id} product={p} onDelete={deleteProduct} published />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <SetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        {...{ storeName, setStoreName, storeDesc, setStoreDesc, pickupAddress, setPickupAddress, shippingPolicy, setShippingPolicy, returnPolicy, setReturnPolicy }}
        onSubmit={handleEnable}
        submitting={submitting}
      />

      <AnimatePresence>
        {productModal && (
          <ProductModal
            onClose={() => setProductModal(false)}
            {...{ pTitle, setPTitle, pDesc, setPDesc, pPrice, setPPrice, pStock, setPStock, pWeight, setPWeight, pSize, setPSize, pCategory, setPCategory, pPhotoUrl, setPPhotoUrl, pDigital, setPDigital }}
            onSubmit={handleCreateProduct}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      <ProviderNav />
      <BionAssistant />
    </div>
  );
}

// ─── Product Row ──────────────────────────────────────────────────
function ProductRow({ product, onDelete, published, flagged }: {
  product: Product; onDelete: (id: string) => void; published?: boolean; flagged?: boolean;
}) {
  return (
    <GlassCard className={`p-3 flex items-center gap-3 ${flagged ? "border border-coral/30" : ""}`}>
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] shrink-0 overflow-hidden">
        {product.photos?.[0]
          ? <img src={product.photos[0]} alt="" className="w-full h-full object-cover" />
          : <Package className="w-5 h-5 text-muted-foreground m-auto mt-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{product.title}</p>
        <p className="text-[11px] text-muted-foreground">
          R{product.price_rand.toFixed(0)} · {product.stock_remaining}/{product.stock_qty} stock
          {published && product.total_sold > 0 && ` · ${product.total_sold} sold`}
        </p>
        {flagged && product.b_review_notes && (
          <p className="text-[10px] text-coral mt-1">{product.b_review_notes}</p>
        )}
      </div>
      <button onClick={() => onDelete(product.id)} className="p-2 text-muted-foreground hover:text-coral" title="onDelete(product.id)} className='p-2 text-muted-foreground hover:text-coral'>" aria-label="onDelete(product.id)} className='p-2 text-muted-foreground hover:text-coral'>">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </GlassCard>
  );
}

// ─── Setup Modal ──────────────────────────────────────────────────
function SetupModal(props: any) {
  if (!props.open) return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={props.onClose}
        className="fixed inset-0 bg-obsidian/70 z-[80]" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
        style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Storefront settings</h3>
          <button onClick={props.onClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <Field label="Store name" value={props.storeName} onChange={props.setStoreName} placeholder="e.g. My Wellness Shop" />
        <Field label="Description" value={props.storeDesc} onChange={props.setStoreDesc} placeholder="What you sell and why clients should buy from you" textarea />
        <Field label="Pickup address" value={props.pickupAddress} onChange={props.setPickupAddress} placeholder="Where customers can collect orders" icon={<MapPin className="w-3 h-3" />} />
        <Field label="Shipping policy" value={props.shippingPolicy} onChange={props.setShippingPolicy} placeholder="e.g. Orders ship within 24 hours" textarea />
        <Field label="Return policy" value={props.returnPolicy} onChange={props.setReturnPolicy} placeholder="e.g. 14-day returns on unopened products" textarea />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={props.onSubmit}
          disabled={props.submitting || !props.storeName}
          className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50"
        >
          {props.submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save & enable"}
        </motion.button>
      </motion.div>
    </>
  );
}

// ─── Product Modal ────────────────────────────────────────────────
function ProductModal(props: any) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={props.onClose}
        className="fixed inset-0 bg-obsidian/70 z-[80]" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
        style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Add product</h3>
          <button onClick={props.onClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground glass-1 rounded-2xl p-3">
          B_ AI will review your product within minutes. Once approved, it appears on your storefront.
        </p>

        <Field label="Title" value={props.pTitle} onChange={props.setPTitle} placeholder="e.g. Vitamin D3 Drops 30ml" />
        <Field label="Description" value={props.pDesc} onChange={props.setPDesc} placeholder="What it is, who it's for, dosage" textarea />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (R)" value={props.pPrice} onChange={props.setPPrice} type="number" placeholder="0.00" />
          <Field label="Stock units" value={props.pStock} onChange={props.setPStock} type="number" placeholder="10" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={props.pCategory}
            onChange={e => props.setPCategory(e.target.value)}
            className="px-3 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
          >
            <option value="supplements">Supplements</option>
            <option value="equipment">Equipment</option>
            <option value="apparel">Apparel</option>
            <option value="merchandise">Merchandise</option>
            <option value="digital">Digital (e-book, course)</option>
            <option value="other">Other</option>
          </select>
          <Field label="" value={props.pWeight} onChange={props.setPWeight} type="number" placeholder="Weight (g)" small />
          <Field label="" value={props.pSize} onChange={props.setPSize} type="number" placeholder="Size (cm)" small />
        </div>

        <ImageUpload
          label="Product photo"
          folder="products"
          value={props.pPhotoUrl || null}
          onChange={(url) => props.setPPhotoUrl(url ?? "")}
        />

        <label className="flex items-center gap-2 text-xs text-foreground">
          <input type="checkbox" checked={props.pDigital} onChange={e => props.setPDigital(e.target.checked)} />
          Digital product (no shipping)
        </label>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={props.onSubmit}
          disabled={props.submitting || !props.pTitle.trim() || !props.pPrice.trim()}
          className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50"
        >
          {props.submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit for B_ review"}
        </motion.button>
      </motion.div>
    </>
  );
}

// ─── Field helper ─────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", textarea, icon, small }: any) {
  return (
    <div>
      {label && (
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
          {icon} {label}
        </p>
      )}
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${small ? "px-2 py-2 text-xs" : "px-3 py-2.5 text-sm"} glass-1 rounded-xl text-foreground outline-none border border-white/[0.08]`}
        />
      )}
    </div>
  );
}
