import React, { useMemo } from "react";
import * as THREE from "three";
import { GroupProps } from "@react-three/fiber";
import { ItemType } from "../types";

/**
 * v2_bolder: Low‑poly “miniature” assets with real PBR lighting + shadows,
 * plus a lightweight “baked AO” approximation (aoMap) for extra depth.
 *
 * No external model files required (keeps the project self-contained).
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

/** Ensure uv2 exists so aoMap works (uses uv as uv2). */
const ensureUv2 = (g: THREE.BufferGeometry) => {
  const geo = g as any;
  const uv = geo?.attributes?.uv;
  if (!uv) return;
  if (geo.attributes.uv2) return;
  geo.setAttribute("uv2", new THREE.BufferAttribute(uv.array, 2));
};

function useAOTex(key: string) {
  return useMemo(() => {
    const W = 128;
    const H = 128;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // AO: lighter center, darker edges (subtle). Works well as “baked” depth boost.
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 6, W * 0.5, H * 0.55, W * 0.6);
    g.addColorStop(0.0, "rgb(245,245,245)");
    g.addColorStop(0.55, "rgb(180,180,180)");
    g.addColorStop(1.0, "rgb(120,120,120)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Slight vignette for extra grounding
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.75, W * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.anisotropy = 2;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    // Keep reference stable per key (hook memoized)
    return tex;
  }, [key]);
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
  const aoTex = useAOTex(`ao-${type}`);

  const worldScale = variant === "thumb" ? 1.0 : 1.0;

  // Shared materials (reused to reduce allocations)
  const mats = useMemo(() => {
    const std = (c: string, rough = 0.72, metal = 0.02, ao = 0.7, env = 0.65) =>
      new THREE.MeshStandardMaterial({
        color: color(c),
        roughness: rough,
        metalness: metal,
        aoMap: aoTex ?? undefined,
        aoMapIntensity: ao,
        envMapIntensity: env,
        flatShading: true,
      });

    const phys = (c: string, rough = 0.55, metal = 0.02, clear = 0.35, ao = 0.75) =>
      new THREE.MeshPhysicalMaterial({
        color: color(c),
        roughness: rough,
        metalness: metal,
        clearcoat: clear,
        clearcoatRoughness: 0.45,
        aoMap: aoTex ?? undefined,
        aoMapIntensity: ao,
        envMapIntensity: 0.9,
        flatShading: true,
      });

    const glass = new THREE.MeshPhysicalMaterial({
      color: color("#E6F7FF"),
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.72,
      thickness: 0.6,
      ior: 1.35,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.1,
    });

    const roofChoices = ["#D95B57", "#C04C6A", "#B2483F", "#E11D48"];
    const roofC = roofChoices[Math.floor(s * roofChoices.length)];

    return {
      soil: std("#4B2E19", 0.95, 0.0, 0.85, 0.2),
      trunk: std("#7C4A2D", 0.92, 0.02, 0.85, 0.25),
      leaf: phys("#2CCB6B", 0.75, 0.02, 0.25, 0.85),
      pine: phys("#1FAA59", 0.78, 0.02, 0.22, 0.85),
      house: std("#F4F1EA", 0.70, 0.02, 0.75, 0.55),
      roof: phys(roofC, 0.62, 0.02, 0.45, 0.8),
      stone: std("#98A6B4", 0.92, 0.03, 0.9, 0.4),
      stoneDark: std("#6B7A89", 0.96, 0.03, 0.95, 0.35),
      cloud: std("#FFFFFF", 0.98, 0.0, 0.55, 0.35),
      snow: std("#F8FAFC", 0.80, 0.0, 0.65, 0.35),
      stem: std("#16A34A", 0.88, 0.0, 0.8, 0.25),
      flower: phys(["#F97316", "#F43F5E", "#FB7185"][Math.floor(s * 3)], 0.50, 0.02, 0.65, 0.85),
      glass,
    };
  }, [aoTex, s]);

  const cast = true;
  const recv = true;

  // Slightly larger vertical proportions so silhouettes “pop” outside the planet circle.
  const yBoost =
    type === "cloud" ? 1.05 :
    type === "mountain" ? 1.08 :
    type === "castle" ? 1.08 :
    type === "house" ? 1.06 :
    1.04;

  // Base “puck” to ground assets onto the sphere (also improves AO feel).
  const Base = ({ r = 0.30, h = 0.06 }: { r?: number; h?: number }) => (
    <mesh castShadow={cast} receiveShadow={recv} position={[0, h * 0.5, 0]}>
      <cylinderGeometry args={[r, r * 0.92, h, 14]} onUpdate={ensureUv2 as any} />
      <primitive object={mats.soil} attach="material" />
    </mesh>
  );

  if (type === "tree") {
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        <Base r={0.28} h={0.06} />
        {/* trunk */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.44, 10]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.trunk} attach="material" />
        </mesh>
        {/* canopy (stacked blobs = more relief) */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.62, 0]}>
          <dodecahedronGeometry args={[0.22, 0]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.leaf} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.16, 0.56, 0.10]}>
          <dodecahedronGeometry args={[0.16, 0]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.leaf} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[-0.14, 0.54, 0.12]}>
          <dodecahedronGeometry args={[0.14, 0]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.leaf} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "pine") {
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        <Base r={0.27} h={0.06} />
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.38, 10]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.trunk} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.58, 0]}>
          <coneGeometry args={[0.30, 0.62, 10]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.pine} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.80, 0]}>
          <coneGeometry args={[0.20, 0.48, 10]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.pine} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "house") {
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        <Base r={0.34} h={0.06} />
        {/* body */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.24, 0]}>
          <boxGeometry args={[0.56, 0.44, 0.48]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.house} attach="material" />
        </mesh>
        {/* roof */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.56, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.48, 0.40, 4]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.roof} attach="material" />
        </mesh>
        {/* door */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.12, 0.25]}>
          <boxGeometry args={[0.14, 0.20, 0.04]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.stoneDark} attach="material" />
        </mesh>
        {/* window */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.18, 0.28, 0.25]}>
          <boxGeometry args={[0.13, 0.13, 0.04]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.glass} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "castle") {
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        <Base r={0.38} h={0.06} />
        {/* keep */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.26, 0]}>
          <boxGeometry args={[0.70, 0.50, 0.56]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.stone} attach="material" />
        </mesh>

        {/* towers */}
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} castShadow={cast} receiveShadow={recv} position={[x, 0.38, 0.18]}>
            <cylinderGeometry args={[0.13, 0.15, 0.74, 12]} onUpdate={ensureUv2 as any} />
            <primitive object={mats.stoneDark} attach="material" />
          </mesh>
        ))}

        {/* crenellation */}
        {[-0.24, 0, 0.24].map((x) => (
          <mesh key={x} castShadow={cast} receiveShadow={recv} position={[x, 0.55, -0.20]}>
            <boxGeometry args={[0.12, 0.10, 0.12]} onUpdate={ensureUv2 as any} />
            <primitive object={mats.stoneDark} attach="material" />
          </mesh>
        ))}

        {/* flag */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.30, 0.84, 0.18]}>
          <boxGeometry args={[0.03, 0.22, 0.03]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.stoneDark} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.37, 0.92, 0.18]}>
          <boxGeometry args={[0.18, 0.10, 0.02]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.roof} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "cloud") {
    const o = 0.05 + s * 0.06;
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        {/* clouds have no base puck */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.34, 0]}>
          <sphereGeometry args={[0.24 + o, 16, 14]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[-0.22, 0.30, 0.08]}>
          <sphereGeometry args={[0.18, 14, 12]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.24, 0.28, 0.06]}>
          <sphereGeometry args={[0.19, 14, 12]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.02, 0.24, 0.14]}>
          <sphereGeometry args={[0.17, 14, 12]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.cloud} attach="material" />
        </mesh>
      </group>
    );
  }

  if (type === "mountain") {
    const snow = clamp(0.30 + s * 0.25, 0.25, 0.65);
    return (
      <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
        <Base r={0.36} h={0.06} />
        {/* main peak */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.30, 0]}>
          <coneGeometry args={[0.48, 0.92, 6]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.stoneDark} attach="material" />
        </mesh>
        {/* ridge */}
        <mesh castShadow={cast} receiveShadow={recv} position={[-0.18, 0.24, -0.10]} rotation={[0, 0.35, 0]}>
          <coneGeometry args={[0.32, 0.68, 6]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.stone} attach="material" />
        </mesh>
        {/* snow cap */}
        <mesh castShadow={cast} receiveShadow={recv} position={[0.02, 0.64, 0]}>
          <coneGeometry args={[0.28, 0.42, 6]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.snow} attach="material" />
        </mesh>
        <mesh castShadow={cast} receiveShadow={recv} position={[0.08, 0.56, 0.06]} rotation={[0, 0.5, 0]}>
          <sphereGeometry args={[0.14 * snow, 10, 8]} onUpdate={ensureUv2 as any} />
          <primitive object={mats.snow} attach="material" />
        </mesh>
      </group>
    );
  }

  // flower
  return (
    <group {...props} scale={[worldScale, worldScale * yBoost, worldScale]}>
      <Base r={0.24} h={0.05} />
      <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 8]} onUpdate={ensureUv2 as any} />
        <primitive object={mats.stem} attach="material" />
      </mesh>
      <mesh castShadow={cast} receiveShadow={recv} position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.08, 12, 10]} onUpdate={ensureUv2 as any} />
        <primitive object={mats.flower} attach="material" />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow={cast}
            receiveShadow={recv}
            position={[Math.cos(a) * 0.13, 0.44, Math.sin(a) * 0.13]}
          >
            <sphereGeometry args={[0.055, 12, 10]} onUpdate={ensureUv2 as any} />
            <primitive object={mats.flower} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}
