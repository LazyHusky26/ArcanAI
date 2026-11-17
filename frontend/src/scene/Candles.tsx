import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const FLAME = new THREE.Color("#ffb866").multiplyScalar(3);

// x, z position on the floor; seed makes each flame flicker differently
const CANDLES = [
  { x: -3.2, z: 0.8, seed: 1 },
  { x: -2.1, z: 2.0, seed: 2 },
  { x: 2.3, z: 1.6, seed: 3 },
  { x: 3.4, z: 0.4, seed: 4 },
  { x: -1.4, z: -1.2, seed: 5 },
  { x: 1.6, z: -1.6, seed: 6 },
];

function Candle({ x, z, seed }: (typeof CANDLES)[number]) {
  const light = useRef<THREE.PointLight>(null!);
  const flame = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Two sine waves at different speeds look like a random flicker
    const f = 0.85 + Math.sin(t * 13 + seed) * 0.1 + Math.sin(t * 7.3 + seed * 2) * 0.07;
    light.current.intensity = 1.6 * f;
    flame.current.scale.set(1, 1.8 * f, 1);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.34, 16]} />
        <meshStandardMaterial color="#d9cdb0" roughness={0.9} />
      </mesh>
      <mesh ref={flame} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={FLAME} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.5, 0]} color="#ffb866" distance={5} />
    </group>
  );
}

export default function Candles() {
  return (
    <>
      {CANDLES.map((c) => (
        <Candle key={c.seed} {...c} />
      ))}
    </>
  );
}
