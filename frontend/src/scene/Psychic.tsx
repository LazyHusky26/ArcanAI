import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useStore } from "../store";

// Colors above 1.0 are "too bright" on purpose: the bloom effect makes only those glow
const GLOW = new THREE.Color("#6fd3ff").multiplyScalar(4);
const DAMP = THREE.MathUtils.damp;

// Cloak outline as (radius, height) points; spun around the vertical axis into a robe + hood
const PROFILE = [
  [1.05, 0], [1.0, 0.3], [0.85, 0.8], [0.66, 1.2], [0.5, 1.5], [0.42, 1.75],
  [0.4, 1.9], [0.44, 2.05], [0.41, 2.25], [0.29, 2.42], [0.12, 2.52], [0, 2.56],
].map(([r, y]) => new THREE.Vector2(r, y));

function useCloakMaterial() {
  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: "#0a1226", roughness: 0.85 });
    // Inject a little vertex code so the hem ripples like cloth (more at the bottom)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float hem = 1.0 - clamp(position.y / 1.9, 0.0, 1.0);
          float ang = atan(position.z, position.x);
          float ripple = sin(uTime * 1.6 + position.y * 3.0 + ang * 4.0) * 0.04 * hem;
          transformed.xz *= 1.0 + ripple;
          transformed.x += sin(uTime * 0.9 + position.y) * 0.03 * hem;`,
        );
      mat.userData.shader = shader;
    };
    return mat;
  }, []);
}

// A soft black patch on the hood: the face is never shown, only shadow
function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.55, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

interface ArmProps {
  side: 1 | -1;
  raise: { current: number };
  material: THREE.Material;
}

// Sleeve + glowing hand orb. `raise` (0 to 1) lifts the hands as she concentrates
function Arm({ side, raise, material }: ArmProps) {
  const arm = useRef<THREE.Group>(null!);
  const orb = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const v = useMemo(
    () => ({
      shoulder: new THREE.Vector3(side * 0.42, 1.65, 0.1),
      idle: new THREE.Vector3(side * 0.5, -0.4, 0.75),
      raised: new THREE.Vector3(side * 0.3, 0.6, 0.8),
      dir: new THREE.Vector3(),
      z: new THREE.Vector3(0, 0, 1),
    }),
    [side],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const r = raise.current;
    v.dir.lerpVectors(v.idle, v.raised, r).normalize();
    arm.current.quaternion.setFromUnitVectors(v.z, v.dir); // point the sleeve along dir
    orb.current.position.copy(v.shoulder).addScaledVector(v.dir, 1.05);
    orb.current.position.y += Math.sin(t * 1.5 + side) * 0.04;
    orb.current.scale.setScalar(1 + r * 0.6 + Math.sin(t * 6) * 0.05 * r);
    light.current.intensity = 1.5 + r * 6;
  });

  return (
    <>
      <group ref={arm} position={v.shoulder}>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={material}>
          <capsuleGeometry args={[0.13, 0.75, 6, 12]} />
        </mesh>
      </group>
      <mesh ref={orb}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
        <pointLight ref={light} color="#6fd3ff" distance={6} />
      </mesh>
    </>
  );
}

export default function Psychic() {
  const body = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const burst = useRef<THREE.Group>(null!);
  const raise = useRef(0);
  const cloak = useCloakMaterial();
  const shadow = useShadowTexture();
  const phase = useStore((s) => s.phase);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    // She lifts her hands while the cards are being drawn, then lowers them gradually
    const target = phase === "drawing" ? 1 : phase === "reading" ? 0.55 : phase === "done" ? 0.25 : 0;
    raise.current = DAMP(raise.current, target, 2.5, delta);
    const r = raise.current;

    const shader = cloak.userData.shader;
    if (shader) shader.uniforms.uTime.value = t;

    body.current.position.y = 0.15 + Math.sin(t * 0.8) * 0.05; // hovering
    body.current.scale.y = 1 + Math.sin(t * 1.2) * 0.008; // breathing

    // Energy ring between her hands grows and spins as she summons
    ring.current.scale.setScalar(0.3 + r * 0.9);
    ring.current.position.y = 1.5 + r * 0.45;
    ring.current.rotation.z = t * (0.5 + r * 3);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = r;
    burst.current.scale.setScalar(Math.max(r, 0.001));
    burst.current.visible = r > 0.05;
  });

  return (
    <group ref={body}>
      <mesh material={cloak}>
        <latheGeometry args={[PROFILE, 64]} />
      </mesh>
      <mesh position={[0, 2.12, 0.435]}>
        <planeGeometry args={[0.62, 0.8]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>

      <Arm side={1} raise={raise} material={cloak} />
      <Arm side={-1} raise={raise} material={cloak} />

      <mesh ref={ring} position={[0, 1.5, 0.9]}>
        <torusGeometry args={[0.55, 0.008, 8, 96]} />
        <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* Constant soft sparkles, plus a faster swarm that appears while summoning */}
      <Sparkles count={60} scale={[3.5, 2.5, 2]} position={[0, 1.7, 0.6]} size={2.5} speed={0.4} color="#9fe3ff" />
      <group ref={burst} position={[0, 1.9, 0.9]}>
        <Sparkles count={120} scale={[1.8, 1.8, 1.2]} size={3.5} speed={2.5} color="#bff0ff" />
      </group>
    </group>
  );
}
