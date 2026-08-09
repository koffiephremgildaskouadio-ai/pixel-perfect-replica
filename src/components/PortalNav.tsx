import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STATIC_PORTALS, mapDynamicPortal, type PortalEntry } from "@/lib/portals";
import { LayoutGrid } from "lucide-react";

/** Barre de navigation cohérente entre tous les portails. */
export const PortalNav = ({ activeSlug }: { activeSlug?: string }) => {
  const location = useLocation();
  const { data: dynamic } = useQuery({
    queryKey: ["portal-nav"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portals")
        .select("slug,title,subtitle,description,logo_url,cover_url,external_url,show_in_menu")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      return (data ?? []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const all: PortalEntry[] = [
    ...STATIC_PORTALS,
    ...((dynamic ?? []).map(mapDynamicPortal).filter((p) => p.show_in_menu !== false)),
  ];

  const current = activeSlug ?? all.find((p) => p.path === location.pathname)?.slug;

  return (
    <div className="border-b border-border bg-card/70 backdrop-blur-md">
      <div className="container flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
        <Link
          to="/portails"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/70 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-accent" /> Tous les portails
        </Link>
        {all.map((p) => {
          const cls = `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
            current === p.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`;
          return p.external ? (
            <a key={p.slug} href={p.path} target="_blank" rel="noopener noreferrer" className={cls}>
              {p.title}
            </a>
          ) : (
            <Link key={p.slug} to={p.path} className={cls}>
              {p.title}
            </Link>
          );
        })}

      </div>
    </div>
  );
};
