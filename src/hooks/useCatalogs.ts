import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CatalogTheme = "indigo" | "teal" | "coral" | "amber" | "monochrome";
export type CatalogVisibility = "public" | "link_only" | "private";
export type PageType = "cover" | "content" | "product" | "feature" | "contact" | "cta";
export type PageLayout = "default" | "two_column" | "full_image" | "gallery" | "text_only";

export interface Catalog {
  id: string;
  owner_id: string;
  owner_type: "provider" | "bion";
  title: string;
  description: string | null;
  cover_image_url: string | null;
  theme: CatalogTheme;
  visibility: CatalogVisibility;
  short_url: string | null;
  view_count: number;
  share_count: number;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogPage {
  id: string;
  catalog_id: string;
  page_number: number;
  page_type: PageType;
  layout: PageLayout;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  gallery_images: string[];
  linked_product_id: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_color: string | null;
  created_at: string;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
    + "-" + Math.random().toString(36).slice(2, 6);
}

/** Provider-side: list + CRUD own catalogs */
export function useMyCatalogs() {
  const { user } = useAuth();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.profileId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("catalogs")
      .select("*")
      .eq("owner_id", user.profileId)
      .order("created_at", { ascending: false });
    setCatalogs((data ?? []) as Catalog[]);
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createCatalog = useCallback(async (input: { title: string; description?: string; theme?: CatalogTheme }) => {
    if (!user?.profileId) throw new Error("No profile");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("catalogs") as any)
      .insert({
        owner_id: user.profileId,
        owner_type: "provider",
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
  }, [user?.profileId, refresh]);

  const updateCatalog = useCallback(async (id: string, patch: Partial<Catalog>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("catalogs") as any)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    await refresh();
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

  return { catalogs, loading, createCatalog, updateCatalog, publishCatalog, deleteCatalog, refresh };
}

/** Load a single catalog + its pages (owner edit or public view) */
export function useCatalog(catalogId: string | null) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [loading, setLoading] = useState(!!catalogId);

  const refresh = useCallback(async () => {
    if (!catalogId) { setLoading(false); return; }
    setLoading(true);
    const [{ data: cat }, { data: pg }] = await Promise.all([
      supabase.from("catalogs").select("*").eq("id", catalogId).maybeSingle(),
      supabase.from("catalog_pages").select("*").eq("catalog_id", catalogId).order("page_number", { ascending: true }),
    ]);
    setCatalog((cat as Catalog) ?? null);
    setPages(((pg ?? []) as Array<Omit<CatalogPage, "gallery_images"> & { gallery_images: unknown }>)
      .map(p => ({ ...p, gallery_images: Array.isArray(p.gallery_images) ? (p.gallery_images as string[]) : [] })));
    setLoading(false);
  }, [catalogId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addPage = useCallback(async (input: Partial<CatalogPage> & { page_type: PageType }) => {
    if (!catalogId) throw new Error("No catalog");
    const nextNumber = (pages[pages.length - 1]?.page_number ?? 0) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("catalog_pages") as any)
      .insert({
        catalog_id: catalogId,
        page_number: nextNumber,
        layout: "default",
        ...input,
      })
      .select().single();
    if (error) throw error;
    await refresh();
    return data as CatalogPage;
  }, [catalogId, pages, refresh]);

  const updatePage = useCallback(async (pageId: string, patch: Partial<CatalogPage>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("catalog_pages") as any)
      .update(patch)
      .eq("id", pageId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const deletePage = useCallback(async (pageId: string) => {
    const { error } = await supabase.from("catalog_pages").delete().eq("id", pageId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const reorderPage = useCallback(async (pageId: string, newNumber: number) => {
    const target = pages.find(p => p.id === pageId);
    if (!target) return;
    const oldNumber = target.page_number;
    if (oldNumber === newNumber) return;

    // Shuffle intermediate pages
    const updates: Array<{ id: string; page_number: number }> = [];
    if (newNumber > oldNumber) {
      pages.filter(p => p.page_number > oldNumber && p.page_number <= newNumber)
        .forEach(p => updates.push({ id: p.id, page_number: p.page_number - 1 }));
    } else {
      pages.filter(p => p.page_number >= newNumber && p.page_number < oldNumber)
        .forEach(p => updates.push({ id: p.id, page_number: p.page_number + 1 }));
    }
    updates.push({ id: pageId, page_number: newNumber });

    // Write sequentially to avoid unique constraint conflicts
    for (const u of updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("catalog_pages") as any).update({ page_number: u.page_number }).eq("id", u.id);
    }
    await refresh();
  }, [pages, refresh]);

  return { catalog, pages, loading, addPage, updatePage, deletePage, reorderPage, refresh };
}

/** Public viewer — lookup catalog by short_url */
export function useCatalogByShortUrl(shortUrl: string | null) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(!!shortUrl);

  useEffect(() => {
    if (!shortUrl) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data: cat } = await supabase
        .from("catalogs")
        .select("*")
        .eq("short_url", shortUrl)
        .eq("published", true)
        .maybeSingle();
      if (!cat) { setNotFound(true); setLoading(false); return; }
      const { data: pg } = await supabase
        .from("catalog_pages")
        .select("*")
        .eq("catalog_id", cat.id)
        .order("page_number", { ascending: true });
      setCatalog(cat as Catalog);
      setPages(((pg ?? []) as Array<Omit<CatalogPage, "gallery_images"> & { gallery_images: unknown }>)
        .map(p => ({ ...p, gallery_images: Array.isArray(p.gallery_images) ? (p.gallery_images as string[]) : [] })));
      setLoading(false);

      // Fire-and-forget: increment view_count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("catalogs") as any)
        .update({ view_count: (cat.view_count ?? 0) + 1 })
        .eq("id", cat.id)
        .then(() => {}).catch((e: any) => console.warn('[useCatalogs] suppressed write error:', e?.message ?? String(e)));
    })();
  }, [shortUrl]);

  return { catalog, pages, loading, notFound };
}
