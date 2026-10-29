import * as THREE from "three";
import { decorateCottage } from "./decorate-cottage";
export function createCottage(
  scene: THREE.Scene,
  x: number,
  z: number,
): THREE.Group {
  const cottage = new THREE.Group();

  // Materials
  const stone = new THREE.MeshStandardMaterial({
    color: "#d9c5a3",
    roughness: 0.95,
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: "#9e5847",
    roughness: 0.85,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: "#65402c",
    roughness: 0.9,
  });

  const glass = new THREE.MeshStandardMaterial({
    color: "#ffe5a2",
    emissive: "#ffb951",
    emissiveIntensity: 0.45,
  });

  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2, 2.1), stone);

  walls.position.y = 1;
  walls.castShadow = true;
  walls.receiveShadow = true;
  cottage.add(walls);

  // Triangular upper wall
  const triangle = new THREE.Shape();
  triangle.moveTo(-1.3, 2);
  triangle.lineTo(0, 3);
  triangle.lineTo(1.3, 2);
  triangle.closePath();

  const gable = new THREE.Mesh(
    new THREE.ExtrudeGeometry(triangle, {
      depth: 2.1,
      bevelEnabled: false,
    }),
    stone,
  );

  gable.position.z = -1.05;
  gable.castShadow = true;
  cottage.add(gable);

  // Two sloping roof panels
  const roofLength = Math.sqrt(1.4 ** 2 + 1 ** 2);
  const roofAngle = Math.atan2(1, 1.4);

  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(roofLength + 0.15, 0.16, 2.6),
      roofMaterial,
    );

    roof.position.set(side * 0.7, 2.5, 0);
    roof.rotation.z = -side * roofAngle;
    roof.castShadow = true;
    roof.receiveShadow = true;

    cottage.add(roof);
  }

  // Wooden front door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.08), wood);

  door.position.set(0, 0.625, 1.1);
  door.castShadow = true;
  cottage.add(door);

  // Door handle
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 12),
    new THREE.MeshStandardMaterial({ color: "#d5ad62" }),
  );

  handle.position.set(0.22, 0.65, 1.16);
  cottage.add(handle);

  // Glowing windows
  for (const windowX of [-0.92, 0.92]) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.5, 0.07),
      glass,
    );

    windowMesh.position.set(windowX, 1.3, 1.1);
    cottage.add(windowMesh);

    // Horizontal wooden window frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.07, 0.09), wood);

    frame.position.set(windowX, 1.3, 1.15);
    cottage.add(frame);
  }

  // Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1, 0.4), stone);

  chimney.position.set(0.8, 2.65, -0.5);
  chimney.castShadow = true;
  cottage.add(chimney);

  // Put the cottage on the island

  decorateCottage(cottage);

  cottage.position.set(x, 0.1, z);
  scene.add(cottage);

  return cottage;
}
