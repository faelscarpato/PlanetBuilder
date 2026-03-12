import React from "react";
import { ItemType } from "../types";

// Labels kept for UI
export const ITEM_LABELS: Record<ItemType, string> = {
  tree: "Tree",
  pine: "Pine",
  house: "House",
  castle: "Castle",
  cloud: "Cloud",
  mountain: "Mountain",
  flower: "Flower",
};

type ItemVisualStyle = "3d" | "flat";

type ItemVariant = "thumb" | "world";

interface ItemSVGProps {
  variant?: ItemVariant; // thumb shows sticker base, world is just the object
  type: ItemType;
  size?: number;
  className?: string;
  style?: ItemVisualStyle;
}

/**
 * 2026 visual refresh:
 * - Consistent light source (top-left)
 * - Soft ambient occlusion
 * - Subtle specular highlight
 * - Works as both thumbnail + in-world icon (planet)
 */
export function ItemSVG({ type, size = 28, className = "", style = "3d", variant = "world" }: ItemSVGProps) {
  const s = size;
  const is3D = style === "3d";
  const baseStyle: React.CSSProperties = {
    width: s,
    height: s,
    display: "inline-block",
    userSelect: "none",
  };

  const Shadow = (
    <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1.3" stdDeviation="1.2" floodColor="#000" floodOpacity="0.35" />
    </filter>
  );

  const Sticker = ({ children }: { children: React.ReactNode }) => (
    <>
      {is3D && variant === "thumb" && (
        <>
          <circle cx="16" cy="16" r="13.2" fill="url(#sticker)" opacity="0.96" />
          <circle cx="16" cy="16" r="13.2" fill="url(#stickerHi)" opacity="0.85" />
          <circle cx="16" cy="16" r="13.2" fill="transparent" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" />
        </>
      )}
      {children}
    </>
  );

  switch (type) {
    case "tree":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Tree">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="leaf" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="55%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>
            <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              {/* canopy */}
              <circle cx="15.5" cy="13.2" r="7.8" fill="url(#leaf)" />
              <circle cx="11.2" cy="15.6" r="6.1" fill="url(#leaf)" opacity="0.98" />
              <circle cx="20.2" cy="15.8" r="6.4" fill="url(#leaf)" opacity="0.98" />
              {/* trunk */}
              <rect x="13.6" y="20.6" width="4.8" height="7.8" rx="1.3" fill="url(#trunk)" />
              {/* subtle highlight */}
              {is3D && <path d="M10 12 C13 7, 20 7, 22 12" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />}
            </Sticker>
          </g>
        </svg>
      );

    case "pine":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Pine">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="pineA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="55%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="pineB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
            <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              <path d="M16 4 L26 22 H6 Z" fill="url(#pineA)" />
              <path d="M16 9 L24 24 H8 Z" fill="url(#pineB)" opacity="0.98" />
              <rect x="13.6" y="23.2" width="4.8" height="6.6" rx="1.3" fill="url(#trunk)" />
              {is3D && <path d="M12.2 13.5 C14.5 10, 17 10, 20 13.5" stroke="rgba(255,255,255,0.32)" strokeWidth="1.1" strokeLinecap="round" fill="none" />}
            </Sticker>
          </g>
        </svg>
      );

    case "house":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="House">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.75" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            <linearGradient id="door" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="glass" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#60a5fa" />
            </radialGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              <path d="M16 6 L28.5 16.8 H3.5 Z" fill="url(#roof)" />
              <path d="M6 16 H26 V28.2 C26 29.2 25.2 30 24.2 30 H7.8 C6.8 30 6 29.2 6 28.2 Z" fill="url(#wall)" />
              {/* shadow under roof */}
              {is3D && <path d="M5 16.2 H27 V18.2 H5 Z" fill="rgba(0,0,0,0.10)" />}
              <rect x="13.2" y="20" width="5.6" height="10" rx="1.2" fill="url(#door)" />
              <circle cx="17.8" cy="25" r="0.7" fill="rgba(255,255,255,0.55)" />
              <rect x="7.2" y="18.8" width="5.4" height="5.4" rx="1.1" fill="url(#glass)" />
              <rect x="19.4" y="18.8" width="5.4" height="5.4" rx="1.1" fill="url(#glass)" />
              {is3D && variant === "thumb" && (
                <>
                  <path d="M8.1 19.6 L11.6 19.6" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round" />
                  <path d="M20.3 19.6 L23.8 19.6" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round" />
                </>
              )}
            </Sticker>
          </g>
        </svg>
      );

    case "castle":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Castle">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0.82" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="55%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#6b7280" />
            </linearGradient>
            <linearGradient id="stone2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              <path d="M6 14 H26 V30 H6 Z" fill="url(#stone)" />
              <path d="M6 12 H10 V16 H6 Z M22 12 H26 V16 H22 Z" fill="url(#stone2)" />
              <path d="M12 10 H20 V30 H12 Z" fill="url(#stone2)" opacity="0.95" />
              {/* crenels */}
              <path d="M6 14 V10 H9 V14 H11 V10 H14 V14 H16 V10 H19 V14 H21 V10 H24 V14 Z" fill="#d1d5db" opacity="0.85" />
              {/* door */}
              <path d="M14 22 C14 19 18 19 18 22 V30 H14 Z" fill="rgba(0,0,0,0.25)" />
              {is3D && variant === "thumb" && (
                <>
                  <path d="M7.5 17.5 H24.5" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
                  <path d="M7.5 21 H24.5" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
                </>
              )}
            </Sticker>
          </g>
        </svg>
      );

    case "cloud":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Cloud">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="cloudGrad" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              <path
                d="M10.5 22.5C7.9 22.5 6 20.7 6 18.4c0-2.1 1.6-3.9 3.8-4.2 0.8-3 3.5-5.2 6.7-5.2 3.4 0 6.2 2.5 6.8 5.7 2.2 0.4 3.9 2.1 3.9 4.3 0 2.5-2 4.5-4.6 4.5H10.5Z"
                fill="url(#cloudGrad)"
              />
              {is3D && <path d="M11 14 C13 12, 17 12, 20 14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" fill="none" />}
            </Sticker>
          </g>
        </svg>
      );

    case "mountain":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Mountain">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.88" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="m1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="60%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="m2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              <path d="M6 28 L14.2 13.5 L22.5 28 Z" fill="url(#m1)" />
              <path d="M12 28 L18.4 17.2 L26 28 Z" fill="url(#m2)" opacity="0.98" />
              {/* snow caps */}
              <path d="M14.2 13.5 L11.7 18.1 L14.2 17.1 L16.8 18.1 Z" fill="#f8fafc" opacity="0.9" />
              <path d="M18.4 17.2 L16.8 20.1 L18.4 19.4 L20.1 20.1 Z" fill="#f8fafc" opacity="0.85" />
            </Sticker>
          </g>
        </svg>
      );

    case "flower":
      return (
        <svg style={baseStyle} className={className} viewBox="0 0 32 32" role="img" aria-label="Flower">
          <defs>
            {Shadow}
            <radialGradient id="sticker" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#ffe4e6" stopOpacity="0.75" />
            </radialGradient>
            <radialGradient id="stickerHi" cx="20%" cy="18%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="petal" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="60%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#be123c" />
            </radialGradient>
            <radialGradient id="core" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>

          <g filter={is3D && variant === "thumb" ? "url(#ds)" : undefined}>
            <Sticker>
              {/* petals */}
              {[
                "M16 8 C18.8 8 20.6 10 20 12.4 C19.4 14.8 17.7 14.8 16 14.2 C14.3 14.8 12.6 14.8 12 12.4 C11.4 10 13.2 8 16 8 Z",
                "M24 16 C24 18.8 22 20.6 19.6 20 C17.2 19.4 17.2 17.7 17.8 16 C17.2 14.3 17.2 12.6 19.6 12 C22 11.4 24 13.2 24 16 Z",
                "M16 24 C13.2 24 11.4 22 12 19.6 C12.6 17.2 14.3 17.2 16 17.8 C17.7 17.2 19.4 17.2 20 19.6 C20.6 22 18.8 24 16 24 Z",
                "M8 16 C8 13.2 10 11.4 12.4 12 C14.8 12.6 14.8 14.3 14.2 16 C14.8 17.7 14.8 19.4 12.4 20 C10 20.6 8 18.8 8 16 Z",
              ].map((d, i) => (
                <path key={i} d={d} fill="url(#petal)" opacity={0.98} />
              ))}
              <circle cx="16" cy="16" r="3.2" fill="url(#core)" />
              {/* stem hint */}
              <path d="M16 19.4 V29" stroke="url(#stem)" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
              {is3D && <path d="M13.2 12.2 C14.5 11.2, 17.5 11.2, 19 12.2" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" strokeLinecap="round" fill="none" />}
            </Sticker>
          </g>
        </svg>
      );

    default:
      return null;
  }
}
