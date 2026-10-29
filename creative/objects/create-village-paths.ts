import * as THREE from "three";

export function createVillagePaths(scene: THREE.Scene): void {
  const material = new THREE.MeshStandardMaterial({
    color: "#cbb99c",
    roughness: 1,
    flatShading: true,
  });

  const geometry = new THREE.DodecahedronGeometry(1, 0);

  // Roads extend from the cottage into the meadow.
  const routes: [number, number][][] = [
    // Main road from the cottage
    [
      [0, 5.5],
      [0.5, 10],
      [0, 15],
      [1.5, 22],
      [0, 30],
      [3, 42],
    ],

    // Road to the left forest
    [
      [0.5, 10],
      [-5, 13],
      [-12, 17],
      [-20, 20],
      [-28, 23],
    ],

    // Road to the right forest
    [
      [0.5, 10],
      [6, 13],
      [13, 17],
      [20, 22],
      [27, 25],
    ],

    // Road around the cottage to the northwest forest
    [
      [0, 5.5],
      [-6, 4],
      [-11, -3],
      [-18, -10],
      [-28, -18],
    ],

    // Road around the cottage to the northeast forest
    [
      [0, 5.5],
      [7, 4],
      [13, -3],
      [20, -12],
      [27, -22],
    ],

    // Road to the distant northern forest
    [
      [7, 4],
      [8, -6],
      [6, -16],
      [4, -26],
      [3, -35],
    ],
  ];

  for (const route of routes) {
    const points = route.map(([x, z]) => new THREE.Vector3(x, 0.14, z));

    const curve = new THREE.CatmullRomCurve3(points);

    const count = Math.ceil(curve.getLength() / 0.3);

    for (let i = 0; i < count; i++) {
      const position = curve.getPoint((i + 0.5) / count);

      const stone = new THREE.Mesh(geometry, material);

      stone.position.copy(position);

      stone.scale.set(0.4 + (i % 3) * 0.04, 0.045, 0.3 + (i % 4) * 0.025);

      stone.rotation.y = (i % 5) * 0.14;
      stone.receiveShadow = true;

      scene.add(stone);
    }
  }
}
