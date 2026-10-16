import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { AnimationMixer, Box3, Group, LoopOnce, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

type Palette = { primary: string; accent: string; paper: string; ink: string };
type SceneProps = { animated: boolean; greeting: number; onFailure: () => void; onReady: () => void };

function WelcomeRobot({ palette, animated, greeting, onReady }: Omit<SceneProps, "onFailure"> & { palette: Palette }) {
  const { scene, animations } = useGLTF("/models/welcome-robot.glb");
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  const object = useMemo(() => {
    const model = clone(scene);
    model.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.castShadow = true;
      const recolor = (source: MeshStandardMaterial) => {
        const material = source.clone();
        material.color.set(source.name === "Main" ? palette.primary : source.name === "Black" ? palette.ink : palette.paper);
        material.roughness = 0.42;
        return material;
      };
      if (Array.isArray(node.material)) node.material = node.material.map((m) => m instanceof MeshStandardMaterial ? recolor(m) : m);
      else if (node.material instanceof MeshStandardMaterial) node.material = recolor(node.material);
    });
    const bounds = new Box3().setFromObject(model);
    model.scale.setScalar(3.3 / (bounds.getSize(new Vector3()).y || 1));
    const scaled = new Box3().setFromObject(model);
    const center = scaled.getCenter(new Vector3());
    model.position.set(-center.x, -scaled.min.y - 1.65, -center.z);
    return model;
  }, [scene, palette]);
  const mixer = useMemo(() => new AnimationMixer(object), [object]);
  useEffect(() => {
    const idle = animations.find((clip) => clip.name === "Idle");
    const wave = animations.find((clip) => clip.name === "Wave");
    if (!idle || !wave) return;
    const resting = mixer.clipAction(idle);
    const hello = mixer.clipAction(wave);
    resting.play();
    hello.reset().setLoop(LoopOnce, 1).fadeIn(0.2).play();
    hello.clampWhenFinished = true;
    const finished = () => { hello.fadeOut(0.3); resting.reset().fadeIn(0.3).play(); };
    mixer.addEventListener("finished", finished);
    onReady();
    return () => { mixer.removeEventListener("finished", finished); mixer.stopAllAction(); };
  }, [mixer, animations, greeting, onReady]);
  useEffect(() => () => {
    mixer.uncacheRoot(object);
    object.traverse((node) => {
      if (node instanceof Mesh) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }, [mixer, object]);
  useFrame((state, rawDelta) => {
    if (!animated || !group.current) return;
    const dt = Math.min(rawDelta, 0.05);
    elapsed.current += dt;
    mixer.update(dt);
    group.current.rotation.y += (state.pointer.x * 0.18 - group.current.rotation.y) * (1 - Math.exp(-4 * dt));
    group.current.position.y = Math.sin(elapsed.current * 1.5) * 0.035;
  });
  return <group ref={group}><primitive object={object} dispose={null} /></group>;
}

export default function DistrictScene({ animated, greeting, onFailure, onReady }: SceneProps) {
  const [palette, setPalette] = useState<Palette>();
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const color = (token: string) => `hsl(${styles.getPropertyValue(token).trim().split(/\s+/).join(", ")})`;
    setPalette({ primary: color("--primary"), accent: color("--accent"), paper: color("--card"), ink: color("--foreground") });
  }, []);
  if (!palette) return null;
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.8], fov: 34 }} frameloop={animated ? "always" : "demand"}
      gl={{ antialias: true, alpha: true }} fallback={null} onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, { once: true });
      }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 6]} intensity={2.5} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 8, 1]} />
        <Lightformer color={palette.accent} intensity={1} position={[-4, 0, 3]} scale={[4, 6, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <WelcomeRobot palette={palette} animated={animated} greeting={greeting} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}