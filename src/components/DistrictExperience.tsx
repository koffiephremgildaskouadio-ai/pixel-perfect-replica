import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_novalim.png";

const DistrictScene = lazy(() => import("./DistrictScene"));
const Fallback = () => <img src={logo} alt="Emblème du District Cité Novalim-CIE" className="h-64 w-64 object-contain" />;

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Fallback /> : this.props.children; }
}

export function DistrictExperience() {
  const section = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px" });
    if (section.current) observer.observe(section.current);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  return (
    <section ref={section} aria-labelledby="district-experience-title" className="relative bg-background py-12 overflow-hidden border-y border-border">
      <div className="container text-center relative">
        <p className="text-accent text-xs font-semibold uppercase">Zone 7 · CCJY · Yopougon</p>
        <h2 id="district-experience-title" className="mt-3 text-3xl md:text-4xl font-bold">District Cité Novalim-CIE</h2>
        <p className="mt-3 text-muted-foreground">Une jeunesse unie. Un district en mouvement.</p>
        <div role="img" aria-label="Emblème interactif en trois dimensions du district" className="h-[320px] md:h-[400px] w-full flex items-center justify-center">
          {visible && !failed ? <SceneBoundary><Suspense fallback={<Fallback />}><DistrictScene animated={!paused && !reduced} onFailure={() => setFailed(true)} /></Suspense></SceneBoundary> : <Fallback />}
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <Button asChild className="rounded-full"><Link to="/portails">Explorer nos portails <ArrowRight /></Link></Button>
          {!failed && !reduced && <Button variant="outline" size="icon" className="rounded-full" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} title={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"}>{paused ? <Play /> : <Pause />}</Button>}
        </div>
      </div>
    </section>
  );
}