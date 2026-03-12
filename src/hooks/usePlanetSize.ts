import { useEffect, useMemo, useState } from "react";

/**
 * Responsive planet size (diameter in px).
 * Prevents horizontal overflow on small devices while keeping a strong hero presence on desktop.
 */
export function usePlanetSize() {
  const compute = () => {
    const w = typeof window === "undefined" ? 1200 : window.innerWidth;
    const h = typeof window === "undefined" ? 800 : window.innerHeight;
    const min = Math.min(w, h);

    // Mobile: keep within viewport with padding.
    if (w < 420) return Math.max(280, Math.floor(w - 28)); // ~14px padding each side
    // Tablet: comfortable medium size.
    if (w < 768) return Math.max(320, Math.min(360, Math.floor(min * 0.55)));
    // Desktop: hero size.
    return 380;
  };

  const [size, setSize] = useState<number>(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return useMemo(() => ({ size, radius: size / 2 }), [size]);
}
