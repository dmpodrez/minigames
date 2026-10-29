import * as THREE from "three";

// Lake position and size
export const LAKE = {
  x: -16,
  z: 6,
  radiusX: 7,
  radiusZ: 4.5,
};

// Check if a point is inside the lake
export function isInsideLake(x: number, z: number, padding = 0): boolean {
  const dx = (x - LAKE.x) / (LAKE.radiusX + padding);
  const dz = (z - LAKE.z) / (LAKE.radiusZ + padding);

  return dx * dx + dz * dz <= 1;
}

export function createLake(scene: THREE.Scene): void {
  const lake = new THREE.Group();
  scene.add(lake);

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: "#59aebb",
    roughness: 0.25,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const sandMaterial = new THREE.MeshStandardMaterial({
    color: "#d8c59d",
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: "#956744",
    roughness: 0.95,
  });

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: "#67452f",
    roughness: 1,
  });

  // Sandy shoreline
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.13, 72),
    sandMaterial,
  );

  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(LAKE.radiusX, LAKE.radiusZ, 1);
  shore.position.set(LAKE.x, 0.117, LAKE.z);

  lake.add(shore);

  // Water surface
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72), waterMaterial);

  water.rotation.x = -Math.PI / 2;
  water.scale.set(LAKE.radiusX, LAKE.radiusZ, 1);
  water.position.set(LAKE.x, 0.125, LAKE.z);

  lake.add(water);

  // Wooden bridge: individual planks
  const plankGeometry = new THREE.BoxGeometry(2.4, 0.12, 0.48);

  for (let i = 0; i < 21; i++) {
    const plank = new THREE.Mesh(plankGeometry, woodMaterial);

    plank.position.set(LAKE.x, 0.34, LAKE.z - 5.7 + i * 0.57);

    plank.castShadow = true;
    plank.receiveShadow = true;

    lake.add(plank);
  }

  // Bridge railings
  for (const side of [-1, 1]) {
    const x = LAKE.x + side * 1.18;

    for (let i = 0; i < 5; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.9, 0.15),
        darkWoodMaterial,
      );

      post.position.set(x, 0.73, LAKE.z - 5.2 + i * 2.6);

      post.castShadow = true;
      lake.add(post);
    }

    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.13, 10.8),
      woodMaterial,
    );

    railing.position.set(x, 1.12, LAKE.z);

    railing.castShadow = true;
    lake.add(railing);
  }
}
