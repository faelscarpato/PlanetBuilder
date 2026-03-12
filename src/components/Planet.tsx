import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { PlacedItem, WeatherType, TimeOfDay } from "../types";
import { ItemModel } from "./PlanetItems3D";

interface PlanetProps {
  size: number; // diameter in px
  rotation: number; // degrees
  items: PlacedItem[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  performanceMode: boolean;

  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onItemClick: (id: string) => void;

  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function makePlanetTexture(opts: { night: boolean; seed?: number }) {
  const { night, seed = 7 } = opts;
  const W = 512;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Deterministic RNG
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  // Base ocean
  ctx.fillStyle = night ? "#0A1730" : "#0EA5E9";
  ctx.fillRect(0, 0, W, H);

  // Latitudinal shading (poles darker)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, night ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.12)");
  g.addColorStop(0.5, "rgba(0,0,0,0)");
  g.addColorStop(1, night ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.14)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Land blobs
  const land = night ? "#1E3A5F" : "#22C55E";
  const land2 = night ? "#15294A" : "#16A34A";
  for (let i = 0; i < 120; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 14 + rnd() * 36;
    const c = rnd() > 0.5 ? land : land2;
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Beach-ish highlight
  ctx.globalAlpha = night ? 0.08 : 0.14;
  ctx.fillStyle = "#FDE68A";
  for (let i = 0; i < 80; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 6 + rnd() * 14;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Subtle noise
  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rnd() - 0.5) * (night ? 12 : 18);
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function makeNoiseMap(size = 256, seed = 11) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };

  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 180 + rnd() * 75;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function ItemOnSphere({
  item,
  radius,
  onItemClick,
}: {
  item: PlacedItem;
  radius: number;
  onItemClick: (id: string) => void;
}) {
  const lon = degToRad(item.angle);
  const lat = degToRad(item.lat);

  // Spherical coords (camera looks toward origin from +Z)
  const x = radius * Math.cos(lat) * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.cos(lon);

  const normal = useMemo(() => new THREE.Vector3(x, y, z).normalize(), [x, y, z]);

  // Align up vector to surface normal
  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [normal]);

  // Per-type offset (clouds float, others sit on surface)
  const lift =
    item.type === "cloud" ? 0.28 :
    item.type === "mountain" ? 0.06 :
    item.type === "castle" ? 0.07 :
    item.type === "house" ? 0.05 :
    item.type === "tree" || item.type === "pine" ? 0.05 :
    0.03;

  const pos = useMemo(() => normal.clone().multiplyScalar(radius + lift), [normal, radius, lift]);

  const scale =
    item.type === "castle" ? 0.55 :
    item.type === "house" ? 0.55 :
    item.type === "mountain" ? 0.62 :
    item.type === "cloud" ? 0.72 :
    item.type === "flower" ? 0.55 :
    0.60;

  return (
    <group
      position={pos.toArray() as any}
      quaternion={quat as any}
      onPointerDown={(e) => {
        e.stopPropagation();
        onItemClick(item.id);
      }}
    >
      {/* Extra spin around the normal for variety */}
      <group rotation={[0, (item.angle * Math.PI) / 180, 0]} scale={scale}>
        <ItemModel type={item.type} seedId={item.id} variant="world" />
      </group>
    </group>
  );
}

function Scene({
  rotation,
  items,
  timeOfDay,
  weather,
  performanceMode,
  radius,
  onItemClick,
}: {
  rotation: number;
  items: PlacedItem[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  performanceMode: boolean;
  radius: number;
  onItemClick: (id: string) => void;
}) {
  const night = timeOfDay === "night";

  const colorMap = useMemo(() => makePlanetTexture({ night, seed: 9 }), [night]);
  const noise = useMemo(() => makeNoiseMap(256, night ? 13 : 12), [night]);

  const envPreset = night ? "night" : weather === "storm" ? "warehouse" : weather === "rain" ? "city" : "sunset";

  const ambientI = night ? 0.22 : weather === "storm" ? 0.35 : 0.55;
  const sunI = night ? 0.65 : weather === "storm" ? 1.2 : 1.65;

  const fog = weather !== "clear";
  const fogColor = night ? "#060814" : weather === "storm" ? "#334155" : "#6B7280";

  // Planet material
  const planetMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: colorMap ?? undefined,
      roughness: night ? 0.92 : 0.78,
      metalness: 0.02,
      bumpMap: noise ?? undefined,
      bumpScale: night ? 0.05 : 0.08,
      roughnessMap: noise ?? undefined,
    });
    return m;
  }, [colorMap, noise, night]);

  return (
    <>
      {/* Fog for rain/snow/storm */}
      {fog && <fog attach="fog" args={[fogColor, 2.6, 6.4]} />}

      <ambientLight intensity={ambientI} />
      <directionalLight
        position={[2.6, 3.4, 2.2]}
        intensity={sunI}
        color={night ? "#BBD6FF" : "#FFFFFF"}
        castShadow={!performanceMode}
        shadow-mapSize-width={performanceMode ? 512 : 2048}
        shadow-mapSize-height={performanceMode ? 512 : 2048}
        shadow-radius={performanceMode ? 1 : 4}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Soft fill light */}
      <pointLight position={[-2.2, 0.8, 2.6]} intensity={night ? 0.35 : 0.5} color={night ? "#6D7BFF" : "#A7F3D0"} />

      <Environment preset={envPreset as any} background={false} />

      {/* Planet group rotates around Y */}
      <group rotation={[0, degToRad(rotation), 0]}>
        <mesh receiveShadow={!performanceMode} castShadow={false}>
          <sphereGeometry args={[radius, performanceMode ? 32 : 64, performanceMode ? 28 : 56]} />
          <primitive object={planetMat} attach="material" />
        </mesh>

        {/* Atmosphere */}
        <mesh>
          <sphereGeometry args={[radius * 1.015, 48, 42]} />
          <meshPhysicalMaterial
            color={night ? "#7C3AED" : "#38BDF8"}
            transparent
            opacity={night ? 0.06 : 0.08}
            roughness={1}
            metalness={0}
            transmission={0.2}
            thickness={0.2}
          />
        </mesh>

        {/* Items */}
        {items.map((it) => (
          <ItemOnSphere key={it.id} item={it} radius={radius} onItemClick={onItemClick} />
        ))}
      </group>

      {/* Subtle ground shadow under the planet */}
      {!performanceMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius - 0.35, 0]} receiveShadow>
          <circleGeometry args={[radius * 0.9, 48]} />
          <shadowMaterial opacity={night ? 0.35 : 0.25} />
        </mesh>
      )}
    </>
  );
}

export function Planet({
  size,
  rotation,
  items,
  timeOfDay,
  weather,
  performanceMode,
  onDragOver,
  onDrop,
  onItemClick,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PlanetProps) {
  const DIAMETER = size;
  const radius = size / 220; // normalize to 3D world units (~1.0)

  // Cursor hint when dragging
  const cursor = isDragging ? "copy" : "grab";

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ width: DIAMETER, height: DIAMETER, cursor, touchAction: 'none' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="Planet canvas"
      role="application"
    >
      <Canvas
        shadows={!performanceMode}
        dpr={performanceMode ? 1 : [1, 2]}
        gl={{
          antialias: !performanceMode,
          alpha: true,
          powerPreference: performanceMode ? "low-power" : "high-performance",
        }}
        camera={{ position: [0, 0.05, 3.2], fov: 38, near: 0.1, far: 50 }}
      >
        <Scene
          rotation={rotation}
          items={items}
          timeOfDay={timeOfDay}
          weather={weather}
          performanceMode={performanceMode}
          radius={radius}
          onItemClick={onItemClick}
        />
      </Canvas>

      {/* Soft rim highlight for “lens” feel */}
      {!performanceMode && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -18px 42px rgba(0,0,0,0.35)",
          }}
        />
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 rounded-full pointer-events-none bg-white/5" />
      )}
    </div>
  );
}
