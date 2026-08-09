import logo from "@/assets/logo_novalim.png";
import logoCcjy from "@/assets/logo_ccjy.jpg";
import logoFranceVille from "@/assets/franceville_logo.jpg";
import logoNova from "@/assets/nova_logo_official.jpg";
import aboutImage from "@/assets/about-community.jpg";

export type PortalEntry = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  path: string;
  logo_url: string;
  highlights: string[];
  external?: boolean;
  show_in_menu?: boolean;
};


/** Portails officiels du district — source unique pour l'accueil, le menu et les pages. */
export const STATIC_PORTALS: PortalEntry[] = [
  {
    slug: "france-ville",
    title: "District France-Ville",
    subtitle: "Bureau & membres",
    description:
      "Espace dédié au District France-Ville : son bureau, ses membres et leurs cartes d'identification.",
    path: "/france-ville",
    logo_url: logoFranceVille,
    highlights: ["Bureau France-Ville", "Cartes de membre", "Certificats"],
  },
  {
    slug: "bureau",
    title: "Bureau & Cabinet",
    subtitle: "Organisation du district",
    description:
      "Bureau exécutif, cabinet, coordinations et commissions du District Cité Novalim-CIE.",
    path: "/bureau",
    logo_url: logo,
    highlights: ["Bureau exécutif", "Cabinet", "Commissions"],
  },
  {
    slug: "membres",
    title: "Membres",
    subtitle: "Base des membres du district",
    description:
      "Recherchez un membre, consultez sa fiche et sa carte digitale d'identification.",
    path: "/membres",
    logo_url: aboutImage,
    highlights: ["Recherche", "Fiches membres", "Cartes digitales"],
  },
  {
    slug: "annuaire",
    title: "Annuaire",
    subtitle: "Partenaires & services",
    description:
      "Santé, pharmacies, écoles, entreprises, restauration : les services utiles du district.",
    path: "/annuaire",
    logo_url: logoNova,
    highlights: ["Santé", "Commerces", "Éducation"],
  },
  {
    slug: "conference",
    title: "Conférences",
    subtitle: "Réunions en ligne",
    description:
      "Lancez ou rejoignez une réunion virtuelle du district, sans limite de durée.",
    path: "/conference",
    logo_url: logoCcjy,
    highlights: ["Visioconférence", "Lien d'invitation", "Sans inscription"],
  },
  {
    slug: "actualites",
    title: "Actualités",
    subtitle: "Fil d'information quotidien",
    description:
      "Les informations officielles du district, du CCJY et de la commune de Yopougon.",
    path: "/actualites",
    logo_url: logoCcjy,
    highlights: ["Publications", "Audio", "Commentaires"],
  },
];

export type DynamicPortalRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  description?: string | null;
  logo_url: string | null;
  cover_url: string | null;
};

export const mapDynamicPortal = (p: DynamicPortalRow): PortalEntry => ({
  slug: p.slug,
  title: p.title,
  subtitle: p.subtitle ?? "Portail du district",
  description: p.description ?? p.subtitle ?? "Portail du district",
  path: `/portail/${p.slug}`,
  logo_url: p.logo_url || p.cover_url || logo,
  highlights: [],
});
