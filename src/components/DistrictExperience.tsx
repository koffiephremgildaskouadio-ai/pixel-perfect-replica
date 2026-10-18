import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Rotate3D, Pause, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu3D } from "@/components/Menu3D";
import logo from "@/assets/logo_novalim.png";
import stage from "@/assets/district-welcome-stage.jpg";

const DistrictScene = lazy(() => import("./DistrictScene"));
const Fallback = () => <img src={logo} alt="Emblème du District Cité Novalim-CIE" className="h-full max-h-[420px] w-auto max-w-full object-contain" />;

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
    <section ref={section} aria-labelledby="district-experience-title" className="district-welcome relative overflow-hidden mt-16 border-b border-border">
      <img src={stage} alt="Décor architectural aux couleurs du District" width={1920} height={1088} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      <div className="district-welcome-content relative container flex flex-col items-center text-center">
        <p className="text-primary text-xs font-semibold uppercase mt-6 md:mt-8">Zone 7 · CCJY · Yopougon</p>
        <div role="img" aria-label="Logo officiel du District en relief trois dimensions" className="district-logo-view relative w-full max-w-2xl">
          {(!ready || failed || reduced || !visible) && <div className="absolute inset-0 flex items-center justify-center"><Fallback /></div>}
          {visible && !failed && !reduced && <SceneBoundary><Suspense fallback={null}><DistrictScene animated={!paused} greeting={greeting} onFailure={onFailure} onReady={onReady} /></Suspense></SceneBoundary>}
        </div>
        <div className="district-welcome-copy w-full pb-8">
          <h1 id="district-experience-title" className="text-3xl md:text-5xl font-bold text-primary leading-tight">District Cité Novalim-CIE</h1>
          <p role="status" className="mt-3 text-base md:text-lg text-foreground">Bienvenue dans notre communauté. Ensemble, faisons grandir notre district.</p>
          <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
            <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/portails">Entrer dans le District <ArrowRight /></Link></Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-card/90"><Link to="/conference"><Video /> Conférence</Link></Button>
            {ready && !failed && !reduced && <>
              <Button variant="outline" size="icon" className="rounded-full bg-card/90" onClick={() => { setPaused(false); setGreeting((value) => value + 1); }} aria-label="Faire pivoter le logo" title="Faire pivoter le logo"><Rotate3D /></Button>
              <Button variant="outline" size="icon" className="rounded-full bg-card/90" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} title={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"}>{paused ? <Play /> : <Pause />}</Button>
            </>}
          </div>
          <Menu3D />
        </div>
      </div>
    </section>
  );
}