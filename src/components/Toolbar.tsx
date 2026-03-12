import React from "react";
import { ItemType, WeatherType, TimeOfDay } from "../types";
import { ITEM_LABELS } from "./PlanetItems";
import { ItemThumbnail3D } from "./ItemThumbnail3D";

const ALL_ITEMS: ItemType[] = ["tree", "pine", "house", "castle", "cloud", "mountain", "flower"];

interface ToolbarProps {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  performanceMode: boolean;

  onTimeToggle: () => void;
  onWeatherChange: (w: WeatherType) => void;
  onPerformanceToggle: () => void;

  onDragStart: (e: React.DragEvent, type: ItemType) => void;
  onClear: () => void;
  itemCount: number;
}

const WEATHER_OPTIONS: { value: WeatherType; label: string; icon: string }[] = [
  { value: "clear", label: "Clear", icon: "☀️" },
  { value: "rain", label: "Rain", icon: "🌧️" },
  { value: "snow", label: "Snow", icon: "❄️" },
  { value: "storm", label: "Storm", icon: "⛈️" },
];

export function Toolbar({
  timeOfDay,
  weather,
  performanceMode,
  onTimeToggle,
  onWeatherChange,
  onPerformanceToggle,
  onDragStart,
  onClear,
  itemCount,
}: ToolbarProps) {
  const isNight = timeOfDay === "night";

  const card =
    `rounded-2xl p-4 border shadow-lg ` +
    (isNight
      ? "bg-white/10 border-white/15 text-white"
      : "bg-white/70 border-white/60 text-slate-900") +
    (performanceMode ? "" : " backdrop-blur-sm");

  const focusRing =
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 ` +
    (isNight ? "focus-visible:ring-offset-slate-950" : "focus-visible:ring-offset-white");

  return (
    <div className={`flex flex-col gap-4 w-full max-w-sm lg:w-64 shrink-0 ${isNight ? "text-slate-200" : "text-slate-900"}`}>
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-2xl font-extrabold tracking-tight ${isNight ? "text-white" : "text-slate-900"}`}>
          Tiny Planet
        </h1>
        <p className={`text-xs tracking-wide ${isNight ? "text-slate-300" : "text-slate-600"}`}>
          Drag items onto the planet • Click to remove
        </p>
      </div>

      {/* Items */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold uppercase tracking-widest ${isNight ? "text-slate-300" : "text-slate-600"}`}>
            Items
          </p>
          <span className={`text-xs px-2 py-1 rounded-full ${isNight ? "bg-white/10 text-slate-200" : "bg-slate-900/5 text-slate-700"}`}>
            {itemCount} placed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ALL_ITEMS.map((type) => (
            <button
              key={type}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className={
                `group relative rounded-2xl p-2 min-w-11 min-h-11 w-16 h-16 ` + // ≥ 44×44
                `border ${isNight ? "border-white/15 bg-white/5 hover:bg-white/8" : "border-slate-200 bg-white hover:bg-slate-50"} ` +
                `shadow-[var(--shadow-ambient)] hover:shadow-[var(--shadow-lift)] transition-all ` +
                focusRing
              }
              aria-label={`Drag ${ITEM_LABELS[type]} to planet`}
              title={ITEM_LABELS[type]}
            >
              {/* 3D Thumbnail (same model used in world) */}
              <div className="absolute inset-1 rounded-xl overflow-hidden">
                <ItemThumbnail3D type={type} performanceMode={performanceMode} seedId={`thumb-${type}`} />
              </div>

              {/* Small label for scanability */}
              <div
                className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wide whitespace-nowrap ` +
                  (isNight ? "text-slate-300" : "text-slate-600")}
              >
                {ITEM_LABELS[type]}
              </div>
            </button>
          ))}
        </div>
        <div className="h-5" />
      </div>

      {/* Controls */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onTimeToggle}
            className={
              `flex-1 rounded-xl px-3 py-2 font-semibold text-sm border transition-all ` +
              (isNight ? "bg-indigo-500/20 border-white/15 hover:bg-indigo-500/25 text-white" : "bg-slate-900/5 border-slate-200 hover:bg-slate-900/8 text-slate-900 ") +
              focusRing
            }
            aria-label="Toggle day/night"
          >
            {isNight ? "🌙 Night" : "☀️ Day"}
          </button>

          <button
            type="button"
            onClick={onClear}
            className={
              `rounded-xl px-3 py-2 font-semibold text-sm border transition-all ` +
              (isNight ? "bg-white/10 border-white/15 hover:bg-white/15 text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900") +
              focusRing
            }
            aria-label="Clear planet"
          >
            Clear
          </button>
        </div>

        {/* Weather */}
        <div className="mt-3">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
            Weather
          </p>
          <div className="grid grid-cols-2 gap-2">
            {WEATHER_OPTIONS.map((opt) => {
              const active = weather === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onWeatherChange(opt.value)}
                  className={
                    `rounded-xl px-3 py-2 border text-sm font-semibold flex items-center gap-2 justify-center transition-all ` +
                    (active
                      ? isNight
                        ? "bg-cyan-400/20 border-cyan-300/35 text-white"
                        : "bg-cyan-50 border-cyan-200 text-slate-900"
                      : isNight
                        ? "bg-white/5 border-white/15 hover:bg-white/10 text-slate-200"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                    ) +
                    focusRing
                  }
                  aria-label={`Set weather to ${opt.label}`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance mode */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              Performance
            </p>
            <p className={`text-xs ${isNight ? "text-slate-400" : "text-slate-500"}`}>
              Reduces blur & real-time shadows
            </p>
          </div>

          <button
            type="button"
            onClick={onPerformanceToggle}
            className={
              `relative w-14 h-9 rounded-full border transition-all ` +
              (performanceMode
                ? isNight
                  ? "bg-white/10 border-white/20"
                  : "bg-slate-900/5 border-slate-200"
                : isNight
                  ? "bg-cyan-400/25 border-cyan-300/35"
                  : "bg-cyan-100 border-cyan-200"
              ) +
              " " +
              focusRing
            }
            role="switch"
            aria-checked={performanceMode}
            aria-label="Toggle performance mode"
            title="Performance mode"
          >
            <span
              className={
                `absolute top-1 left-1 w-7 h-7 rounded-full shadow-md transition-transform ` +
                (performanceMode ? "translate-x-5 bg-white" : "translate-x-0 bg-white")
              }
            />
          </button>
        </div>
      </div>
    </div>
  );
}
