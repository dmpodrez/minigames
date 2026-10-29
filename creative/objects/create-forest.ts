import * as THREE from "three";
import { createTree } from "./create-tree";

interface OccupiedSpace {
  x: number;
  z: number;
  radius: number;
}

interface ForestArea {
  x: number;
  z: number;
  spread: number;
  count: number;
}

export function createForest(
  scene: THREE.Scene,
  occupied: OccupiedSpace[],
): void {
  // Different forest areas around the village
  const areas: ForestArea[] = [
    { x: -28, z: -18, spread: 9, count: 12 },
    { x: 27, z: -22, spread: 9, count: 12 },
    { x: -30, z: 23, spread: 8, count: 10 },
    { x: 26, z: 25, spread: 8, count: 10 },
    { x: 3, z: -35, spread: 7, count: 10 },
  ];

  // Seeded random generator:
  // the forest looks the same after a page reload.
  let seed = 12345;

  function random(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const treeRadius = 1.4;

  for (const area of areas) {
    let placed = 0;
    let attempts = 0;

    while (placed < area.count && attempts < 150) {
      attempts++;

      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * area.spread;

      const x = area.x + Math.cos(angle) * distance;
      const z = area.z + Math.sin(angle) * distance;

      // Keep trees inside the island.
      if (Math.hypot(x, z) + treeRadius > 48) {
        continue;
      }

      // Keep the central village clear.
      if (Math.hypot(x, z) < 12) {
        continue;
      }

      // Avoid overlapping existing objects.
      const isOccupied = occupied.some((object) => {
        const distanceToObject = Math.hypot(x - object.x, z - object.z);

        return distanceToObject < treeRadius + object.radius + 0.2;
      });

      if (isOccupied) {
        continue;
      }

      createTree(scene, x, z);

      occupied.push({
        x,
        z,
        radius: treeRadius,
      });

      placed++;
    }
  }
}
