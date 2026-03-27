import * as THREE from "three";
import { EARTH_TRACKER_RADIUS, latLonToVector3, type StormSystem } from "./weatherField";
import type { WeatherLayerHandle } from "./cloudLayer";

function makeGlowSprite(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
  grad.addColorStop(0, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.15, color.replace("rgb", "rgba").replace(")", ",0.6)"));
  grad.addColorStop(0.45, color.replace("rgb", "rgba").replace(")", ",0.24)"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });
}

export function createStormLayer(getStorms: (timeMs: number) => StormSystem[]): WeatherLayerHandle {
  const group = new THREE.Group();
  const systems = getStorms(Date.now());
  const slotCount = Math.max(4, systems.length);
  const stormObjects = systems.map((storm, index) => {
    const stormGroup = new THREE.Group();
    const eye = new THREE.Sprite(makeGlowSprite("rgb(0, 207, 255)"));
    eye.scale.setScalar(0.42 + storm.intensity * 0.28);
    stormGroup.add(eye);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.28 + storm.intensity * 0.24, 40),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(index === 0 ? "#38bdf8" : index === 1 ? "#0ea5e9" : "#67e8f9"),
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    stormGroup.add(ring);

    const pathPoints = storm.path.map((point) => latLonToVector3(point.lat, point.lon, EARTH_TRACKER_RADIUS * 1.08));
    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pathPoints),
      new THREE.LineDashedMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.5,
        dashSize: 0.08,
        gapSize: 0.05,
      })
    );
    pathLine.computeLineDistances();
    group.add(pathLine);
    group.add(stormGroup);

    return { stormGroup, ring, eye, pathLine, storm };
  });

  while (stormObjects.length < slotCount) {
    const stormGroup = new THREE.Group();
    const eye = new THREE.Sprite(makeGlowSprite("rgb(0, 207, 255)"));
    eye.scale.setScalar(0.42);
    stormGroup.add(eye);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.3, 40),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#38bdf8"),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    stormGroup.add(ring);
    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.5,
        dashSize: 0.08,
        gapSize: 0.05,
      }),
    );
    pathLine.computeLineDistances();
    stormGroup.visible = false;
    pathLine.visible = false;
    group.add(pathLine);
    group.add(stormGroup);
    stormObjects.push({
      stormGroup,
      ring,
      eye,
      pathLine,
      storm: systems[0],
    });
  }

  return {
    object: group,
    update: (elapsed, timeMs) => {
      const liveSystems = getStorms(timeMs);
      stormObjects.forEach((entry, index) => {
        const live = liveSystems[index];
        if (!live) {
          entry.stormGroup.visible = false;
          entry.pathLine.visible = false;
          return;
        }
        entry.stormGroup.visible = true;
        entry.pathLine.visible = true;
        const pos = latLonToVector3(live.lat, live.lon, EARTH_TRACKER_RADIUS * 1.08);
        entry.stormGroup.position.copy(pos);
        entry.stormGroup.lookAt(new THREE.Vector3(0, 0, 0));
        entry.ring.rotation.z = elapsed * (0.8 + live.intensity * 0.7);
        entry.eye.material.opacity = 0.65 + Math.sin(elapsed * 2.5 + index) * 0.18;
        entry.eye.scale.setScalar(0.42 + live.intensity * 0.2 + Math.sin(elapsed * 1.8 + index) * 0.04);

        const nextPath = live.path.map((point) => latLonToVector3(point.lat, point.lon, EARTH_TRACKER_RADIUS * 1.08));
        entry.pathLine.geometry.dispose();
        entry.pathLine.geometry = new THREE.BufferGeometry().setFromPoints(nextPath);
        entry.pathLine.computeLineDistances();
      });
    },
    setVisible: (visible) => {
      group.visible = visible;
    },
  };
}
