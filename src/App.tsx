import { useState, useCallback, useRef } from "react";
import { InteractionMode, ItemType, PlacedItem, QualityPreset, WeatherType, TimeOfDay } from "./types";
import { Planet } from "./components/Planet";
import { Toolbar } from "./components/Toolbar";
import { StarField } from "./components/StarField";
import { usePlanetRotation } from "./hooks/usePlanetRotation";
import { usePlanetSize } from "./hooks/usePlanetSize";

// Pre-built starter planet
const INITIAL_ITEMS: PlacedItem[] = [
  { id: "i1", type: "tree", angle: 20, lat: 15 },
  { id: "i2", type: "tree", angle: 35, lat: -10 },
  { id: "i3", type: "pine", angle: 60, lat: 20 },
  { id: "i4", type: "pine", angle: 80, lat: -18 },
  { id: "i5", type: "house", angle: 100, lat: 8 },
  { id: "i6", type: "house", angle: 150, lat: -5 },
  { id: "i7", type: "castle", angle: 200, lat: 12 },
  { id: "i8", type: "mountain", angle: 240, lat: -20 },
  { id: "i9", type: "mountain", angle: 260, lat: 5 },
  { id: "i10", type: "cloud", angle: 300, lat: 30 },
  { id: "i11", type: "cloud", angle: 330, lat: -30 },
  { id: "i12", type: "flower", angle: 45, lat: -25 },
  { id: "i13", type: "flower", angle: 130, lat: 22 },
  { id: "i14", type: "tree", angle: 310, lat: 10 },
  { id: "i15", type: "pine", angle: 190, lat: -15 },
];

function coordsFromDrop(e: React.DragEvent, el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function coordsToAngleLat(
  x: number,
  y: number,
  rotation: number,
  R: number
): { angle: number; lat: number } | null {
  const cx = R,
    cy = R;
  const dx = x - cx,
    dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > R) return null;

  // Inverse sphere projection (2D helper for desktop drag/drop)
  const normX = dx / R; // cos(lat)*sin(angle)
  const normY = -dy / R; // sin(lat)

  const latRad = Math.asin(Math.max(-1, Math.min(1, normY)));
  const cosLat = Math.cos(latRad);
  const sinAngle = cosLat < 0.001 ? 0 : normX / cosLat;
  const angleRad = Math.asin(Math.max(-1, Math.min(1, sinAngle)));

  const latDeg = (latRad * 180) / Math.PI;
  let angleDeg = (angleRad * 180) / Math.PI + rotation;
  if (angleDeg < 0) angleDeg += 360;
  angleDeg = angleDeg % 360;

  return { angle: angleDeg, lat: latDeg };
}

export function App() {
  const [items, setItems] = useState<PlacedItem[]>(INITIAL_ITEMS);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [weather, setWeather] = useState<WeatherType>("clear");

  // v2: Mobile-first placement
  const [selectedType, setSelectedType] = useState<ItemType | null>("tree");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("place");

  // Performance heuristics: good defaults for low-end mobile
  const initialPerf = (() => {
    try {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
      const dm = (navigator as any).deviceMemory ?? 8;
      const hc = navigator.hardwareConcurrency ?? 8;
      return reduceMotion || dm <= 4 || hc <= 4;
    } catch {
      return false;
    }
  })();

  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("auto");
  const [autoPerf, setAutoPerf] = useState<boolean>(initialPerf);
  const [fps, setFps] = useState<number | null>(null);

  const lowSince = useRef<number | null>(null);
  const highSince = useRef<number | null>(null);

  const effectivePerformanceMode =
    qualityPreset === "performance" ? true : qualityPreset === "quality" ? false : autoPerf;

  const dragTypeRef = useRef<ItemType | null>(null);
  const { rotation, isDragging, onPointerDown, onPointerMove, onPointerUp } = usePlanetRotation(0.12);
  const { size: planetSize, radius: planetR } = usePlanetSize();

  const isNight = timeOfDay === "night";

  const handleFpsSample = useCallback(
    (v: number) => {
      setFps(v);
      if (qualityPreset !== "auto") return;

      // Hysteresis so we don't “flip-flop”
      const now = performance.now();
      if (v < 38) {
        highSince.current = null;
        if (!lowSince.current) lowSince.current = now;
        if (now - lowSince.current > 1500) setAutoPerf(true);
      } else if (v > 55) {
        lowSince.current = null;
        if (!highSince.current) highSince.current = now;
        if (now - highSince.current > 8000) setAutoPerf(false);
      } else {
        lowSince.current = null;
        highSince.current = null;
      }
    },
    [qualityPreset]
  );

  const handleSelectType = useCallback((t: ItemType) => {
    setInteractionMode("place");
    setSelectedType((prev) => (prev === t ? null : t));
  }, []);

  const handleInteractionModeChange = useCallback((m: InteractionMode) => {
    setInteractionMode(m);
    if (m === "remove") setSelectedType(null);
  }, []);

  const handlePlace = useCallback((type: ItemType, angle: number, lat: number) => {
    const newItem: PlacedItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      type,
      angle,
      lat: Math.max(-38, Math.min(38, lat)),
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const handleItemRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleTimeToggle = useCallback(() => {
    setTimeOfDay((prev) => (prev === "day" ? "night" : "day"));
  }, []);

  const handleClear = useCallback(() => {
    setItems([]);
  }, []);

  // Desktop drag & drop remains supported (optional).
  const handleDragStart = useCallback((e: React.DragEvent, type: ItemType) => {
    dragTypeRef.current = type;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", type);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = (dragTypeRef.current ?? e.dataTransfer.getData("text/plain")) as ItemType;
      if (!type) return;

      const el = e.currentTarget as HTMLDivElement;
      const { x, y } = coordsFromDrop(e, el);
      const result = coordsToAngleLat(x, y, rotation, planetR);
      if (!result) return;

      handlePlace(type, result.angle, result.lat);
      dragTypeRef.current = null;
    },
    [rotation, planetR, handlePlace]
  );

  const orbitSize = Math.round(planetSize * 1.13);
  const orbitBorder = isNight ? "border-indigo-400/20" : "border-white/25";

  const bgGradient = isNight ? "from-slate-950 via-slate-900 to-indigo-950" : "from-sky-200 via-sky-100 to-indigo-200";

  const panel =
    `rounded-2xl p-5 w-64 border shadow-lg ` +
    (isNight ? "bg-slate-950/55 border-white/15 text-slate-100" : "bg-white/75 border-white/70 text-slate-900") +
    (effectivePerformanceMode ? "" : " backdrop-blur-sm");

  return (
    <div className={`min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${bgGradient} transition-all duration-1000`}>
      {/* Star field */}
      <StarField isNight={isNight} />

      {/* Background atmospheric clouds */}
      {!isNight && weather !== "clear" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-white/20 ${effectivePerformanceMode ? "blur-md opacity-40" : "blur-2xl"}`}
              style={{
                width: `${200 + i * 80}px`,
                height: `${80 + i * 30}px`,
                left: `${(i * 23) % 80}%`,
                top: `${10 + (i * 15) % 50}%`,
                animation: `drift ${8 + i * 3}s linear infinite`,
                animationDelay: `${i * -2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient glow */}
      <div
        className={`absolute w-[600px] h-[600px] rounded-full ${effectivePerformanceMode ? "blur-[60px]" : "blur-[120px]"} pointer-events-none transition-colors duration-1000 ${
          isNight ? "bg-indigo-900/30" : "bg-sky-300/25"
        }`}
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      />

      {/* Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-6 py-8 w-full max-w-6xl">
        {/* Left: Toolbar */}
        <div className="lg:order-1 order-2 w-full lg:w-64 flex justify-center lg:justify-start">
          <Toolbar
            timeOfDay={timeOfDay}
            weather={weather}
            performanceMode={effectivePerformanceMode}
            qualityPreset={qualityPreset}
            fps={fps}
            selectedType={selectedType}
            interactionMode={interactionMode}
            onSelectType={handleSelectType}
            onInteractionModeChange={handleInteractionModeChange}
            onTimeToggle={handleTimeToggle}
            onWeatherChange={setWeather}
            onQualityPresetChange={setQualityPreset}
            onDragStart={handleDragStart}
            onClear={handleClear}
            itemCount={items.length}
          />
        </div>

        {/* Center: Planet */}
        <div className="lg:order-2 order-1 flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Orbit ring */}
            <div
              className={`absolute rounded-full border-2 pointer-events-none transition-colors duration-1000 ${orbitBorder}`}
              style={{
                width: `${orbitSize}px`,
                height: `${orbitSize}px`,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%) rotateX(75deg)",
                borderStyle: "dashed",
              }}
            />

            <Planet
              size={planetSize}
              rotation={rotation}
              performanceMode={effectivePerformanceMode}
              items={items}
              timeOfDay={timeOfDay}
              weather={weather}
              selectedType={selectedType}
              interactionMode={interactionMode}
              onPlace={handlePlace}
              onItemRemove={handleItemRemove}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={isDragging}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onFpsSample={handleFpsSample}
            />

            {/* Shadow beneath planet */}
            {!effectivePerformanceMode && (
              <div
                className="absolute pointer-events-none"
                style={{
                  width: `${Math.round(planetSize * 0.84)}px`,
                  height: `${Math.round(planetSize * 0.10)}px`,
                  bottom: `${Math.round(-planetSize * 0.08)}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background:
                    "radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 35%, transparent 72%)",
                  filter: `blur(${Math.max(8, Math.round(planetSize * 0.02))}px)`,
                }}
              />
            )}

            {/* Mobile hint */}
            <div className="lg:hidden mt-3 text-center text-xs text-white/80">
              <span className="font-semibold">Tip:</span> select an item and <span className="font-semibold">tap the planet</span>.
              Use <span className="font-semibold">Remove</span> mode to delete.
            </div>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="lg:order-3 order-3 w-full lg:w-64 flex flex-col gap-4 items-center lg:items-end">
          <div className={panel}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              🪐 Planet Stats
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isNight ? "text-slate-300" : "text-slate-600"}>Trees</span>
                <span className="font-bold">{items.filter((i) => i.type === "tree" || i.type === "pine").length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? "text-slate-300" : "text-slate-600"}>Buildings</span>
                <span className="font-bold">{items.filter((i) => i.type === "house" || i.type === "castle").length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? "text-slate-300" : "text-slate-600"}>Clouds</span>
                <span className="font-bold">{items.filter((i) => i.type === "cloud").length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? "text-slate-300" : "text-slate-600"}>Mountains</span>
                <span className="font-bold">{items.filter((i) => i.type === "mountain").length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? "text-slate-300" : "text-slate-600"}>Flowers</span>
                <span className="font-bold">{items.filter((i) => i.type === "flower").length}</span>
              </div>
              <hr className={isNight ? "border-white/10" : "border-slate-200"} />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{items.length}</span>
              </div>
            </div>
          </div>

          <div className={panel}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              🌍 World Status
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isNight ? "🌙" : "☀️"}</span>
                <span className={isNight ? "text-slate-200" : "text-slate-700"}>{isNight ? "Night time" : "Day time"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {weather === "clear" ? "🌤️" : weather === "rain" ? "🌧️" : weather === "snow" ? "❄️" : "⛈️"}
                </span>
                <span className={isNight ? "text-slate-200" : "text-slate-700"}>
                  {weather === "clear" ? "Clear" : weather === "rain" ? "Rain" : weather === "snow" ? "Snow" : "Storm"}
                </span>
              </div>

              <div className="pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={isNight ? "text-slate-300" : "text-slate-600"}>Quality</span>
                  <span className="font-semibold">{qualityPreset === "auto" ? (autoPerf ? "Performance (auto)" : "Quality (auto)") : qualityPreset}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={isNight ? "text-slate-300" : "text-slate-600"}>FPS</span>
                  <span className="font-semibold">{fps ? Math.round(fps) : "—"}</span>
                </div>
              </div>

              <hr className={isNight ? "border-white/10" : "border-slate-200"} />
              <p className={isNight ? "text-slate-300" : "text-slate-600"}>
                {interactionMode === "remove" ? "Remove mode enabled." : selectedType ? `Ready to place: ${selectedType}` : "Select an item to place."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
