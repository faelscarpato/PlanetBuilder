import React from "react";
import { InteractionMode, ItemType, QualityPreset, WeatherType, TimeOfDay } from "../types";
import { ITEM_LABELS } from "./PlanetItems";
import { ItemThumbnail3D } from "./ItemThumbnail3D";

const ALL_ITEMS: ItemType[] = ["tree", "pine", "house", "castle", "cloud", "mountain", "flower"];

interface ToolbarProps {
  timeOfDay: TimeOfDay;
  weather: WeatherType;

  performanceMode: boolean;
  qualityPreset: QualityPreset;
  fps: number | null;

  selectedType: ItemType | null;
  interactionMode: InteractionMode;

  onSelectType: (t: ItemType) => void;
  onInteractionModeChange: (m: InteractionMode) => void;

  onTimeToggle: () => void;
  onWeatherChange: (w: WeatherType) => void;

  onQualityPresetChange: (p: QualityPreset) => void;

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
  qualityPreset,
  fps,
  selectedType,
  interactionMode,
  onSelectType,
  onInteractionModeChange,
  onTimeToggle,
  onWeatherChange,
  onQualityPresetChange,
  onDragStart,
  onClear,
  itemCount,
}: ToolbarProps) {
  const isNight = timeOfDay === "night";

  // WCAG-forward surfaces (night uses darker solid surfaces; day uses light with minimal transparency)
  const card =
    `rounded-2xl p-4 border shadow-lg ` +
    (isNight
      ? "bg-slate-950/55 border-white/15 text-slate-100"
      : "bg-white/75 border-white/70 text-slate-900") +
    (performanceMode ? "" : " backdrop-blur-sm");

  const focusRing =
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 ` +
    (isNight ? "focus-visible:ring-offset-slate-950" : "focus-visible:ring-offset-white");

  const segBtn = (active: boolean) =>
    `px-3 py-2 rounded-xl text-sm font-semibold transition-all border ` +
    (active
      ? isNight
        ? "bg-cyan-300 text-slate-950 border-cyan-200 shadow-md"
        : "bg-cyan-500 text-white border-cyan-400 shadow-md"
      : isNight
        ? "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
        : "bg-slate-900/5 text-slate-700 border-slate-200 hover:bg-slate-900/10") +
    " " +
    focusRing;

  return (
    <div className={`flex flex-col gap-4 w-full max-w-sm lg:w-64 shrink-0 ${isNight ? "text-slate-200" : "text-slate-900"}`}>
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-2xl font-extrabold tracking-tight ${isNight ? "text-white" : "text-slate-900"}`}>
          Tiny Planet
        </h1>
        <p className={`text-xs tracking-wide ${isNight ? "text-slate-300" : "text-slate-600"}`}>
          Mobile‑first: tap item → tap planet to place
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

        {/* Mobile-first: bigger tiles + consistent spacing */}
        <div className="grid grid-cols-3 gap-3">
          {ALL_ITEMS.map((type) => {
            const isSelected = selectedType === type;
            const tile =
              `group relative rounded-2xl p-2 min-w-11 min-h-11 w-16 h-16 ` + // ≥ 44×44
              `border transition-all ` +
              (isSelected
                ? isNight
                  ? "border-cyan-200 bg-cyan-300/20 shadow-[0_14px_30px_rgba(34,211,238,0.22)]"
                  : "border-cyan-500 bg-cyan-500/10 shadow-[0_14px_30px_rgba(6,182,212,0.18)]"
                : isNight
                  ? "border-white/12 bg-white/6 hover:bg-white/10"
                  : "border-slate-200 bg-white hover:bg-slate-50") +
              ` shadow-[var(--shadow-ambient)] hover:shadow-[var(--shadow-lift)] ` +
              focusRing;

            return (
              <button
                key={type}
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                onClick={() => onSelectType(type)}
                className={tile}
                aria-label={`Select ${ITEM_LABELS[type]} (tap planet to place)`}
                title={ITEM_LABELS[type]}
              >
                {/* 3D Thumbnail (same model used in world) */}
                <div className="absolute inset-1 rounded-xl overflow-hidden">
                  <ItemThumbnail3D type={type} performanceMode={performanceMode} seedId={`thumb-${type}`} />
                </div>

                {/* Selected marker */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyan-300 text-slate-950 text-xs font-black grid place-items-center shadow-md">
                    ✓
                  </div>
                )}

                {/* Label */}
                <div
                  className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wide whitespace-nowrap ` +
                    (isNight ? "text-slate-200" : "text-slate-700")}
                >
                  {ITEM_LABELS[type]}
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-5" />
      </div>

      {/* Controls */}
      <div className={card}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
          Controls
        </p>

        {/* Mode (Place/Remove) */}
        <div className="flex gap-2 mb-3">
          <button type="button" className={segBtn(interactionMode === "place")} onClick={() => onInteractionModeChange("place")}>
            Place
          </button>
          <button type="button" className={segBtn(interactionMode === "remove")} onClick={() => onInteractionModeChange("remove")}>
            Remove
          </button>
        </div>

        {/* Day / Night */}
        <button
          type="button"
          onClick={onTimeToggle}
          className={
            `w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ` +
            (isNight ? "bg-white/6 border-white/12 hover:bg-white/10" : "bg-slate-900/5 border-slate-200 hover:bg-slate-900/10") +
            " " + focusRing
          }
        >
          <span className="text-sm font-semibold">{isNight ? "Night" : "Day"}</span>
          <span className="text-lg">{isNight ? "🌙" : "☀️"}</span>
        </button>

        {/* Weather */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {WEATHER_OPTIONS.map((opt) => {
            const active = weather === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onWeatherChange(opt.value)}
                className={
                  `flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ` +
                  (active
                    ? isNight
                      ? "bg-cyan-300 text-slate-950 border-cyan-200"
                      : "bg-cyan-500 text-white border-cyan-400"
                    : isNight
                      ? "bg-white/6 border-white/12 text-slate-200 hover:bg-white/10"
                      : "bg-slate-900/5 border-slate-200 text-slate-700 hover:bg-slate-900/10") +
                  " " + focusRing
                }
                aria-pressed={active}
              >
                <span className="text-base">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quality preset + FPS (auto fallback quality→performance) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold uppercase tracking-widest ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              Quality
            </span>
            <span className={`text-xs ${isNight ? "text-slate-300" : "text-slate-600"}`}>
              {fps ? `${Math.round(fps)} FPS` : "—"}
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" className={segBtn(qualityPreset === "auto")} onClick={() => onQualityPresetChange("auto")}>
              Auto
            </button>
            <button type="button" className={segBtn(qualityPreset === "quality")} onClick={() => onQualityPresetChange("quality")}>
              Quality
            </button>
            <button type="button" className={segBtn(qualityPreset === "performance")} onClick={() => onQualityPresetChange("performance")}>
              Perf
            </button>
          </div>
          <p className={`mt-2 text-[11px] leading-snug ${isNight ? "text-slate-300" : "text-slate-600"}`}>
            Auto falls back to Performance if FPS stays low (better on weak mobile GPUs).
          </p>
        </div>

        {/* Clear */}
        <button
          type="button"
          onClick={onClear}
          className={
            `mt-4 w-full px-3 py-2 rounded-xl border text-sm font-bold transition-all ` +
            (isNight
              ? "bg-rose-500/15 border-rose-300/20 text-rose-100 hover:bg-rose-500/22"
              : "bg-rose-500/10 border-rose-200 text-rose-700 hover:bg-rose-500/15") +
            " " + focusRing
          }
        >
          Clear planet
        </button>
      </div>
    </div>
  );
}
