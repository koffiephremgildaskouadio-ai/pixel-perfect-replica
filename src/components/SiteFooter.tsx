import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo_novalim.png";

const navLinks = [
  { label: "Accueil", path: "/" },
  { label: "À propos", path: "/a-propos" },
  { label: "Bureau & Cabinet", path: "/bureau" },
  { label: "Membres", path: "/membres" },
  { label: "Actualités", path: "/actualites" },
  { label: "Réunions virtuelles", path: "/conference" },
  { label: "Annuaire", path: "/annuaire" },
];

const socials = [
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/" },
];

export const SiteFooter = () => (
  <footer id="contact" className="bg-navy text-navy-foreground">

    <div className="container py-14">
      <div className="grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo District Cité Novalim-CIE" className="w-12 h-12 object-contain" />
            <span className="font-display font-bold text-navy-foreground leading-tight">
              District Cité<br />Novalim-CIE
            </span>
          </div>
          <p className="text-sm text-navy-foreground/70 leading-relaxed">
            Plateforme officielle du District Cité Novalim-CIE, Zone 7 du Conseil Communal
            des Jeunes de Yopougon.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full bg-navy-foreground/10 flex items-center justify-center text-navy-foreground/80 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-navy-foreground mb-4">Navigation</h3>
          <ul className="space-y-2">
            {navLinks.map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="text-sm text-navy-foreground/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-navy-foreground mb-4">Espaces</h3>
          <ul className="space-y-2">
            <li><Link to="/connexion" className="text-sm text-navy-foreground/70 hover:text-accent transition-colors">Espace Membre</Link></li>
            <li><Link to="/connexion?espace=bureau" className="text-sm text-navy-foreground/70 hover:text-accent transition-colors">Espace Bureau</Link></li>
            <li><Link to="/france-ville" className="text-sm text-navy-foreground/70 hover:text-accent transition-colors">District France-Ville</Link></li>
            <li><Link to="/chat" className="text-sm text-navy-foreground/70 hover:text-accent transition-colors">Quoi de neuf</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-navy-foreground mb-4">Contact</h3>
          <ul className="space-y-3 text-sm text-navy-foreground/70">
            <li className="flex gap-2">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              Cité CIE Novalim-City, Yopougon, Abidjan — Côte d'Ivoire
            </li>
            <li className="flex gap-2">
              <Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <a href="tel:+2250700000000" className="hover:text-primary transition-colors">+225 07 00 00 00 00</a>
            </li>
            <li className="flex gap-2">
              <Mail className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <a href="mailto:contact@novalim-cie.org" className="hover:text-primary transition-colors">contact@novalim-cie.org</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="border-t border-border">
      <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-foreground/60">
        <p>© {new Date().getFullYear()} District Cité Novalim-CIE. Tous droits réservés.</p>
        <p>Mentions légales · Politique de confidentialité</p>
      </div>
    </div>
  </footer>
);
