import { Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Component, type ReactNode } from "react";
import Candles from "./Candles";
import Psychic from "./Psychic";

// Camera drifts slightly toward the mouse so the room feels 3D
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (1.7 + pointer.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 1.45, 0);
  });
  return null;
}

// If WebGL fails, show nothing (the page's plain gradient background stays)
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Scene() {
  return (
    <SceneBoundary>
      <div className="scene">
        <Canvas camera={{ position: [0, 1.7, 6.5], fov: 45 }} dpr={[1, 1.5]}>
          <color attach="background" args={["#060b1a"]} />
          <fog attach="fog" args={["#060b1a", 7, 20]} />

          {/* Cold moonlight from behind makes a glowing edge on the cloak */}
          <ambientLight intensity={0.25} color="#4a6fb5" />
          <directionalLight position={[0, 4, -4]} intensity={2} color="#4fa8ff" />
          <pointLight position={[0, 2, -1.2]} intensity={3} distance={6} color="#6fd3ff" />

          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[14, 64]} />
            <meshStandardMaterial color="#070d1d" roughness={0.6} metalness={0.3} />
          </mesh>

          <Stars radius={60} depth={30} count={1800} factor={3} fade speed={0.4} />
          <Sparkles count={80} scale={[14, 6, 10]} position={[0, 3, 0]} size={1.5} speed={0.15} color="#6fa8ff" opacity={0.5} />
          <Candles />
          <Psychic />
          <CameraRig />

          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} />
            <Vignette offset={0.3} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>
    </SceneBoundary>
  );
}
