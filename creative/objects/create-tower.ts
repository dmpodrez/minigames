import * as THREE from "three";
import { decorateTower } from "./decorate-tower";
export function createTower(
  scene: THREE.Scene,
  x: number,
  z: number,
): THREE.Group {
  const tower = new THREE.Group();

  const stone = new THREE.MeshStandardMaterial({
    color: "#b9aa91",
    roughness: 0.95,
    flatShading: true,
  });

  const darkStone = new THREE.MeshStandardMaterial({
    color: "#8d8172",
    roughness: 1,
  });

  const roof = new THREE.MeshStandardMaterial({
    color: "#a65c49",
    roughness: 0.85,
    flatShading: true,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: "#63432f",
    roughness: 0.9,
  });

  const glass = new THREE.MeshStandardMaterial({
    color: "#ffe0a0",
    emissive: "#ffb347",
    emissiveIntensity: 0.4,
  });

  // Main stone walls
  const walls = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1, 2.8, 12),
    stone,
  );

  walls.position.y = 1.4;
  walls.castShadow = true;
  walls.receiveShadow = true;
  tower.add(walls);

  // Foundation
  const foundation = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.1, 0.25, 12),
    darkStone,
  );

  foundation.position.y = 0.12;
  foundation.castShadow = true;
  tower.add(foundation);

  // Decorative stone ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.18, 12),
    darkStone,
  );

  ring.position.y = 2.73;
  ring.castShadow = true;
  tower.add(ring);

  // Pointed medieval roof
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.23, 1.7, 8), roof);

  roofMesh.position.y = 3.65;
  roofMesh.rotation.y = Math.PI / 8;
  roofMesh.castShadow = true;
  tower.add(roofMesh);

  // Wooden entrance
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.1), wood);

  door.position.set(0, 0.69, 0.98);
  door.castShadow = true;
  tower.add(door);

  // Small glowing window
  const windowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.48, 0.08),
    glass,
  );

  windowMesh.position.set(0, 2.05, 0.88);
  tower.add(windowMesh);

  // Window crossbar
  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.07, 0.1),
    wood,
  );

  windowFrame.position.set(0, 2.05, 0.94);
  tower.add(windowFrame);

  // Golden roof ornament
  const ornament = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({
      color: "#d6ad5c",
      metalness: 0.55,
      roughness: 0.35,
    }),
  );

  ornament.position.y = 4.55;
  tower.add(ornament);

  decorateTower(tower);

  tower.position.set(x, 0.1, z);
  scene.add(tower);

  return tower;
}
