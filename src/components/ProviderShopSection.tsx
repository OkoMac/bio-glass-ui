import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import ProductDetailSheet from "./ProductDetailSheet";
import { useStorefront } from "@/hooks/useStorefront";
import { useProviderProducts, Product } from "@/hooks/useProducts";
import { ShoppingBag, Package, Store } from "lucide-react";

interface Props {
  providerId: string;
}

export default function ProviderShopSection({ providerId }: Props) {
  const { storefront } = useStorefront(providerId);
  const { products, loading } = useProviderProducts(providerId);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Only render if provider has enabled storefront with products
  if (!storefront?.enabled || products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-amber" />
          <h2 className="text-base font-semibold text-foreground">
            {storefront.storefront_name ?? "Shop"}
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 glass-1 rounded-pill text-muted-foreground">
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {storefront.storefront_description && (
        <p className="text-xs text-muted-foreground mb-3">{storefront.storefront_description}</p>
      )}

      {loading ? (
        <GlassCard className="p-6 text-center">
          <Package className="w-6 h-6 text-muted-foreground/40 mx-auto animate-pulse" />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map(p => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedProduct(p)}
              className="glass-1 rounded-2xl overflow-hidden hover:border-white/[0.16] transition-colors border border-white/[0.06] text-left"
            >
              <div className="aspect-square bg-white/[0.03] relative overflow-hidden">
                {p.photos?.[0] ? (
                  <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                {p.stock_remaining <= 3 && p.stock_remaining > 0 && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-pill bg-coral/90 text-white font-bold">
                    Only {p.stock_remaining} left
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground line-clamp-2">{p.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold font-data text-foreground">R{p.price_rand.toFixed(0)}</p>
                  <ShoppingBag className="w-3 h-3 text-indigo" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <ProductDetailSheet
        product={selectedProduct}
        providerId={providerId}
        storefrontName={storefront.storefront_name ?? "Shop"}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
