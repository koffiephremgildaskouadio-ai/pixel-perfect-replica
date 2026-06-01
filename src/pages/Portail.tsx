import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, ExternalLink, Users } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

type Portal = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  color: string | null;
  logo_url: string | null;
  cover_url: string | null;
  member_ids: string[];
  custom_links: { label: string; url: string }[];
};

type Member = {
  id: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  photo_url: string | null;
  phone: string | null;
};

const Portail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("portals" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = data as any as Portal;
      setPortal(p);
      const ids = Array.isArray(p.member_ids) ? p.member_ids : [];
      if (ids.length) {
        const { data: ms } = await supabase
          .from("members")
          .select("id,nom,prenoms,poste,photo_url,phone")
          .in("id", ids);
        setMembers((ms as Member[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (notFound || !portal) {
    return (
      <div className="pt-32 text-center container">
        <h1 className="text-2xl font-bold mb-2">Portail introuvable</h1>
        <p className="text-muted-foreground mb-4">Ce portail n'existe pas ou n'est plus publié.</p>
        <Link to="/" className="text-primary underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const accent = portal.color || "#15803d";

  return (
    <div className="pt-16">
      <section
        className="py-16 lg:py-24 text-white"
        style={{
          background: portal.cover_url
            ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)), url(${portal.cover_url}) center/cover`
            : `linear-gradient(135deg, ${accent}, #166534)`,
        }}
      >
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <div className="flex items-center gap-4">
            {portal.logo_url && (
              <img src={portal.logo_url} alt="" className="w-20 h-20 rounded-xl object-cover bg-white p-1 shadow-lg" />
            )}
            <div>
              <h1 className="font-display text-3xl lg:text-5xl font-bold">{portal.title}</h1>
              {portal.subtitle && <p className="text-white/85 mt-2">{portal.subtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      {portal.description && (
        <section className="py-10">
          <div className="container max-w-3xl">
            <ScrollReveal>
              <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">{portal.description}</p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {portal.custom_links?.length > 0 && (
        <section className="pb-10">
          <div className="container max-w-3xl flex flex-wrap gap-3 justify-center">
            {portal.custom_links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                {l.label} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="py-10 bg-secondary/30">
        <div className="container max-w-5xl">
          <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Membres ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun membre associé pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((m) => (
                <Link
                  to={`/carte/${m.id}`}
                  key={m.id}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition text-center"
                >
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={`${m.nom} ${m.prenoms}`} className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-primary">
                      {m.nom[0]}{m.prenoms[0]}
                    </div>
                  )}
                  <p className="font-semibold text-sm text-foreground truncate">{m.nom} {m.prenoms}</p>
                  {m.poste && <p className="text-[11px] text-muted-foreground line-clamp-2">{m.poste}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Portail;
