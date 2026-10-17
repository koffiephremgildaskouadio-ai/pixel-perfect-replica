import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Group, SRGBColorSpace } from "three";
import { createDistrictLogoGeometry } from "@/lib/districtLogo";
import logo from "@/assets/logo_novalim.png";

type SceneProps = { animated: boolean; greeting: number; onFailure: () => void; onReady: () => void };
type Palette = { primary: string; accent: string; paper: string };

function Emblem({ animated, greeting, onReady, palette }: Omit<SceneProps, "onFailure"> & { palette: Palette }) {
  const texture = useTexture(logo);
  const geometry = useMemo(createDistrictLogoGeometry, []);
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  useEffect(() => { texture.colorSpace = SRGBColorSpace; onReady(); }, [texture, onReady]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((state, rawDelta) => {
    if (!animated || !group.current) return;
    const dt = Math.min(rawDelta, 0.05);
    elapsed.current += dt;
    const target = Math.sin(elapsed.current * 0.45 + greeting) * 0.14 + state.pointer.x * 0.23;
    group.current.rotation.y += (target - group.current.rotation.y) * (1 - Math.exp(-4 * dt));
    group.current.rotation.x += (-state.pointer.y * 0.1 - group.current.rotation.x) * (1 - Math.exp(-4 * dt));
    group.current.position.y = Math.sin(elapsed.current * 0.8) * 0.035;
  });
  return <group ref={group}><mesh geometry={geometry}>
    <meshStandardMaterial attach="material-0" map={texture} roughness={0.35} metalness={0.12} />
    <meshStandardMaterial attach="material-1" color={palette.primary} metalness={0.65} roughness={0.26} />
  </mesh></group>;
}

export default function DistrictScene({ animated, greeting, onFailure, onReady }: SceneProps) {
  const [palette, setPalette] = useState<Palette>();
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const color = (token: string) => `hsl(${styles.getPropertyValue(token).trim().split(/\s+/).join(", ")})`;
    setPalette({ primary: color("--primary"), accent: color("--accent"), paper: color("--card") });
  }, []);
  if (!palette) return null;
  return <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 36 }} frameloop={animated ? "always" : "demand"}
    gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.domElement.addEventListener("webglcontextlost", onFailure, { once: true }); }}>
    <ambientLight intensity={1.5} />
    <directionalLight position={[2, 5, 6]} intensity={2} />
    <Environment resolution={64}>
      <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 8, 1]} />
      <Lightformer color={palette.accent} intensity={1.4} position={[-4, 0, 3]} scale={[4, 6, 1]} />
      <Lightformer color={palette.paper} intensity={2} position={[4, 1, 2]} scale={[2, 6, 1]} />
    </Environment>
    <Suspense fallback={null}><Emblem palette={palette} animated={animated} greeting={greeting} onReady={onReady} /></Suspense>
  </Canvas>;
}
