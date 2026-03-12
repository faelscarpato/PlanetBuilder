import { useRef, useState, useEffect, useCallback } from 'react';

export function usePlanetRotation(autoSpeed = 0.15) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef<number | null>(null);
  const velocity = useRef(0);
  const animFrame = useRef<number>(0);
  const rotationRef = useRef(rotation);

  rotationRef.current = rotation;

  // Auto-rotate + momentum
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 16.67;
      last = now;
      if (!isDragging) {
        if (Math.abs(velocity.current) > 0.01) {
          velocity.current *= 0.95;
          setRotation(r => (r + velocity.current * dt) % 360);
        } else {
          velocity.current = 0;
          setRotation(r => (r + autoSpeed * dt) % 360);
        }
      }
      animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame.current);
  }, [isDragging, autoSpeed]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
    velocity.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || lastX.current === null) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velocity.current = dx * 0.5;
    setRotation(r => (r + dx * 0.5) % 360);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    lastX.current = null;
  }, []);

  return { rotation, isDragging, onPointerDown, onPointerMove, onPointerUp };
}
