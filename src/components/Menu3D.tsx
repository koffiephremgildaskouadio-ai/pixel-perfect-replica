import { useRef, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Info, Users, Landmark, Video, Newspaper, BookOpen, LayoutGrid, MessageCircle } from "lucide-react";

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
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
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
  return <section className="district-navigation bg-background border-b border-border" aria-labelledby="district-menu-title">
    <div className="container py-9 md:py-12">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-7">
        <h2 id="district-menu-title" className="text-2xl md:text-3xl font-semibold text-foreground">Votre district, à portée de main.</h2>
        <span className="text-xs text-muted-foreground uppercase">Les espaces du District</span>
      </div>
      <nav aria-label="Espaces du District" className="district-menu-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, index) => <MenuTile key={item.path} item={item} index={index} />)}
      </nav>
    </div>
  </section>;
}
