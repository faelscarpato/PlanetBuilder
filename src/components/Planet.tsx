import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { ItemType, InteractionMode, PlacedItem, WeatherType, TimeOfDay } from "../types";
import { ItemModel } from "./PlanetItems3D";

interface PlanetProps {
  size: number; // diameter in px
  rotation: number; // degrees

  items: PlacedItem[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;

  /** Effective mode (includes auto fallback). */
  performanceMode: boolean;

  /** Placement + editing */
  selectedType: ItemType | null;
  interactionMode: InteractionMode;
  onPlace: (type: ItemType, angle: number, lat: number) => void;
  onItemRemove: (id: string) => void;

  /** Optional drag/drop support (desktop). */
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;

  /** Rotation (handled at wrapper level for now) */
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;

  /** Adaptive quality: FPS samples from WebGL scene (throttled). */
  onFpsSample?: (fps: number) => void;
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
  ctx.fillStyle = night ? "#071226" : "#0EA5E9";
  ctx.fillRect(0, 0, W, H);

  // Latitudinal shading (poles darker)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, night ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.14)");
  g.addColorStop(0.5, "rgba(0,0,0,0)");
  g.addColorStop(1, night ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.16)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Land blobs
  const land = night ? "#17365C" : "#22C55E";
  const land2 = night ? "#102A4A" : "#16A34A";
  for (let i = 0; i < 120; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 14 + rnd() * 36;
    const c = rnd() > 0.5 ? land : land2;
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.86;
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
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeNoiseMap(size = 256, strength = 12) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * strength * 2;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function FpsMonitor({ onSample }: { onSample: (fps: number) => void }) {
  const ema = useRef(60);
  const last = useRef(0);
  useFrame((state, delta) => {
    const fps = 1 / Math.max(0.0001, delta);
    ema.current = ema.current * 0.9 + fps * 0.1;
    const t = state.clock.elapsedTime;
    if (t - last.current > 0.5) {
      last.current = t;
      onSample(ema.current);
    }
  });
  return null;
}

function ItemOnSphere({
  item,
  radius,
  interactionMode,
  onItemRemove,
}: {
  item: PlacedItem;
  radius: number;
  interactionMode: InteractionMode;
  onItemRemove: (id: string) => void;
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

  // Per-type lift (bigger in v2 so silhouettes “break” the planet circle)
  const lift =
    item.type === "cloud" ? 0.38 :
    item.type === "mountain" ? 0.10 :
    item.type === "castle" ? 0.11 :
    item.type === "house" ? 0.09 :
    item.type === "tree" || item.type === "pine" ? 0.10 :
    0.08;

  const pos = useMemo(() => normal.clone().multiplyScalar(radius + lift), [normal, radius, lift]);

  const scale =
    item.type === "castle" ? 0.65 :
    item.type === "house" ? 0.62 :
    item.type === "mountain" ? 0.72 :
    item.type === "cloud" ? 0.82 :
    item.type === "flower" ? 0.62 :
    0.66;

  return (
    <group
      position={pos.toArray() as any}
      quaternion={quat as any}
      onClick={(e) => {
        // In “place” mode: prevent accidental removal & prevent stacking by accidental taps.
        e.stopPropagation();
        if (interactionMode !== "remove") return;
        onItemRemove(item.id);
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
  selectedType,
  interactionMode,
  onPlace,
  onItemRemove,
}: {
  rotation: number;
  items: PlacedItem[];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  performanceMode: boolean;
  radius: number;

  selectedType: ItemType | null;
  interactionMode: InteractionMode;
  onPlace: (type: ItemType, angle: number, lat: number) => void;
  onItemRemove: (id: string) => void;
}) {
  const night = timeOfDay === "night";

  const colorMap = useMemo(() => makePlanetTexture({ night, seed: 9 }), [night]);
  const noise = useMemo(() => makeNoiseMap(256, night ? 13 : 12), [night]);

  const envPreset = night ? "night" : weather === "storm" ? "warehouse" : weather === "rain" ? "city" : "sunset";

  const ambientI = night ? 0.24 : weather === "storm" ? 0.35 : 0.55;
  const sunI = night ? 0.70 : weather === "storm" ? 1.25 : 1.70;

  const fog = weather !== "clear";
  const fogColor = night ? "#050712" : weather === "storm" ? "#334155" : "#6B7280";

  // Planet material
  const planetMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: colorMap ?? undefined,
      roughness: night ? 0.94 : 0.80,
      metalness: 0.02,
      bumpMap: noise ?? undefined,
      bumpScale: night ? 0.06 : 0.09,
      roughnessMap: noise ?? undefined,
      envMapIntensity: night ? 0.6 : 0.8,
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

      {/* Soft fill */}
      <pointLight position={[-2.2, 0.8, 2.6]} intensity={night ? 0.35 : 0.5} color={night ? "#6D7BFF" : "#A7F3D0"} />

      <Environment preset={envPreset as any} background={false} />

      {/* Planet group rotates around Y */}
      <group rotation={[0, degToRad(rotation), 0]}>
        <mesh
          receiveShadow={!performanceMode}
          castShadow={false}
          onClick={(e) => {
            if (!selectedType || interactionMode !== "place") return;
            e.stopPropagation();

            // Convert clicked point (world) back into the “unrotated” planet-local reference,
            // so the stored angle/lat remains stable while the planet spins.
            const p = e.point.clone();
            p.applyAxisAngle(new THREE.Vector3(0, 1, 0), -degToRad(rotation));
            const n = p.normalize();

            const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)));
            const ang = (THREE.MathUtils.radToDeg(Math.atan2(n.x, n.z)) + 360) % 360;

            onPlace(selectedType, ang, THREE.MathUtils.clamp(lat, -38, 38));
          }}
        >
          <sphereGeometry args={[radius, performanceMode ? 32 : 72, performanceMode ? 28 : 64]} />
          <primitive object={planetMat} attach="material" />
        </mesh>

        {/* Atmosphere */}
        <mesh>
          <sphereGeometry args={[radius * 1.02, 48, 42]} />
          <meshPhysicalMaterial
            color={night ? "#7C3AED" : "#38BDF8"}
            transparent
            opacity={night ? 0.055 : 0.075}
            roughness={1}
            metalness={0}
            transmission={0.22}
            thickness={0.22}
          />
        </mesh>

        {/* Items */}
        {items.map((it) => (
          <ItemOnSphere
            key={it.id}
            item={it}
            radius={radius}
            interactionMode={interactionMode}
            onItemRemove={onItemRemove}
          />
        ))}
      </group>

      {/* Subtle ground shadow under the planet */}
      {!performanceMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius - 0.38, 0]} receiveShadow>
          <circleGeometry args={[radius * 0.92, 48]} />
          <shadowMaterial opacity={night ? 0.36 : 0.26} />
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
  selectedType,
  interactionMode,
  onPlace,
  onItemRemove,
  onDragOver,
  onDrop,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFpsSample,
}: PlanetProps) {
  const DIAMETER = size;
  const radius = size / 220; // normalize to 3D world units (~1.0)

  const cursor =
    interactionMode === "remove" ? "not-allowed" :
    selectedType ? "crosshair" :
    isDragging ? "copy" :
    "grab";

  return (
    <div
      className="relative rounded-full"
      style={{ width: DIAMETER, height: DIAMETER, cursor, touchAction: "none" }}
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
        {onFpsSample && <FpsMonitor onSample={onFpsSample} />}

        <Scene
          rotation={rotation}
          items={items}
          timeOfDay={timeOfDay}
          weather={weather}
          performanceMode={performanceMode}
          radius={radius}
          selectedType={selectedType}
          interactionMode={interactionMode}
          onPlace={onPlace}
          onItemRemove={onItemRemove}
        />
      </Canvas>

      {/* Lens rim highlight (kept circular, but DOES NOT clip the canvas — items can “pop” outside) */}
      {!performanceMode && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -18px 42px rgba(0,0,0,0.35)",
          }}
        />
      )}

      {/* Drag overlay */}
      {isDragging && <div className="absolute inset-0 rounded-full pointer-events-none bg-white/5" />}

      {/* Placement hint (mobile-first): very subtle. */}
      {selectedType && interactionMode === "place" && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full bg-black/35 text-white/90 backdrop-blur-sm pointer-events-none">
          Tap the planet to place
        </div>
      )}

      {interactionMode === "remove" && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full bg-rose-500/30 text-white/95 backdrop-blur-sm pointer-events-none">
          Remove mode: tap an item
        </div>
      )}
    </div>
  );
}
