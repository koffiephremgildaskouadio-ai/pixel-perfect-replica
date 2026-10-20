import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import { renderToStaticMarkup } from "react-dom/server";
import { Group, SRGBColorSpace } from "three";
import { Info, Users, Landmark, Video, Newspaper, BookOpen, LayoutGrid, MessageCircle } from "lucide-react";

export type MenuPosition = { x: number; y: number };
const icons = [Info, Landmark, Users, Video, Newspaper, BookOpen, LayoutGrid, MessageCircle];
type Palette = { primary: string; paper: string; accent: string };

function Sculpture({ position, index, palette, paused }: { position: MenuPosition; index: number; palette: Palette; paused: boolean }) {
  const group = useRef<Group>(null);
  const time = useRef(index * 0.7);
  const uri = useMemo(() => {
    const Icon = icons[index] ?? Info;
    const svg = renderToStaticMarkup(<Icon size={128} color={palette.primary} strokeWidth={1.5} />);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [index, palette.primary]);
  const texture = useTexture(uri);
  useEffect(() => { texture.colorSpace = SRGBColorSpace; }, [texture]);
  useFrame((_, delta) => {
    if (!group.current || paused) return;
    time.current += Math.min(delta, 0.05);
    group.current.rotation.y = Math.sin(time.current * 0.9) * 0.7;
    group.current.rotation.x = Math.sin(time.current * 0.65) * 0.22;
    group.current.rotation.z = Math.sin(time.current * 0.5) * 0.08;
    group.current.position.y = position.y + Math.sin(time.current * 1.1) * 5;
  });
  return <group ref={group} position={[position.x, position.y, 0]}>
    <RoundedBox args={[66, 66, 18]} radius={10} smoothness={3}>
      <meshStandardMaterial color={index % 2 ? palette.accent : palette.primary} metalness={0.5} roughness={0.3} />
    </RoundedBox>
    <RoundedBox args={[61, 61, 3]} radius={8} smoothness={3} position-z={10}>
      <meshStandardMaterial color={palette.paper} roughness={0.3} metalness={0.15} />
    </RoundedBox>
    <mesh position-z={12}>
      <planeGeometry args={[37, 37]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  </group>;
}

export default function MenuSculptures({ positions, paused, onReady }: { positions: MenuPosition[]; paused: boolean; onReady: () => void }) {
  const [palette, setPalette] = useState<Palette>();
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const color = (token: string) => `hsl(${styles.getPropertyValue(token).trim().split(/\s+/).join(", ")})`;
    setPalette({ primary: color("--primary"), paper: color("--card"), accent: color("--accent") });
  }, []);
  if (!palette) return null;
  return <Canvas orthographic camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 2000 }} dpr={[1, 1.5]} frameloop={paused ? "demand" : "always"} gl={{ alpha: true, antialias: true }} onCreated={onReady}>
    <ambientLight intensity={1.5} />
    <directionalLight position={[200, 300, 500]} intensity={3} />
    <Environment resolution={32}>
      <Lightformer position={[0, 200, 400]} scale={[600, 400, 1]} intensity={2} />
    </Environment>
    <Suspense fallback={null}>{positions.map((position, index) => <Sculpture key={index} position={position} index={index} palette={palette} paused={paused} />)}</Suspense>
  </Canvas>;
}