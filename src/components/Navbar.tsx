import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallPWA } from "@/components/InstallPWA";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { MyProfileButton } from "@/components/MyProfileButton";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_novalim.png";
import type { Session } from "@supabase/supabase-js";

type NavItem = {
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
};

const navItems: NavItem[] = [
  { label: "Accueil", path: "/" },
  {
    label: "Le District",
    children: [
      { label: "À propos", path: "/a-propos" },
      { label: "Bureau & Cabinet", path: "/bureau" },
      { label: "Membres", path: "/membres" },
      { label: "District France-Ville", path: "/france-ville" },
    ],
  },
  {
    label: "Nos Activités",
    children: [
      { label: "Réunions virtuelles", path: "/conference" },
      { label: "Quoi de neuf", path: "/chat" },
      { label: "Annuaire des partenaires", path: "/annuaire" },
    ],
  },
  { label: "Actualités", path: "/actualites" },
  { label: "Contact", path: "/#contact" },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setIsAdmin(!!data?.some(r => ["admin", "moderator", "super_admin"].includes(r.role)));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path?: string) => !!path && location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border shadow-sm">

      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Logo District Cité Novalim-CIE" className="w-11 h-11 object-contain" />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="font-display font-bold text-base text-foreground">District Cité Novalim-CIE</span>
            <span className="text-[11px] text-muted-foreground">Yopougon · CCJY</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <button className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                  {item.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
                  <div className="min-w-56 rounded-xl border border-border bg-card shadow-lg p-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(child.path)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path!}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          {session && <NotificationBell />}
          {session && <MyProfileButton variant="outline" />}
          <InstallPWA />
          {session ? (
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          ) : (
            <>
              <Link to="/connexion" className="hidden md:block">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Espace Membre
                </Button>
              </Link>
              <Link to="/connexion?espace=bureau" className="hidden md:block">
                <Button size="sm" className="gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Espace Bureau
                </Button>
              </Link>
            </>
          )}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-card border-b border-border animate-fade-in max-h-[80vh] overflow-y-auto">
          <nav className="container py-4 flex flex-col gap-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="pt-2">
                  <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Administration
              </Link>
            )}
            {session ? (
              <>
                <div className="mt-2"><MyProfileButton variant="outline" /></div>
                <Button variant="outline" size="sm" className="mt-2 w-full gap-2" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/connexion" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Espace Membre</Button>
                </Link>
                <Link to="/connexion?espace=bureau" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Espace Bureau</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
