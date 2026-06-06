import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Newspaper, LayoutGrid, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  id: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  path: string;
};

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [portals, setPortals] = useState<any[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      supabase.from("members").select("id,nom,prenoms,poste,member_number").limit(200),
      supabase.from("actualites").select("id,title,content").order("created_at", { ascending: false }).limit(50),
      supabase.from("portals").select("id,slug,title,subtitle").limit(50),
      supabase.from("directory_entries").select("id,name,category,address").limit(100),
    ]).then(([m, n, p, d]) => {
      setMembers(m.data || []);
      setNews(n.data || []);
      setPortals(p.data || []);
      setDirectory(d.data || []);
      setLoading(false);
    });
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = <T,>(arr: T[], pick: (i: T) => string) =>
      q ? arr.filter((i) => pick(i).toLowerCase().includes(q)).slice(0, 8) : arr.slice(0, 5);

    return {
      members: filter(members, (m: any) => `${m.nom} ${m.prenoms} ${m.poste || ""}`),
      news: filter(news, (n: any) => `${n.title} ${n.content || ""}`),
      portals: filter(portals, (p: any) => `${p.title} ${p.subtitle || ""}`),
      directory: filter(directory, (d: any) => `${d.name} ${d.category} ${d.address || ""}`),
    };
  }, [query, members, news, portals, directory]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground hidden md:flex"
      >
        <Search className="w-4 h-4" />
        <span className="text-xs">Rechercher...</span>
        <kbd className="ml-2 hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border">
          Ctrl K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Rechercher"
      >
        <Search className="w-4 h-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Rechercher membre, actualité, portail, annuaire..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="p-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <>
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              {results.members.length > 0 && (
                <CommandGroup heading="Membres">
                  {results.members.map((m: any) => (
                    <CommandItem key={m.id} onSelect={() => go(`/carte/${m.id}`)}>
                      <Users className="w-4 h-4 mr-2 text-primary" />
                      <div className="flex flex-col">
                        <span>{m.nom} {m.prenoms}</span>
                        <span className="text-xs text-muted-foreground">{m.poste || m.member_number}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.news.length > 0 && (
                <CommandGroup heading="Actualités">
                  {results.news.map((n: any) => (
                    <CommandItem key={n.id} onSelect={() => go(`/actualites`)}>
                      <Newspaper className="w-4 h-4 mr-2 text-accent" />
                      <span className="truncate">{n.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.portals.length > 0 && (
                <CommandGroup heading="Portails">
                  {results.portals.map((p: any) => (
                    <CommandItem key={p.id} onSelect={() => go(`/portail/${p.slug}`)}>
                      <LayoutGrid className="w-4 h-4 mr-2 text-primary" />
                      <span>{p.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.directory.length > 0 && (
                <CommandGroup heading="Annuaire">
                  {results.directory.map((d: any) => (
                    <CommandItem key={d.id} onSelect={() => go(`/annuaire`)}>
                      <BookOpen className="w-4 h-4 mr-2 text-accent" />
                      <div className="flex flex-col">
                        <span>{d.name}</span>
                        <span className="text-xs text-muted-foreground">{d.category}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
