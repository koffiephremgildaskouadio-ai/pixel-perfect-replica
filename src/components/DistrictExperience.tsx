import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Rotate3D, Pause, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu3D } from "@/components/Menu3D";
import logo from "@/assets/logo_novalim.png";
import stage from "@/assets/district-daylight-stage.jpg";

const DistrictScene = lazy(() => import("./DistrictScene"));
const Fallback = () => <img src={logo} alt="Emblème du District Cité Novalim-CIE" className="h-full max-h-[290px] w-auto max-w-full object-contain" />;

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
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState(0);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!context) setFailed(true);
    else context.getExtension("WEBGL_lose_context")?.loseContext();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px" });
    if (section.current) observer.observe(section.current);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  return (
    <>
      <section ref={section} aria-labelledby="district-experience-title" className="district-welcome relative overflow-hidden mt-16">
        <img src={stage} alt="Architecture contemporaine aux couleurs du District" width={1920} height={1088} fetchPriority="high" className="district-welcome-drift absolute inset-0 h-full w-full object-cover" />
        <div className="district-welcome-shade absolute inset-0" />
        <div className="district-welcome-content relative container flex flex-col items-center text-center">
          <p className="text-welcome-foreground/70 text-xs font-medium uppercase pt-8 md:pt-10">Conseil Communal des Jeunes de Yopougon · Zone 7</p>
          <Link to="/a-propos" aria-label="Découvrir le District — logo officiel en relief 3D" title="Découvrir le District" className="district-logo-view relative block w-full max-w-xl cursor-pointer">
            {(!ready || failed || reduced || !visible) && <div className="absolute inset-0 flex items-center justify-center"><Fallback /></div>}
            {visible && !failed && !reduced && <SceneBoundary><Suspense fallback={null}><DistrictScene animated={!paused} greeting={greeting} onFailure={onFailure} onReady={onReady} /></Suspense></SceneBoundary>}
          </Link>
          <div className="district-welcome-copy w-full">
            <h1 id="district-experience-title" className="text-3xl md:text-5xl font-semibold text-welcome-foreground leading-tight">District Cité Novalim-CIE</h1>
            <p role="status" className="mt-4 text-base md:text-lg text-welcome-foreground/75 max-w-lg mx-auto">Bienvenue chez vous. Une communauté unie, une jeunesse engagée.</p>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-7">
              <Button asChild variant="accent" size="lg" className="rounded-full"><Link to="/connexion">Espace Membre <ArrowRight /></Link></Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-primary/30 bg-card/80 text-primary hover:bg-secondary hover:text-primary"><Link to="/conference"><Video /> Rejoindre une conférence</Link></Button>
            </div>
          </div>
          <div className="district-welcome-bottom w-full flex items-center justify-between pb-5 pt-7">
            <span className="text-xs text-welcome-foreground/60">Yopougon · Abidjan, Côte d’Ivoire</span>
            {ready && !failed && !reduced && <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="text-welcome-foreground/70 hover:text-welcome-foreground hover:bg-welcome-foreground/10 rounded-full" onClick={() => { setPaused(false); setGreeting((value) => value + 1); }} aria-label="Faire pivoter le logo" title="Faire pivoter le logo"><Rotate3D /></Button>
              <Button variant="ghost" size="icon" className="text-welcome-foreground/70 hover:text-welcome-foreground hover:bg-welcome-foreground/10 rounded-full" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} title={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"}>{paused ? <Play /> : <Pause />}</Button>
            </div>}
          </div>
        </div>
      </section>
      <Menu3D />
    </>
  );
}
