import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { ItemType } from "../types";
import { ItemModel } from "./PlanetItems3D";

export function ItemThumbnail3D({
  type,
  performanceMode,
  seedId,
}: {
  type: ItemType;
  performanceMode: boolean;
  seedId: string;
}) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows={!performanceMode}
        dpr={performanceMode ? 1 : [1, 2]}
        gl={{
          antialias: !performanceMode,
          alpha: true,
          powerPreference: performanceMode ? "low-power" : "high-performance",
        }}
        camera={{ position: [1.9, 1.5, 2.2], fov: 40, near: 0.1, far: 20 }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[2.2, 3.2, 2.4]}
          intensity={1.6}
          castShadow={!performanceMode}
          shadow-mapSize-width={performanceMode ? 256 : 1024}
          shadow-mapSize-height={performanceMode ? 256 : 1024}
          shadow-radius={performanceMode ? 1 : 3}
        />
        <Environment preset={"sunset" as any} background={false} />

        <group rotation={[0.08, 0.65, 0]} position={[0, -0.25, 0]}>
          <ItemModel type={type} seedId={seedId} variant="thumb" />
        </group>

        {/* Ground to catch shadows */}
        {!performanceMode && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
            <circleGeometry args={[1.0, 40]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
        )}
      </Canvas>

      {/* Subtle gloss */}
      {!performanceMode && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -14px 26px rgba(0,0,0,0.14)",
          }}
        />
      )}
    </div>
  );
}
