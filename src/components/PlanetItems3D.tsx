import React, { useMemo } from "react";
import * as THREE from "three";
import { GroupProps } from "@react-three/fiber";
import { ItemType } from "../types";

/**
 * Simple low-poly “toy/miniature” models built from primitives.
 * These are intentionally lightweight (no external assets) but still
 * take advantage of PBR lighting & shadows for a realistic look.
 */

function useStableSeed(id: string) {
  return useMemo(() => {
    // FNV-1a
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 0xffffffff;
  }, [id]);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function color(hex: string) {
  return new THREE.Color(hex);
}

type ItemModelProps = GroupProps & {
  type: ItemType;
  /** Used only for deterministic small variation (e.g. roof tint) */
  seedId?: string;
  /** World vs thumb scale tuning */
  variant?: "world" | "thumb";
};

export function ItemModel({ type, seedId = type, variant = "world", ...props }: ItemModelProps) {
  const s = useStableSeed(seedId);
  const worldScale = variant === "thumb" ? 0.95 : 1.0;

  // Shared materials (reused to reduce allocations)
  const mats = useMemo(() => {
    const mat = (c: string, rough = 0.7, metal = 0.02) =>
      new THREE.MeshStandardMaterial({ color: color(c), roughness: rough, metalness: metal });

    const glass = new THREE.MeshPhysicalMaterial({
      color: color("#E6F7FF"),
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.65,
      thickness: 0.7,
      ior: 1.35,
      transparent: true,
      opacity: 0.9,
    });

    return {
      trunk: mat("#7C4A2D", 0.9),
      leaf: mat("#2CCB6B", 0.75),
      pine: mat("#1FAA59", 0.78),
      house: mat("#F4F1EA", 0.72),
      roof: mat(["#D95B57", "#C04C6A", "#B2483F"][Math.floor(s * 3)], 0.65),
      stone: mat("#8B98A5", 0.9, 0.03),
      cloud: mat("#FFFFFF", 0.95),
      snow: mat("#F8FAFC", 0.9),
      flower: mat(["#F43F5E", "#A855F7", "#F97316", "#22C55E"][Math.floor(s * 4)], 0.65, 0.05),
      stem: mat("#22C55E", 0.85),
      glass,
    };
  }, [s]);

  const cast = true;
  const recv = true;

  if (type === "tree") {
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.36, 10]} />
          <primitive object={mats.trunk} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.22, 16, 14]} />
          <primitive object={mats.leaf} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.12, 0.42, 0.08]}>
          <sphereGeometry args={[0.14, 14, 12]} />
          <primitive object={mats.leaf} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "pine") {
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.28, 10]} />
          <primitive object={mats.trunk} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.42, 0]}>
          <coneGeometry args={[0.26, 0.55, 10]} />
          <primitive object={mats.pine} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.60, 0]}>
          <coneGeometry args={[0.18, 0.42, 10]} />
          <primitive object={mats.pine} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "house") {
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.20, 0]}>
          <boxGeometry args={[0.5, 0.40, 0.42]} />
          <primitive object={mats.house} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.50, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.42, 0.34, 4]} />
          <primitive object={mats.roof} attach="material" />
        </mesh>
        {/* Door */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.12, 0.22]}>
          <boxGeometry args={[0.12, 0.18, 0.03]} />
          <primitive object={mats.stone} attach="material" />
        </mesh>
        {/* Window */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.16, 0.26, 0.22]}>
          <boxGeometry args={[0.12, 0.12, 0.03]} />
          <primitive object={mats.glass} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "castle") {
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.22, 0]}>
          <boxGeometry args={[0.62, 0.44, 0.50]} />
          <primitive object={mats.stone} attach="material" />
        </mesh>

        {/* Towers */}
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} castShadow={cast} receiveShadow={recv} position={[x, 0.32, 0.16]}>
            <cylinderGeometry args={[0.12, 0.14, 0.64, 12]} />
            <primitive object={mats.stone} attach="material" />
          </mesh>
        ))}

        {/* Flags */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.24, 0.78, 0.16]}>
          <boxGeometry args={[0.03, 0.20, 0.03]} />
          <primitive object={mats.stone} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.30, 0.86, 0.16]}>
          <boxGeometry args={[0.14, 0.08, 0.02]} />
          <primitive object={mats.roof} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "cloud") {
    const o = 0.05 + s * 0.05;
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.22 + o, 16, 14]} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[-0.20, 0.24, 0.08]}>
          <sphereGeometry args={[0.17, 14, 12]} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.22, 0.22, 0.06]}>
          <sphereGeometry args={[0.18, 14, 12]} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.00, 0.18, 0.12]}>
          <sphereGeometry args={[0.16, 14, 12]} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "mountain") {
    const snow = clamp(0.30 + s * 0.25, 0.25, 0.65);
    return (
      <group {...props} scale={worldScale}>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.22, 0]}>
          <coneGeometry args={[0.42, 0.80, 6]} />
          <primitive object={mats.stone} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.56, 0]}>
          <coneGeometry args={[0.24, 0.36, 6]} />
          <primitive object={mats.snow} attach="material" />
        </mesh>
        {/* Snow cap highlight */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.06, 0.48, 0.05]} rotation={[0, 0.5, 0]}>
          <sphereGeometry args={[0.12 * snow, 10, 8]} />
          <primitive object={mats.snow} attach="material" />
        </mesh>
      </group>
    );
  }

  // flower
  return (
    <group {...props} scale={worldScale}>
      <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.36, 8]} />
        <primitive object={mats.stem} attach="material" />
      </mesh>
      <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <primitive object={mats.flower} attach="material" />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow={cast} receiveShadow={recv} position={[Math.cos(a) * 0.10, 0.36, Math.sin(a) * 0.10]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <primitive object={mats.flower} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}
