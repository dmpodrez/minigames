import * as THREE from "three";

const barkMaterial = new THREE.MeshStandardMaterial({
  color: "#765039",
  roughness: 1,
});

const foliageMaterials = [
  "#477f45",
  "#5c9651",
  "#70a85a",
  "#82b768",
  "#609953",
].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      flatShading: true,
    }),
);

const foliageGeometry = new THREE.IcosahedronGeometry(1, 1);

export function createTree(
  scene: THREE.Scene,
  x: number,
  z: number,
): THREE.Group {
  const tree = new THREE.Group();

  // Main trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.26, 1.8, 8),
    barkMaterial,
  );

  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  // Add a branch between two points
  function addBranch(end: THREE.Vector3): void {
    const start = new THREE.Vector3(0, 1.35, 0);
    const direction = end.clone().sub(start);
    const length = direction.length();

    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.13, length, 7),
      barkMaterial,
    );

    branch.position.copy(start).addScaledVector(direction, 0.5);

    branch.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );

    branch.castShadow = true;
    tree.add(branch);
  }

  addBranch(new THREE.Vector3(-0.65, 2.45, 0.1));
  addBranch(new THREE.Vector3(0.55, 2.4, -0.25));
  addBranch(new THREE.Vector3(0.1, 2.5, 0.6));

  // Multiple clusters form a natural-looking crown
  const clusters = [
    { x: 0, y: 2.7, z: 0, size: 0.85 },
    { x: -0.65, y: 2.4, z: 0.05, size: 0.65 },
    { x: 0.65, y: 2.45, z: -0.1, size: 0.64 },
    { x: -0.1, y: 2.55, z: 0.65, size: 0.62 },
    { x: 0.15, y: 2.5, z: -0.7, size: 0.65 },
    { x: -0.4, y: 3.1, z: 0.2, size: 0.59 },
    { x: 0.4, y: 3.05, z: -0.25, size: 0.61 },
    { x: 0, y: 3.4, z: 0, size: 0.53 },
  ];

  clusters.forEach((cluster, index) => {
    const leaves = new THREE.Mesh(
      foliageGeometry,
      foliageMaterials[index % foliageMaterials.length],
    );

    leaves.position.set(cluster.x, cluster.y, cluster.z);

    leaves.scale.set(cluster.size * 1.1, cluster.size, cluster.size * 1.05);

    leaves.rotation.y = index * 0.65;
    leaves.castShadow = true;
    leaves.receiveShadow = true;

    tree.add(leaves);
  });

  tree.position.set(x, 0.1, z);
  scene.add(tree);

  return tree;
}
