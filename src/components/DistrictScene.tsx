import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { Group, SRGBColorSpace } from "three";
import logo from "@/assets/logo_novalim.png";

type Palette = { primary: string; accent: string; paper: string };

function Emblem({ palette, animated }: { palette: Palette; animated: boolean }) {
  const group = useRef<Group>(null);
  const texture = useTexture(logo);
  texture.colorSpace = SRGBColorSpace;
  useFrame((state, rawDelta) => {
    if (!group.current || !animated) return;
    const dt = Math.min(rawDelta, 0.05);
    const target = state.pointer.x * 0.22;
    group.current.rotation.y += (target - group.current.rotation.y) * (1 - Math.exp(-3 * dt));
    group.current.rotation.x += (-state.pointer.y * 0.12 - group.current.rotation.x) * (1 - Math.exp(-3 * dt));
  });
  return (
    <group ref={group} rotation={[0.05, -0.12, -0.04]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.82, 1.82, 0.22, 80]} />
        <meshStandardMaterial color={palette.primary} metalness={0.55} roughness={0.28} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[0, 0, side * 0.125]} rotation={[0, side === -1 ? Math.PI : 0, 0]}>
          <mesh>
            <circleGeometry args={[1.68, 80]} />
            <meshStandardMaterial color={palette.paper} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[2.42, 2.42]} />
            <meshStandardMaterial map={texture} transparent roughness={0.65} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <torusGeometry args={[1.76, 0.045, 12, 80]} />
            <meshStandardMaterial color={palette.accent} metalness={0.7} roughness={0.23} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[0.3 + index * 0.2, index * 0.6, index * 0.5]}>
          <torusGeometry args={[2.12 + index * 0.16, 0.025, 8, 100, Math.PI * 1.35]} />
          <meshStandardMaterial color={index === 1 ? palette.primary : palette.accent} metalness={0.65} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export default function DistrictScene({ animated, onFailure }: { animated: boolean; onFailure: () => void }) {
  const [palette, setPalette] = useState<Palette>();
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const color = (token: string) => `hsl(${styles.getPropertyValue(token).trim().split(/\s+/).join(", ")})`;
    setPalette({ primary: color("--primary"), accent: color("--accent"), paper: color("--card") });
  }, []);
  if (!palette) return null;
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.8], fov: 42 }} frameloop={animated ? "always" : "demand"}
      gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, { once: true });
      }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 5, 6]} intensity={2} />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 8, 1]} />
          <Lightformer color={palette.accent} intensity={1.2} position={[-4, 0, 3]} scale={[4, 6, 1]} />
        </Environment>
        <Emblem palette={palette} animated={animated} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} enableDamping autoRotate={animated} autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI * 2 / 3} />
    </Canvas>
  );
}