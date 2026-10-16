import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Hand, MessageCircle, Pause, Play } from "lucide-react";
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
    <section ref={section} aria-labelledby="district-experience-title" className="relative bg-background pt-24 pb-8 overflow-hidden border-b border-border">
      <div className="container text-center relative">
        <div className="flex justify-center items-center gap-3">
          <img src={logo} alt="Logo officiel du District" className="h-12 w-12 object-contain" />
          <p className="text-accent text-xs font-semibold uppercase">Zone 7 · CCJY · Yopougon</p>
        </div>
        <h1 id="district-experience-title" className="mt-3 text-3xl md:text-4xl font-bold">District Cité Novalim-CIE</h1>
        <p role="status" className="mt-3 text-lg font-medium text-primary">Bienvenue ! Heureux de vous retrouver dans notre communauté.</p>
        <div role="img" aria-label="Robot d’accueil en trois dimensions saluant les visiteurs" className="relative h-[300px] md:h-[330px] w-full">
          {(!ready || failed || reduced || !visible) && <div className="absolute inset-0 flex items-center justify-center"><Fallback /></div>}
          {visible && !failed && !reduced && <SceneBoundary><Suspense fallback={null}><DistrictScene animated={!paused} greeting={greeting} onFailure={onFailure} onReady={onReady} /></Suspense></SceneBoundary>}
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <Button asChild className="rounded-full"><Link to="/portails">Nos espaces <ArrowRight /></Link></Button>
          <Button asChild variant="outline" className="rounded-full"><Link to="/chat"><MessageCircle /> NovalimIA</Link></Button>
          {ready && !failed && !reduced && <>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => { setPaused(false); setGreeting((value) => value + 1); }} aria-label="Saluer le robot" title="Saluer le robot"><Hand /></Button>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} title={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"}>{paused ? <Play /> : <Pause />}</Button>
          </>}
        </div>
      </div>
    </section>
  );
}