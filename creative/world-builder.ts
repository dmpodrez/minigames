import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCottage } from "./objects/create-cottage";
import { createTower } from "./objects/create-tower";
type BuildTool = "cottage" | "tree" | "tower";

interface OccupiedSpace {
  x: number;
  z: number;
  radius: number;
}

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

const container = getRequiredElement<HTMLDivElement>("#world");

const cottageButton = getRequiredElement<HTMLButtonElement>("#build-cottage");

const treeButton = getRequiredElement<HTMLButtonElement>("#build-tree");
const towerButton = getRequiredElement<HTMLButtonElement>("#build-tower");
// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color("#b8daf0");

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000,
);
camera.position.set(14, 11, 14);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

container.appendChild(renderer.domElement);

// CAMERA CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);
controls.minDistance = 5;
controls.maxDistance = 35;
controls.maxPolarAngle = Math.PI / 2.1;

// LIGHTING
const ambientLight = new THREE.HemisphereLight("#fff7e5", "#6b805e", 2.2);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight("#fff0cd", 3);
sunlight.position.set(8, 15, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);

sunlight.shadow.camera.left = -15;
sunlight.shadow.camera.right = 15;
sunlight.shadow.camera.top = 15;
sunlight.shadow.camera.bottom = -15;

scene.add(sunlight);

// ISLAND
const grassMaterial = new THREE.MeshStandardMaterial({
  color: "#83b96a",
  roughness: 0.95,
});

const stoneMaterial = new THREE.MeshStandardMaterial({
  color: "#8b897c",
  roughness: 1,
});

const islandBase = new THREE.Mesh(
  new THREE.CylinderGeometry(7, 5.8, 1.6, 12),
  stoneMaterial,
);
islandBase.position.y = -0.85;
islandBase.receiveShadow = true;
scene.add(islandBase);

const grass = new THREE.Mesh(
  new THREE.CylinderGeometry(7.1, 7, 0.2, 12),
  grassMaterial,
);
grass.receiveShadow = true;
scene.add(grass);

// TREE FACTORY
function createTree(x: number, z: number): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: "#805536" }),
  );
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshStandardMaterial({
      color: "#4c945a",
      roughness: 0.9,
      flatShading: true,
    }),
  );
  leaves.position.y = 2.2;
  leaves.castShadow = true;
  tree.add(leaves);

  tree.position.set(x, 0.1, z);
  scene.add(tree);

  return tree;
}

// INITIAL WORLD
createTree(-4, -3);
createTree(4, -3);
createTree(-4, 3);
createTree(4, 3);
createTree(0, -5);

createCottage(scene, 0, 0);

// COLLISION DATA
const occupied: OccupiedSpace[] = [
  { x: 0, z: 0, radius: 1.7 },
  { x: -4, z: -3, radius: 0.9 },
  { x: 4, z: -3, radius: 0.9 },
  { x: -4, z: 3, radius: 0.9 },
  { x: 4, z: 3, radius: 0.9 },
  { x: 0, z: -5, radius: 0.9 },
];

const objectRadius: Record<BuildTool, number> = {
  cottage: 1.7,
  tree: 1.15,
  tower: 1.3,
};

function isFreePosition(x: number, z: number, tool: BuildTool): boolean {
  const radius = objectRadius[tool];

  if (Math.hypot(x, z) + radius > 6.8) {
    return false;
  }

  return occupied.every((object) => {
    const distance = Math.hypot(x - object.x, z - object.z);

    return distance >= radius + object.radius;
  });
}

// BUILDING PREVIEW
const validMaterial = new THREE.MeshBasicMaterial({
  color: "#52eb87",
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});

const invalidMaterial = new THREE.MeshBasicMaterial({
  color: "#ff5555",
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});

function preparePreview(group: THREE.Group): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.material = validMaterial;
      object.castShadow = false;
      object.receiveShadow = false;
      meshes.push(object);
    }
  });

  group.visible = false;
  return meshes;
}

const previewCottage = createCottage(scene, 0, 0);
const previewTree = createTree(0, 0);
const previewTower = createTower(scene, 0, 0);
const cottageMeshes = preparePreview(previewCottage);
const treeMeshes = preparePreview(previewTree);
const towerMeshes = preparePreview(previewTower);
function hidePreviews(): void {
  previewCottage.visible = false;
  previewTree.visible = false;
  previewTower.visible = false;
}

// TOOL SELECTION
let activeTool: BuildTool | null = null;

function selectTool(tool: BuildTool): void {
  activeTool = activeTool === tool ? null : tool;

  cottageButton.classList.toggle("active", activeTool === "cottage");

  treeButton.classList.toggle("active", activeTool === "tree");

  cottageButton.textContent =
    activeTool === "cottage" ? "Cancel Cottage" : "Build Cottage";

  treeButton.textContent = activeTool === "tree" ? "Cancel Tree" : "Plant Tree";

  towerButton.classList.toggle("active", activeTool === "tower");

  towerButton.textContent =
    activeTool === "tower" ? "Cancel Tower" : "Build Tower";

  renderer.domElement.style.cursor = activeTool ? "crosshair" : "grab";

  hidePreviews();
}

cottageButton.addEventListener("click", () => {
  selectTool("cottage");
});

treeButton.addEventListener("click", () => {
  selectTool("tree");
});

towerButton.addEventListener("click", () => {
  selectTool("tower");
});

// MOUSE RAYCASTING
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getGroundPoint(event: PointerEvent): THREE.Vector3 | null {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hit = raycaster
    .intersectObject(grass)
    .find((intersection) => intersection.point.y >= 0.09);

  return hit?.point ?? null;
}

// FOLLOW THE MOUSE
renderer.domElement.addEventListener("pointermove", (event) => {
  if (!activeTool) {
    hidePreviews();
    return;
  }

  const point = getGroundPoint(event);

  if (!point) {
    hidePreviews();
    return;
  }

  const preview =
    activeTool === "cottage"
      ? previewCottage
      : activeTool === "tree"
        ? previewTree
        : previewTower;

  const meshes =
    activeTool === "cottage"
      ? cottageMeshes
      : activeTool === "tree"
        ? treeMeshes
        : towerMeshes;

  hidePreviews();

  preview.visible = true;
  preview.position.set(point.x, 0.1, point.z);

  const valid = isFreePosition(point.x, point.z, activeTool);

  meshes.forEach((mesh) => {
    mesh.material = valid ? validMaterial : invalidMaterial;
  });
});

renderer.domElement.addEventListener("pointerleave", hidePreviews);

// PLACE OBJECT ON CLICK
let pointerStart: { x: number; y: number } | null = null;

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  pointerStart = {
    x: event.clientX,
    y: event.clientY,
  };
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (!activeTool || !pointerStart || event.button !== 0) {
    pointerStart = null;
    return;
  }

  const movement = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y,
  );

  pointerStart = null;

  // Do not build while rotating the camera.
  if (movement > 5) return;

  const point = getGroundPoint(event);

  if (!point) return;

  const { x, z } = point;
  const tool = activeTool;

  if (!isFreePosition(x, z, tool)) return;

  if (tool === "cottage") {
    createCottage(scene, x, z);
  } else if (tool === "tree") {
    createTree(x, z);
  } else if (tool === "tower") {
    createTower(scene, x, z);
  }

  occupied.push({
    x,
    z,
    radius: objectRadius[tool],
  });
});

// RESIZE
function resize(): void {
  camera.aspect = container!.clientWidth / container!.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container!.clientWidth, container!.clientHeight);
}

window.addEventListener("resize", resize);

// RENDER LOOP
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
