import * as THREE from "three";

export function decorateTower(tower: THREE.Group): void {
  const stone = new THREE.MeshStandardMaterial({
    color: "#c5b59a",
    roughness: 1,
    flatShading: true,
  });

  const darkStone = new THREE.MeshStandardMaterial({
    color: "#847768",
    roughness: 1,
  });

  const moss = new THREE.MeshStandardMaterial({
    color: "#628352",
    roughness: 1,
  });

  // Stone blocks around the tower walls
  const brickGeometry = new THREE.BoxGeometry(0.32, 0.14, 0.085);

  const brickMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 1,
  });

  const rows = 7;
  const columns = 12;

  const bricks = new THREE.InstancedMesh(
    brickGeometry,
    brickMaterial,
    rows * columns,
  );

  const dummy = new THREE.Object3D();

  const colors = ["#b6a58d", "#c9baa2", "#a99b85", "#d0c1a9"];

  for (let row = 0; row < rows; row++) {
    const y = 0.36 + row * 0.34;
    const radius = 1 - (0.15 / 2.8) * y + 0.015;

    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;

      const angle = ((col + (row % 2) * 0.5) / columns) * Math.PI * 2;

      dummy.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      bricks.setMatrixAt(index, dummy.matrix);
      bricks.setColorAt(
        index,
        new THREE.Color(colors[(row * 3 + col) % colors.length]),
      );
    }
  }

  bricks.instanceMatrix.needsUpdate = true;
  bricks.receiveShadow = true;
  tower.add(bricks);

  // Decorative horizontal stone bands
  for (const y of [1.45, 2.62]) {
    const bandRadius = 1 - (0.15 / 2.8) * y + 0.08;

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(bandRadius, bandRadius, 0.11, 12, 1, true),
      darkStone,
    );

    band.position.y = y;
    tower.add(band);
  }

  // Door frame
  const doorSideGeometry = new THREE.BoxGeometry(0.12, 1.2, 0.14);

  for (const x of [-0.36, 0.36]) {
    const side = new THREE.Mesh(doorSideGeometry, stone);

    side.position.set(x, 0.64, 1.05);
    side.castShadow = true;
    tower.add(side);
  }

  // Arched detail above the door
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.065, 6, 20, Math.PI),
    stone,
  );

  arch.position.set(0, 1.27, 1.06);
  tower.add(arch);

  // Window frame
  for (const x of [-0.17, 0.17]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.57, 0.11),
      darkStone,
    );

    frame.position.set(x, 2.05, 0.97);
    tower.add(frame);
  }

  for (const y of [1.76, 2.34]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.075, 0.11),
      darkStone,
    );

    frame.position.set(0, y, 0.97);
    tower.add(frame);
  }

  // Small moss patches
  const leafGeometry = new THREE.IcosahedronGeometry(0.09, 0);

  for (let i = 0; i < 14; i++) {
    const y = 0.3 + i * 0.16;
    const angle = -0.7 + Math.sin(i * 1.4) * 0.2;
    const radius = 1 - (0.15 / 2.8) * y + 0.07;

    const leaf = new THREE.Mesh(leafGeometry, moss);

    leaf.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

    leaf.scale.set(0.7, 1.1, 0.6);

    tower.add(leaf);
  }
}
