import "./world-builder.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createCottage } from "./objects/create-cottage";
import { createTower } from "./objects/create-tower";
import { createLandscape } from "./objects/create-landscape";
import { createForest } from "./objects/create-forest";
import { createTree } from "./objects/create-tree";
import { createVillagePaths } from "./objects/create-village-paths";
import { createLake, isInsideLake } from "./objects/create-lake";
import { loadWorld, saveWorld, type SavedBuilding } from "./world-storage";
type BuildTool = "cottage" | "tree" | "tower";

interface OccupiedSpace {
  x: number;
  z: number;
  radius: number;
}

interface PlacedBuilding {
  object: THREE.Group;
  data: SavedBuilding;
  space: OccupiedSpace;
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
const deleteButton = getRequiredElement<HTMLButtonElement>("#delete-building");
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
camera.position.set(18, 14, 18);

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

// Zoom limits
controls.minDistance = 6;
controls.maxDistance = 120;

// Do not allow the camera to go below the island
controls.maxPolarAngle = Math.PI / 2.1;

// Allow movement across the island
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.panSpeed = 1;

// Limit how far the camera can move from the center
controls.cursor.set(0, 0, 0);
controls.maxTargetRadius = 47;

controls.update();

// LIGHTING
const ambientLight = new THREE.HemisphereLight("#fff7e5", "#6b805e", 2.2);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight("#fff0cd", 3);
sunlight.position.set(8, 15, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);

sunlight.shadow.camera.left = -60;
sunlight.shadow.camera.right = 60;
sunlight.shadow.camera.top = 60;
sunlight.shadow.camera.bottom = -60;

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
  new THREE.CylinderGeometry(50, 48, 1.6, 64),
  stoneMaterial,
);
islandBase.position.y = -0.85;
islandBase.receiveShadow = true;
scene.add(islandBase);

// Larger grass surface
const grass = new THREE.Mesh(
  new THREE.CylinderGeometry(50.1, 50, 0.2, 64),
  grassMaterial,
);
grass.receiveShadow = true;
scene.add(grass);

// TREE FACTORY

createTree(scene, -4, -3);
createTree(scene, 4, -3);
createTree(scene, -4, 3);
createTree(scene, 4, 3);
createTree(scene, 0, -5);

createCottage(scene, 0, 0);
createLandscape(scene);
createLake(scene);
createVillagePaths(scene);
// COLLISION DATA
const occupied: OccupiedSpace[] = [
  { x: 0, z: 0, radius: 1.7 },
  { x: -4, z: -3, radius: 1.3 },
  { x: 4, z: -3, radius: 1.3 },
  { x: -4, z: 3, radius: 1.3 },
  { x: 4, z: 3, radius: 1.3 },
  { x: 0, z: -5, radius: 1.3 },
];
createForest(scene, occupied);

const objectRadius: Record<BuildTool, number> = {
  cottage: 1.7,
  tree: 1.15,
  tower: 1.3,
};

function isFreePosition(x: number, z: number, tool: BuildTool): boolean {
  const radius = objectRadius[tool];
  if (isInsideLake(x, z, radius + 0.6)) {
    return false;
  }
  if (Math.hypot(x, z) + radius > 48.5) {
    return false;
  }

  return occupied.every((object) => {
    const distance = Math.hypot(x - object.x, z - object.z);

    return distance >= radius + object.radius;
  });
}

const playerBuildings: SavedBuilding[] = [];
const placedBuildings: PlacedBuilding[] = [];

function spawnBuilding(tool: BuildTool, x: number, z: number): THREE.Group {
  if (tool === "cottage") {
    return createCottage(scene, x, z);
  }

  if (tool === "tree") {
    return createTree(scene, x, z);
  }

  return createTower(scene, x, z);
}

// Restore buildings saved during previous sessions.

for (const building of loadWorld()) {
  const { tool, x, z } = building;

  if (!isFreePosition(x, z, tool)) {
    continue;
  }

  const object = spawnBuilding(tool, x, z);

  const space: OccupiedSpace = {
    x,
    z,
    radius: objectRadius[tool],
  };

  occupied.push(space);
  playerBuildings.push(building);

  placedBuildings.push({
    object,
    data: building,
    space,
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
const previewTree = createTree(scene, 0, 0);
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
let deleteMode = false;
function selectTool(tool: BuildTool): void {
  deleteMode = false;
  deleteButton.classList.remove("active");
  deleteButton.setAttribute("aria-pressed", "false");

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

deleteButton.addEventListener("click", () => {
  const nextDeleteMode = !deleteMode;

  // Deselect the active building tool.
  if (activeTool) {
    selectTool(activeTool);
  }

  deleteMode = nextDeleteMode;

  deleteButton.classList.toggle("active", deleteMode);

  deleteButton.setAttribute("aria-pressed", String(deleteMode));

  hidePreviews();

  renderer.domElement.style.cursor = deleteMode ? "not-allowed" : "grab";
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

function findPlacedBuilding(event: PointerEvent): PlacedBuilding | null {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const objects = placedBuildings.map((building) => building.object);

  const hits = raycaster.intersectObjects(objects, true);
  const hit = hits[0]?.object;

  if (!hit) return null;

  return (
    placedBuildings.find((building) => {
      let current: THREE.Object3D | null = hit;

      while (current) {
        if (current === building.object) {
          return true;
        }

        current = current.parent;
      }

      return false;
    }) ?? null
  );
}

function deleteBuilding(building: PlacedBuilding): void {
  // Remove the 3D model from the scene.
  building.object.removeFromParent();

  // Free the occupied space.
  const spaceIndex = occupied.indexOf(building.space);

  if (spaceIndex !== -1) {
    occupied.splice(spaceIndex, 1);
  }

  // Remove its saved data.
  const savedIndex = playerBuildings.indexOf(building.data);

  if (savedIndex !== -1) {
    playerBuildings.splice(savedIndex, 1);
  }

  // Stop tracking this building.
  const placedIndex = placedBuildings.indexOf(building);

  if (placedIndex !== -1) {
    placedBuildings.splice(placedIndex, 1);
  }

  saveWorld(playerBuildings);
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
  if ((!activeTool && !deleteMode) || !pointerStart || event.button !== 0) {
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

  if (deleteMode) {
    const building = findPlacedBuilding(event);

    if (building) {
      deleteBuilding(building);
    }

    return;
  }

  if (!activeTool) return;

  const point = getGroundPoint(event);

  if (!point) return;

  const { x, z } = point;
  const tool = activeTool;

  if (!isFreePosition(x, z, tool)) return;

  const object = spawnBuilding(tool, x, z);

  const data: SavedBuilding = {
    tool,
    x,
    z,
  };

  const space: OccupiedSpace = {
    x,
    z,
    radius: objectRadius[tool],
  };

  occupied.push(space);
  playerBuildings.push(data);

  placedBuildings.push({
    object,
    data,
    space,
  });

  saveWorld(playerBuildings);
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
