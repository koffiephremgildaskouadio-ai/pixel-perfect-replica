import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Info, Users, Landmark, Video, Newspaper, BookOpen, LayoutGrid, MessageCircle } from "lucide-react";

const items = [
  { label: "À propos", path: "/a-propos", icon: Info },
  { label: "Bureau", path: "/bureau", icon: Landmark },
  { label: "Membres", path: "/membres", icon: Users },
  { label: "Conférence", path: "/conference", icon: Video },
  { label: "Actualités", path: "/actualites", icon: Newspaper },
  { label: "Annuaire", path: "/annuaire", icon: BookOpen },
  { label: "Portails", path: "/portails", icon: LayoutGrid },
  { label: "NovalimIA", path: "/chat", icon: MessageCircle },
];
const step = 360 / items.length;

export function Menu3D() {
  const [angle, setAngle] = useState(0);
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; a: number } | null>(null);
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = performance.now();
    const tick = (t: number) => { const dt = Math.min((t - last) / 1000, 0.05); last = t; setAngle((a) => a - dt * 12); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);
  const go = (dir: number) => { setAuto(false); setAngle((a) => Math.round(a / step) * step + dir * step); };
  return (
    <nav aria-label="Menu 3D du District" className="relative w-full max-w-3xl mx-auto mt-8 select-none">
      <div className="h-56 md:h-64 flex items-center justify-center [perspective:900px] touch-pan-y"
        onPointerDown={(e) => { drag.current = { x: e.clientX, a: angle }; setAuto(false); }}
        onPointerMove={(e) => { if (drag.current) setAngle(drag.current.a + (e.clientX - drag.current.x) * 0.4); }}
        onPointerUp={() => { drag.current = null; setAngle((a) => Math.round(a / step) * step); }}
        onPointerLeave={() => { drag.current = null; }}>
        <div className="relative w-28 h-36 md:w-32 md:h-40 [transform-style:preserve-3d] transition-transform duration-500 ease-out"
          style={{ transform: `translateZ(-220px) rotateX(-8deg) rotateY(${angle}deg)` }}>
          {items.map(({ label, path, icon: Icon }, i) => (
            <Link key={path} to={path} draggable={false}
              className="absolute inset-0 rounded-3xl border border-border bg-card/95 shadow-xl flex flex-col items-center justify-center gap-3 text-foreground hover:text-accent hover:border-accent transition-colors [backface-visibility:hidden]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(230px)` }}>
              <span className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg"><Icon className="w-6 h-6" /></span>
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={() => go(1)} aria-label="Précédent" className="w-10 h-10 rounded-full border border-border bg-card/90 flex items-center justify-center hover:bg-secondary"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => go(-1)} aria-label="Suivant" className="w-10 h-10 rounded-full border border-border bg-card/90 flex items-center justify-center hover:bg-secondary"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </nav>
  );
}
