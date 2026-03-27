import * as THREE from "three";
import { EARTH_TRACKER_RADIUS, type WeatherSample } from "./weatherField";

export interface WeatherLayerHandle {
  object: THREE.Object3D;
  update: (elapsed: number, timeMs: number) => void;
  setVisible: (visible: boolean) => void;
}

export function createCloudLayer(
  isMobile: boolean,
  sampleAt: (lat: number, lon: number, timeMs: number) => WeatherSample,
): WeatherLayerHandle {
  const canvas = document.createElement("canvas");
  canvas.width = isMobile ? 256 : 512;
  canvas.height = isMobile ? 128 : 256;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_TRACKER_RADIUS * 1.028, 48, 48),
    material
  );

  let lastRedraw = 0;

  const redraw = (timeMs: number) => {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 16, 28, 0.04)";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 2) {
      const lat = 90 - (y / height) * 180;
      for (let x = 0; x < width; x += 2) {
        const lon = (x / width) * 360 - 180;
        const sample = sampleAt(lat, lon, timeMs);
        const alpha = Math.max(0, (sample.cloudCover - 18) / 100) * 0.9;
        if (alpha < 0.05) continue;
        const cool = Math.round(220 + sample.storminess * 24);
        const warm = Math.round(236 + sample.cloudCover * 0.12);
        ctx.fillStyle = `rgba(${warm}, ${warm}, ${cool}, ${0.12 + alpha * 0.85})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    texture.needsUpdate = true;
  };

  return {
    object: mesh,
    update: (elapsed, timeMs) => {
      material.opacity = 0.78 + Math.sin(elapsed * 0.35) * 0.08;
      texture.offset.x = (elapsed * 0.006) % 1;
      mesh.rotation.y = elapsed * 0.012;
      if (timeMs - lastRedraw > (isMobile ? 2200 : 1400)) {
        redraw(timeMs);
        lastRedraw = timeMs;
      }
    },
    setVisible: (visible) => {
      mesh.visible = visible;
    },
  };
}
