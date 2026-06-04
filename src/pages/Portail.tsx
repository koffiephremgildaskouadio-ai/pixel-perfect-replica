import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, ExternalLink, Users, Plus, UserPlus, CreditCard, Award, X, Save, Trash2 } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateCertificate } from "@/lib/certificate";
import { VirtualCard } from "@/components/VirtualCard";

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
  member_number: string;
  nom: string;
  prenoms: string;
  poste: string | null;
  photo_url: string | null;
  phone: string | null;
  category: string;
  cahier_charges: string | null;
};

const Portail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cardModal, setCardModal] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    nom: "", prenoms: "", poste: "", phone: "", category: "membre", cahier_charges: "",
  });

  const load = async () => {
    if (!slug) return;
    const { data, error } = await supabase
      .from("portals" as any).select("*").eq("slug", slug).maybeSingle();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    const p = data as any as Portal;
    setPortal(p);
    const ids = Array.isArray(p.member_ids) ? p.member_ids : [];
    if (ids.length) {
      const { data: ms } = await supabase
        .from("members")
        .select("id,member_number,nom,prenoms,poste,photo_url,phone,category,cahier_charges")
        .in("id", ids);
      setMembers((ms as Member[]) ?? []);
    } else {
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        setIsSuperAdmin((roles ?? []).some((r: any) => r.role === "super_admin" || r.role === "admin"));
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleAddMember = async () => {
    if (!portal) return;
    if (!newMember.nom.trim() || !newMember.prenoms.trim()) {
      toast.error("Nom et prénoms obligatoires");
      return;
    }
    // Génère un member_number
    const { data: max } = await supabase
      .from("members")
      .select("member_number")
      .like("member_number", "NCV-2025-%")
      .order("member_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastNum = max?.member_number?.match(/NCV-2025-(\d+)/)?.[1];
    const next = String(Math.max(parseInt(lastNum || "100", 10), 100) + 1).padStart(3, "0");
    const member_number = `NCV-2025-${next}`;

    const { data: inserted, error } = await supabase.from("members").insert({
      member_number,
      nom: newMember.nom.trim(),
      prenoms: newMember.prenoms.trim(),
      poste: newMember.poste || null,
      phone: newMember.phone || null,
      category: newMember.category,
      cahier_charges: newMember.cahier_charges || null,
      district: portal.title,
    }).select().single();
    if (error || !inserted) { toast.error(error?.message || "Erreur"); return; }

    // Ajoute au portail
    const nextIds = [...(portal.member_ids || []), inserted.id];
    await supabase.from("portals" as any).update({ member_ids: nextIds }).eq("id", portal.id);

    toast.success("Membre ajouté au portail");
    setAdding(false);
    setNewMember({ nom: "", prenoms: "", poste: "", phone: "", category: "membre", cahier_charges: "" });
    load();
  };

  const removeMember = async (memberId: string) => {
    if (!portal) return;
    if (!confirm("Retirer ce membre du portail ?")) return;
    const nextIds = (portal.member_ids || []).filter((id) => id !== memberId);
    await supabase.from("portals" as any).update({ member_ids: nextIds }).eq("id", portal.id);
    toast.success("Retiré");
    load();
  };

  const downloadCertificate = async (m: Member) => {
    toast.loading("Génération du certificat...", { id: "cert" });
    try {
      await generateCertificate({
        member_number: m.member_number,
        nom: m.nom, prenoms: m.prenoms,
        poste: m.poste, category: m.category,
        district: portal?.title || null,
        phone: m.phone, cahier_charges: m.cahier_charges,
      });
      toast.success("Certificat téléchargé", { id: "cert" });
    } catch (e: any) {
      toast.error("Erreur : " + (e.message || ""), { id: "cert" });
    }
  };

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
        className="py-16 lg:py-24 text-white relative"
        style={{
          background: portal.cover_url
            ? `linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)), url(${portal.cover_url}) center/cover`
            : `linear-gradient(135deg, ${accent}, #166534)`,
        }}
      >
        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <div className="flex items-center gap-4">
            {portal.logo_url && (
              <img src={portal.logo_url} alt="" className="w-20 h-20 rounded-xl object-cover bg-white p-1 shadow-lg" />
            )}
            <div>
              <h1 className="font-display text-3xl lg:text-5xl font-bold drop-shadow">{portal.title}</h1>
              {portal.subtitle && <p className="text-white/85 mt-2">{portal.subtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      {portal.description && (
        <section className="py-10">
          <div className="container max-w-3xl">
            <ScrollReveal>
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">{portal.description}</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {portal.custom_links?.length > 0 && (
        <section className="pb-10">
          <div className="container max-w-3xl flex flex-wrap gap-3 justify-center">
            {portal.custom_links.map((l, i) => (
              <a
                key={i} href={l.url} target="_blank" rel="noopener noreferrer"
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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Membres ({members.length})
            </h2>
            {isSuperAdmin && (
              <Button onClick={() => setAdding(true)} size="sm" className="gap-1">
                <UserPlus className="w-4 h-4" /> Ajouter un membre
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun membre associé pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition text-center group relative">
                  <Link to={`/carte/${m.id}`}>
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
                  {isSuperAdmin && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      <button onClick={() => setCardModal(m)} title="Voir/Télécharger carte"
                        className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20">
                        <CreditCard className="w-3 h-3" /> Carte
                      </button>
                      <button onClick={() => downloadCertificate(m)} title="Certificat"
                        className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200">
                        <Award className="w-3 h-3" /> Certif
                      </button>
                      <button onClick={() => removeMember(m.id)} title="Retirer du portail"
                        className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal — Ajout membre */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-auto" onClick={() => setAdding(false)}>
          <div className="bg-card rounded-xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Nouveau membre</h3>
              <button onClick={() => setAdding(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <Input placeholder="Nom *" value={newMember.nom} onChange={(e) => setNewMember({ ...newMember, nom: e.target.value })} />
              <Input placeholder="Prénoms *" value={newMember.prenoms} onChange={(e) => setNewMember({ ...newMember, prenoms: e.target.value })} />
              <Input placeholder="Poste / Fonction" value={newMember.poste} onChange={(e) => setNewMember({ ...newMember, poste: e.target.value })} />
              <Input placeholder="Téléphone" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
              <select className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                value={newMember.category} onChange={(e) => setNewMember({ ...newMember, category: e.target.value })}>
                <option value="bureau">Bureau exécutif</option>
                <option value="cabinet">Cabinet</option>
                <option value="coordonnateur">Coordonnateur</option>
                <option value="commission">Commission</option>
                <option value="membre">Membre</option>
                <option value="partenaire">Partenaire</option>
              </select>
              <Textarea rows={3} placeholder="Cahier de charges (optionnel — généré automatiquement sinon)"
                value={newMember.cahier_charges} onChange={(e) => setNewMember({ ...newMember, cahier_charges: e.target.value })} />
              <Button onClick={handleAddMember} className="w-full"><Save className="w-4 h-4 mr-1" /> Créer le membre</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Carte de membre */}
      {cardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-auto" onClick={() => setCardModal(null)}>
          <div className="bg-background rounded-xl p-5 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Carte de {cardModal.prenoms} {cardModal.nom}</h3>
              <button onClick={() => setCardModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <VirtualCard
              memberNumber={cardModal.member_number}
              nom={cardModal.nom}
              prenoms={cardModal.prenoms}
              poste={cardModal.poste}
              quartier={null}
              phone={cardModal.phone}
              category={cardModal.category}
              memberId={cardModal.id}
              photoUrl={cardModal.photo_url}
              canDownload={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Portail;
