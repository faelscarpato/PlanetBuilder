# Tiny Planet Builder — v2_bolder (WebGL)

This version upgrades the planet to **real 3D (WebGL)** using:
- `@react-three/fiber` + `three` + `@react-three/drei`
- Physically-based materials, real-time lighting, and soft shadows
- 3D thumbnails rendered from the **same** item models used in the world

## Run locally

```bash
npm install
npm run dev
```

> `package-lock.json` is intentionally omitted so your package manager can generate a lockfile that matches your environment.

## Notes
- **Performance Mode** toggle reduces blur/backdrop and disables real-time shadows (recommended for low-end mobile).
- Drag items onto the planet. Click an item to remove it.
