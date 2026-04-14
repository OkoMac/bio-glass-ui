import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Catalog, CatalogTheme } from "@/hooks/useCatalogs";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
    + "-" + Math.random().toString(36).slice(2, 6);
}

/**
 * Admin view of BION-owned catalogs (owner_type='bion').
 * Used by BION to publish platform-wide brochures (provider pitch decks,
 * corporate wellness proposals, investor one-pagers, etc.).
 */
export function useBionCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("catalogs")
      .select("*")
      .eq("owner_type", "bion")
      .order("created_at", { ascending: false });
    setCatalogs((data ?? []) as Catalog[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createCatalog = useCallback(async (input: {
    title: string;
    description?: string;
    theme?: CatalogTheme;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("catalogs") as any)
      .insert({
        owner_id: null,
        owner_type: "bion",
        title: input.title,
        description: input.description ?? null,
        theme: input.theme ?? "indigo",
        short_url: slugify(input.title),
        visibility: "link_only",
        published: false,
      })
      .select().single();
    if (error) throw error;
    await refresh();
    return data as Catalog;
  }, [refresh]);

  const publishCatalog = useCallback(async (id: string, publish: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("catalogs") as any)
      .update({
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        visibility: publish ? "public" : "link_only",
      })
      .eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const deleteCatalog = useCallback(async (id: string) => {
    const { error } = await supabase.from("catalogs").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  return { catalogs, loading, createCatalog, publishCatalog, deleteCatalog, refresh };
}
