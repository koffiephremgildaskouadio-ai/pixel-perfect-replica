import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Info, Users, Landmark, Video, Newspaper, BookOpen, LayoutGrid, MessageCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuPosition } from "./MenuSculptures";

const MenuSculptures = lazy(() => import("./MenuSculptures"));
class MenuBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const items = [
  { label: "À propos", detail: "Notre district", path: "/a-propos", icon: Info },
  { label: "Bureau", detail: "Notre équipe", path: "/bureau", icon: Landmark },
  { label: "Membres", detail: "La communauté", path: "/membres", icon: Users },
  { label: "Conférence", detail: "Se retrouver", path: "/conference", icon: Video },
  { label: "Actualités", detail: "La vie du district", path: "/actualites", icon: Newspaper },
  { label: "Annuaire", detail: "Nos partenaires", path: "/annuaire", icon: BookOpen },
  { label: "Portails", detail: "Tous nos espaces", path: "/portails", icon: LayoutGrid },
  { label: "NovalimIA", detail: "Votre assistant", path: "/chat", icon: MessageCircle },
];

function MenuTile({ item, index }: { item: typeof items[number]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const tilt = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", `${-(event.clientY - box.top - box.height / 2) / box.height * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(event.clientX - box.left - box.width / 2) / box.width * 12}deg`);
  };
  const reset = () => { ref.current?.style.setProperty("--tilt-x", "0deg"); ref.current?.style.setProperty("--tilt-y", "0deg"); };
  const Icon = item.icon;
  return <Link ref={ref} to={item.path} className="district-menu-tile group" onPointerMove={tilt} onPointerLeave={reset} onBlur={reset}>
    <div className="district-menu-face">
      <div className="flex items-center justify-between">
        <span className="district-menu-icon"><Icon className="h-7 w-7 text-primary" strokeWidth={1.6} /></span>
        <span className="text-xs text-muted-foreground group-hover:text-accent">0{index + 1}</span>
      </div>
      <div className="flex items-end justify-between gap-2 mt-5">
        <div><span className="block font-semibold text-base text-foreground">{item.label}</span><span className="block mt-1 text-xs text-muted-foreground">{item.detail}</span></div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0" />
      </div>
    </div>
  </Link>;
}

export function Menu3D() {
  const grid = useRef<HTMLElement>(null);
  const [positions, setPositions] = useState<MenuPosition[]>([]);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setPositions(Array.from(element.querySelectorAll(".district-menu-icon")).map(icon => {
        const box = icon.getBoundingClientRect();
        return { x: box.left - rect.left + box.width / 2 - rect.width / 2, y: rect.height / 2 - (box.top - rect.top + box.height / 2) };
      }));
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "50px" });
    observer.observe(element);
    measure();
    return () => { resize.disconnect(); observer.disconnect(); media.removeEventListener("change", updateMotion); };
  }, []);
  const active = visible && !reduced && !failed;
  return <section className="district-navigation bg-background border-b border-border" aria-labelledby="district-menu-title">
    <div className="container py-9 md:py-12">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-7">
        <h2 id="district-menu-title" className="text-2xl md:text-3xl font-semibold text-foreground">Votre district, à portée de main.</h2>
        <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground uppercase">Les espaces du District</span>{active && <Button variant="ghost" size="icon" onClick={() => setPaused(value => !value)} aria-label={paused ? "Animer le menu" : "Mettre le menu en pause"} title={paused ? "Animer le menu" : "Mettre le menu en pause"}>{paused ? <Play /> : <Pause />}</Button>}</div>
      </div>
      <nav ref={grid} aria-label="Espaces du District" className={`district-menu-grid relative grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 ${active && ready ? "sculptures-ready" : ""}`}>
        {items.map((item, index) => <MenuTile key={item.path} item={item} index={index} />)}
        {active && positions.length > 0 && <div className="district-menu-sculptures absolute inset-0 pointer-events-none" aria-hidden="true"><MenuBoundary onFailure={() => { setFailed(true); setReady(false); }}><Suspense fallback={null}><MenuSculptures positions={positions} paused={paused} onReady={() => setReady(true)} /></Suspense></MenuBoundary></div>}
      </nav>
    </div>
  </section>;
}
