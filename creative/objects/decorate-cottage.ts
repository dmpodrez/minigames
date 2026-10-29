import * as THREE from "three";

export function decorateCottage(cottage: THREE.Group): void {
  const wood = new THREE.MeshStandardMaterial({
    color: "#704730",
    roughness: 0.9,
  });

  const lightWood = new THREE.MeshStandardMaterial({
    color: "#a67b52",
    roughness: 0.9,
  });

  const stone = new THREE.MeshStandardMaterial({
    color: "#c2af91",
    roughness: 1,
  });

  const flowers = new THREE.MeshStandardMaterial({
    color: "#efb4ce",
    roughness: 0.85,
  });

  const leaves = new THREE.MeshStandardMaterial({
    color: "#558e4b",
    roughness: 1,
  });

  function addBox(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material,
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    cottage.add(mesh);
    return mesh;
  }

  // WOODEN SUPPORT BEAMS
  for (const x of [-1.23, 1.23]) {
    for (const z of [-1.03, 1.03]) {
      addBox(0.14, 2, 0.14, x, 1, z, wood);
    }
  }

  // Decorative beam across the front wall
  addBox(2.55, 0.15, 0.17, 0, 1.94, 1.1, wood);

  // STONE MASONRY DETAILS
  for (let row = 0; row < 5; row++) {
    for (const side of [-1, 1]) {
      const x = side * (1.03 + (row % 2) * 0.12);
      const y = 0.3 + row * 0.32;

      addBox(0.32, 0.14, 0.045, x, y, 1.08, stone);
    }
  }

  // ROOF TILES
  // Two roof surfaces, matching the existing roof angles.
  const roofLength = Math.sqrt(1.4 ** 2 + 1 ** 2);
  const roofAngle = Math.atan2(1, 1.4);

  const tileGeometry = new THREE.BoxGeometry(
    roofLength / 8 + 0.018,
    0.045,
    2.52 / 9 + 0.012,
  );

  const tileMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.9,
  });

  const tileColors = ["#a75d46", "#b96d4e", "#c17c59", "#995340"];

  const dummy = new THREE.Object3D();

  for (const side of [-1, 1]) {
    const roofGroup = new THREE.Group();

    roofGroup.position.set(side * 0.7, 2.5, 0);
    roofGroup.rotation.z = -side * roofAngle;

    const rows = 8;
    const columns = 9;

    const tiles = new THREE.InstancedMesh(
      tileGeometry,
      tileMaterial,
      rows * columns,
    );

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;

        dummy.position.set(
          -roofLength / 2 + ((row + 0.5) * roofLength) / rows,
          0.115,
          -1.26 + ((col + 0.5) * 2.52) / columns,
        );

        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        tiles.setMatrixAt(index, dummy.matrix);

        const colorIndex = (row * 3 + col * 7 + side + 4) % tileColors.length;

        tiles.setColorAt(index, new THREE.Color(tileColors[colorIndex]));
      }
    }

    tiles.instanceMatrix.needsUpdate = true;
    tiles.castShadow = true;
    tiles.receiveShadow = true;

    roofGroup.add(tiles);
    cottage.add(roofGroup);
  }

  // WINDOW FRAMES AND SHUTTERS
  for (const x of [-0.92, 0.92]) {
    // Window frame
    addBox(0.5, 0.08, 0.12, x, 1.58, 1.16, wood);
    addBox(0.5, 0.08, 0.12, x, 1.02, 1.16, wood);

    addBox(0.08, 0.55, 0.12, x - 0.22, 1.3, 1.16, wood);
    addBox(0.08, 0.55, 0.12, x + 0.22, 1.3, 1.16, wood);

    // Window cross
    addBox(0.05, 0.5, 0.14, x, 1.3, 1.18, lightWood);
    addBox(0.42, 0.05, 0.14, x, 1.3, 1.18, lightWood);

    // Wooden shutters
    for (const direction of [-1, 1]) {
      const shutterX = x + direction * 0.35;

      addBox(0.18, 0.54, 0.07, shutterX, 1.3, 1.13, lightWood);
    }

    // Flower box
    addBox(0.62, 0.19, 0.26, x, 0.86, 1.22, wood);

    for (let i = 0; i < 4; i++) {
      const flowerX = x - 0.22 + i * 0.14;

      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.13, 1),
        leaves,
      );

      leaf.position.set(flowerX, 1.03, 1.23);
      cottage.add(leaf);

      const blossom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.065, 1),
        flowers,
      );

      blossom.position.set(flowerX, 1.13, 1.27);
      cottage.add(blossom);
    }
  }

  // DOOR FRAME
  addBox(0.12, 1.36, 0.16, -0.4, 0.68, 1.18, wood);
  addBox(0.12, 1.36, 0.16, 0.4, 0.68, 1.18, wood);
  addBox(0.92, 0.15, 0.16, 0, 1.35, 1.18, wood);

  // STONE STEP AT THE ENTRANCE
  addBox(1.0, 0.15, 0.46, 0, 0.17, 1.38, stone);

  // CHIMNEY CAP
  addBox(0.52, 0.13, 0.55, 0.8, 3.18, -0.5, stone);
}
