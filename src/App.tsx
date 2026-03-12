import { useState, useCallback, useRef } from 'react';
import { PlacedItem, ItemType, WeatherType, TimeOfDay } from './types';
import { Planet } from './components/Planet';
import { Toolbar } from './components/Toolbar';
import { StarField } from './components/StarField';
import { usePlanetRotation } from './hooks/usePlanetRotation';
import { usePlanetSize } from './hooks/usePlanetSize';

// Pre-built starter planet
const INITIAL_ITEMS: PlacedItem[] = [
  { id: 'i1',  type: 'tree',     angle: 20,  lat: 15  },
  { id: 'i2',  type: 'tree',     angle: 35,  lat: -10 },
  { id: 'i3',  type: 'pine',     angle: 60,  lat: 20  },
  { id: 'i4',  type: 'pine',     angle: 80,  lat: -18 },
  { id: 'i5',  type: 'house',    angle: 100, lat: 8   },
  { id: 'i6',  type: 'house',    angle: 150, lat: -5  },
  { id: 'i7',  type: 'castle',   angle: 200, lat: 12  },
  { id: 'i8',  type: 'mountain', angle: 240, lat: -20 },
  { id: 'i9',  type: 'mountain', angle: 260, lat: 5   },
  { id: 'i10', type: 'cloud',    angle: 300, lat: 30  },
  { id: 'i11', type: 'cloud',    angle: 330, lat: -30 },
  { id: 'i12', type: 'flower',   angle: 45,  lat: -25 },
  { id: 'i13', type: 'flower',   angle: 130, lat: 22  },
  { id: 'i14', type: 'tree',     angle: 310, lat: 10  },
  { id: 'i15', type: 'pine',     angle: 190, lat: -15 },
];


function coordsFromDrop(e: React.DragEvent, el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function coordsToAngleLat(x: number, y: number, rotation: number, R: number): { angle: number; lat: number } | null {
  const cx = R, cy = R;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > R) return null;

  // Inverse sphere projection
  const normX = dx / R; // cos(lat)*sin(angle)
  const normY = -dy / R; // sin(lat)

  const latRad = Math.asin(Math.max(-1, Math.min(1, normY)));
  const cosLat = Math.cos(latRad);
  const sinAngle = cosLat < 0.001 ? 0 : normX / cosLat;
  const angleRad = Math.asin(Math.max(-1, Math.min(1, sinAngle)));

  const latDeg = latRad * 180 / Math.PI;
  let angleDeg = angleRad * 180 / Math.PI + rotation;
  if (angleDeg < 0) angleDeg += 360;
  angleDeg = angleDeg % 360;

  return { angle: angleDeg, lat: latDeg };
}

export function App() {
  const [items, setItems] = useState<PlacedItem[]>(INITIAL_ITEMS);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [weather, setWeather] = useState<WeatherType>('clear');

  // Performance mode: reduces blur/backdrop + disables real-time shadows (useful on low-end mobile).
  const initialPerf = (() => {
    try {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
      const dm = (navigator as any).deviceMemory ?? 8;
      const hc = navigator.hardwareConcurrency ?? 8;
      return reduceMotion || dm <= 4 || hc <= 4;
    } catch {
      return false;
    }
  })();
  const [performanceMode, setPerformanceMode] = useState<boolean>(initialPerf);

  const dragTypeRef = useRef<ItemType | null>(null);
  const { rotation, isDragging, onPointerDown, onPointerMove, onPointerUp } = usePlanetRotation(0.12);
  const { size: planetSize, radius: planetR } = usePlanetSize();

  const isNight = timeOfDay === 'night';

  const handleDragStart = useCallback((e: React.DragEvent, type: ItemType) => {
    dragTypeRef.current = type;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = (dragTypeRef.current ?? e.dataTransfer.getData('text/plain')) as ItemType;
    if (!type) return;

    const el = e.currentTarget as HTMLDivElement;
    const { x, y } = coordsFromDrop(e, el);
    const result = coordsToAngleLat(x, y, rotation, planetR);
    if (!result) return;

    const newItem: PlacedItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      type,
      angle: result.angle,
      lat: Math.max(-38, Math.min(38, result.lat)),
    };
    setItems(prev => [...prev, newItem]);
    dragTypeRef.current = null;
  }, [rotation, planetR]);

  const handleItemClick = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleTimeToggle = useCallback(() => {
    setTimeOfDay(prev => prev === 'day' ? 'night' : 'day');
  }, []);

  const handleClear = useCallback(() => {
    setItems([]);
  }, []);

  const orbitSize = Math.round(planetSize * 1.13);
  const orbitBorder = isNight ? 'border-indigo-400/20' : 'border-white/25';

  // Sky gradient colours
  const bgGradient = isNight
    ? 'from-[#0a0618] via-[#0d0a2e] to-[#0a1628]'
    : weather === 'storm'
      ? 'from-slate-700 via-slate-600 to-slate-800'
      : weather === 'rain'
        ? 'from-slate-500 via-slate-400 to-sky-600'
        : 'from-sky-400 via-sky-300 to-blue-400';

  return (
    <div
      className={`min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${bgGradient} transition-all duration-1000`}
    >
      {/* Star field */}
      <StarField isNight={isNight} />

      {/* Background atmospheric clouds */}
      {!isNight && weather !== 'clear' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-white/20 ${performanceMode ? "blur-md opacity-40" : "blur-2xl"}`}
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
        className={`absolute w-[600px] h-[600px] rounded-full ${performanceMode ? 'blur-[60px]' : 'blur-[120px]'} pointer-events-none transition-colors duration-1000 ${isNight ? 'bg-indigo-900/30' : 'bg-sky-300/25'}`}
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 px-6 py-8 w-full max-w-6xl">

        {/* Left: Toolbar */}
        <div className="lg:order-1 order-2 w-full lg:w-64 flex justify-center lg:justify-start">
          <Toolbar
            timeOfDay={timeOfDay}
            weather={weather}
            performanceMode={performanceMode}
            onTimeToggle={handleTimeToggle}
            onWeatherChange={setWeather}
            onPerformanceToggle={() => setPerformanceMode(p => !p)}
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
                width: `${orbitSize}px`, height: `${orbitSize}px`,
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%) rotateX(75deg)',
                borderStyle: 'dashed',
              }}
            />
            <Planet
              size={planetSize}
              rotation={rotation}
              performanceMode={performanceMode}
              items={items}
              timeOfDay={timeOfDay}
              weather={weather}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onItemClick={handleItemClick}
              isDragging={isDragging}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {/* Shadow beneath planet */}
            {!performanceMode && (
              <div
              className="absolute pointer-events-none"
              style={{
              width: `${Math.round(planetSize * 0.84)}px`, height: `${Math.round(planetSize * 0.10)}px`,
              bottom: `${Math.round(-planetSize * 0.08)}px`, left: '50%',
              transform: 'translateX(-50%)',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 35%, transparent 72%)',
              filter: `blur(${Math.max(8, Math.round(planetSize * 0.02))}px)`,
              }}
              />
            )}
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="lg:order-3 order-3 w-full lg:w-64 flex flex-col gap-4 items-center lg:items-end">
          <div className={`rounded-2xl p-5 w-64 ${isNight ? 'bg-white/10 border border-white/15 text-white' : 'bg-white/70 border border-white/60 text-slate-800'} ${performanceMode ? '' : 'backdrop-blur-sm'} shadow-lg`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              🪐 Planet Stats
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Trees</span>
                <span className="font-bold">{items.filter(i => i.type === 'tree' || i.type === 'pine').length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Buildings</span>
                <span className="font-bold">{items.filter(i => i.type === 'house' || i.type === 'castle').length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Clouds</span>
                <span className="font-bold">{items.filter(i => i.type === 'cloud').length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Mountains</span>
                <span className="font-bold">{items.filter(i => i.type === 'mountain').length}</span>
              </div>
              <div className="flex justify-between">
                <span className={isNight ? 'text-slate-400' : 'text-slate-500'}>Flowers</span>
                <span className="font-bold">{items.filter(i => i.type === 'flower').length}</span>
              </div>
              <hr className={isNight ? 'border-white/10' : 'border-slate-200'} />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{items.length}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 w-64 ${isNight ? 'bg-white/10 border border-white/15 text-white' : 'bg-white/70 border border-white/60 text-slate-800'} ${performanceMode ? '' : 'backdrop-blur-sm'} shadow-lg`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              🌍 World Status
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isNight ? '🌙' : '☀️'}</span>
                <span className={isNight ? 'text-slate-300' : 'text-slate-600'}>
                  {isNight ? 'Night time' : 'Day time'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {weather === 'clear' ? '🌤️' : weather === 'rain' ? '🌧️' : weather === 'snow' ? '❄️' : '⛈️'}
                </span>
                <span className={isNight ? 'text-slate-300' : 'text-slate-600'}>
                  {weather === 'clear' ? 'Clear skies' : weather === 'rain' ? 'Rainy' : weather === 'snow' ? 'Snowing' : 'Stormy'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌡️</span>
                <span className={isNight ? 'text-slate-300' : 'text-slate-600'}>
                  {weather === 'snow' ? '-5°C' : weather === 'storm' ? '14°C' : weather === 'rain' ? '18°C' : isNight ? '12°C' : '24°C'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌀</span>
                <span className={isNight ? 'text-slate-300' : 'text-slate-600'}>Rotating</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className={isNight ? 'text-slate-300' : 'text-slate-600'}>
                  {performanceMode ? 'Performance mode' : 'Quality mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Happiness meter */}
          <div className={`rounded-2xl p-5 w-64 ${isNight ? 'bg-white/10 border border-white/15 text-white' : 'bg-white/70 border border-white/60 text-slate-800'} ${performanceMode ? '' : 'backdrop-blur-sm'} shadow-lg`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              😊 Planet Happiness
            </p>
            {(() => {
              const trees = items.filter(i => i.type === 'tree' || i.type === 'pine' || i.type === 'flower').length;
              const buildings = items.filter(i => i.type === 'house' || i.type === 'castle').length;
              const score = Math.min(100, trees * 8 + buildings * 5 + items.length * 2);
              const emoji = score >= 80 ? '🤩' : score >= 50 ? '😊' : score >= 20 ? '🙂' : '😐';
              return (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-lg">{score}%</span>
                  </div>
                  <div className={`w-full rounded-full h-3 ${isNight ? 'bg-white/10' : 'bg-slate-200'}`}>
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${score}%`,
                        background: score >= 70
                          ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                          : score >= 40
                            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                            : 'linear-gradient(90deg, #f87171, #ef4444)',
                      }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {score >= 80 ? 'Thriving world!' : score >= 50 ? 'Looking good!' : score >= 20 ? 'Add more life!' : 'Empty world...'}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* CSS for background cloud drift */}
      <style>{`
        @keyframes drift {
          from { transform: translateX(-100px); }
          to   { transform: translateX(calc(100vw + 100px)); }
        }
      `}</style>
    </div>
  );
}
