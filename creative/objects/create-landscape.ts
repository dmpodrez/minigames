import * as THREE from "three";
import { isInsideLake } from "./create-lake";
export function createLandscape(scene: THREE.Scene): void {
  const nature = new THREE.Group();
  scene.add(nature);

  // Fixed random seed keeps the landscape consistent.
  let seed = 2026;

  function random(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function randomPoint(): { x: number; z: number } {
    while (true) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 48;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Keep the initial cottage and front path clear.
      const nearCottage = Math.hypot(x, z) < 1.9;
      const onPath = Math.abs(x) < 0.65 && z > 1.4;
      const nearLake = isInsideLake(x, z, 1.3);

      if (!nearCottage && !onPath && !nearLake) {
        return { x, z };
      }
    }
  }

  const dummy = new THREE.Object3D();

  // GRASS
  const grassCount = 18000;

  const grassGeometry = new THREE.ConeGeometry(0.065, 0.28, 3);

  const grassMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 1,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const grass = new THREE.InstancedMesh(
    grassGeometry,
    grassMaterial,
    grassCount,
  );

  const grassColors = ["#528f43", "#69a64e", "#87b95e", "#a1c777", "#bdd68a"];

  for (let i = 0; i < grassCount; i++) {
    const { x, z } = randomPoint();
    const height = 0.18 + random() * 0.24;

    dummy.position.set(x, 0.1 + height / 2, z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(0.7 + random() * 0.6, height / 0.28, 0.7 + random() * 0.6);
    dummy.updateMatrix();

    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(
      i,
      new THREE.Color(grassColors[Math.floor(random() * grassColors.length)]),
    );
  }

  grass.instanceMatrix.needsUpdate = true;
  nature.add(grass);

  // FLOWERS
  const flowerCount = 1500;
  const petalCount = 5;

  const stemGeometry = new THREE.CylinderGeometry(0.012, 0.017, 0.24, 5);

  const flowerGeometry = new THREE.IcosahedronGeometry(0.062, 0);

  const flowerMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.9,
    flatShading: true,
  });

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: "#497d3a",
    roughness: 1,
  });

  const centerMaterial = new THREE.MeshStandardMaterial({
    color: "#e7b946",
    roughness: 0.8,
  });

  const stems = new THREE.InstancedMesh(
    stemGeometry,
    stemMaterial,
    flowerCount,
  );

  const petals = new THREE.InstancedMesh(
    flowerGeometry,
    flowerMaterial,
    flowerCount * petalCount,
  );

  const centers = new THREE.InstancedMesh(
    flowerGeometry,
    centerMaterial,
    flowerCount,
  );

  const flowerColors = ["#fff5db", "#ffd2df", "#d8c1ff", "#f3e6ff", "#ffe6a6"];

  for (let i = 0; i < flowerCount; i++) {
    const { x, z } = randomPoint();
    const flowerColor = new THREE.Color(
      flowerColors[Math.floor(random() * flowerColors.length)],
    );

    dummy.position.set(x, 0.22, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 0.35, z);
    dummy.updateMatrix();
    centers.setMatrixAt(i, dummy.matrix);

    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2;
      const index = i * petalCount + p;

      dummy.position.set(
        x + Math.cos(angle) * 0.078,
        0.35,
        z + Math.sin(angle) * 0.078,
      );

      dummy.updateMatrix();
      petals.setMatrixAt(index, dummy.matrix);
      petals.setColorAt(index, flowerColor);
    }
  }

  stems.instanceMatrix.needsUpdate = true;
  centers.instanceMatrix.needsUpdate = true;
  petals.instanceMatrix.needsUpdate = true;

  nature.add(stems, centers, petals);

  // SMALL ROCKS
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);

  const rockMaterials = [
    new THREE.MeshStandardMaterial({
      color: "#9f9f88",
      roughness: 1,
      flatShading: true,
    }),
    new THREE.MeshStandardMaterial({
      color: "#b7aa93",
      roughness: 1,
      flatShading: true,
    }),
  ];

  for (let i = 0; i < 22; i++) {
    const { x, z } = randomPoint();
    const size = 0.12 + random() * 0.22;

    const rock = new THREE.Mesh(
      rockGeometry,
      rockMaterials[i % rockMaterials.length],
    );

    rock.position.set(x, 0.1 + size * 0.32, z);
    rock.scale.set(size * 1.4, size * 0.65, size);
    rock.rotation.y = random() * Math.PI;

    rock.castShadow = true;
    rock.receiveShadow = true;
    nature.add(rock);
  }

  // STONE PATH LEADING TO THE COTTAGE
  const pathGeometry = new THREE.DodecahedronGeometry(1, 0);

  const pathMaterial = new THREE.MeshStandardMaterial({
    color: "#c9b9a0",
    roughness: 1,
    flatShading: true,
  });

  for (let i = 0; i < 13; i++) {
    const z = 1.65 + i * 0.3;
    const x = Math.sin(i * 0.65) * 0.13;

    const stone = new THREE.Mesh(pathGeometry, pathMaterial);

    stone.position.set(x, 0.12, z);
    stone.scale.set(0.28 + random() * 0.1, 0.055, 0.2 + random() * 0.08);

    stone.rotation.y = random() * 0.5;
    stone.receiveShadow = true;

    nature.add(stone);
  }
}
