import "./styles.scss";
import "./reeling.scss";
import "./catch.scss";
import {
  generateCatch,
  getCatchResistance,
  type CatchResult,
} from "./game/catches";
import { nextReelState, type ReelState } from "./game/reeling";
import "./inventory.scss";
import { getSalePrice, loadEconomy, saveEconomy } from "./game/economy";
import { CATCHES } from "./game/catches";
import { loadInventory, saveInventory } from "./game/inventory";
import "./shop.scss";

import {
  RODS,
  loadShop,
  saveShop,
  buyRod,
  equipRod,
  getEquippedRod,
  FISHING_LOCATIONS,
  buyLocation,
  type ShopLocationId,
} from "./game/shop";
function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Cozy Fishing: missing element ${selector}`);
  }

  return element;
}

const canvas = getRequiredElement<HTMLCanvasElement>("#fishing-canvas");
const castButton = getRequiredElement<HTMLButtonElement>("#cast-button");
const status = getRequiredElement<HTMLElement>("#game-status");
const catchCount = getRequiredElement<HTMLElement>("#catch-count");
const reelPanel = getRequiredElement<HTMLElement>("#reel-panel");
const progressTrack = getRequiredElement<HTMLElement>("#reel-progress");
const tensionTrack = getRequiredElement<HTMLElement>("#reel-tension");
const progressFill = getRequiredElement<HTMLElement>("#reel-progress-fill");
const tensionFill = getRequiredElement<HTMLElement>("#reel-tension-fill");
const progressText = getRequiredElement<HTMLElement>("#reel-percent");
const tensionText = getRequiredElement<HTMLElement>("#tension-percent");
const catchDialog = getRequiredElement<HTMLDialogElement>("#catch-dialog");
const catchImage = getRequiredElement<HTMLImageElement>("#catch-image");
const catchTitle = getRequiredElement<HTMLElement>("#catch-title");
const catchEyebrow = getRequiredElement<HTMLElement>("#catch-eyebrow");
const catchRarity = getRequiredElement<HTMLElement>("#catch-rarity");
const catchWeight = getRequiredElement<HTMLElement>("#catch-weight");
const catchValue = getRequiredElement<HTMLElement>("#catch-value");
const catchDescription = getRequiredElement<HTMLElement>("#catch-description");
const catchContinue = getRequiredElement<HTMLButtonElement>("#catch-continue");

const inventoryOpen = getRequiredElement<HTMLButtonElement>("#inventory-open");

const inventoryClose =
  getRequiredElement<HTMLButtonElement>("#inventory-close");

const inventoryDialog =
  getRequiredElement<HTMLDialogElement>("#inventory-dialog");

const inventoryList = getRequiredElement<HTMLDivElement>("#inventory-list");

const inventorySummary = getRequiredElement<HTMLElement>("#inventory-summary");

const inventoryCount = getRequiredElement<HTMLElement>("#inventory-count");

const walletBalance = getRequiredElement<HTMLElement>("#wallet-balance");

const discoveredSpecies = getRequiredElement<HTMLElement>(
  "#discovered-species",
);

const shopOpen = getRequiredElement<HTMLButtonElement>("#shop-open");

const shopClose = getRequiredElement<HTMLButtonElement>("#shop-close");

const shopDialog = getRequiredElement<HTMLDialogElement>("#shop-dialog");

const shopList = getRequiredElement<HTMLDivElement>("#shop-list");

const equippedRodLabel = getRequiredElement<HTMLElement>("#equipped-rod");

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Cozy Fishing: Canvas 2D is not supported");
}
const ctx = context;

const WIDTH = 640;
const HEIGHT = 360;

// COZY_HD_RENDER_V2: high-resolution Canvas, same 640x360 gameplay coordinates.
// A 2x backing buffer means character PNGs retain more visual detail on screen.
const HD_SCALE = 2;
canvas.width = WIDTH * HD_SCALE;
canvas.height = HEIGHT * HD_SCALE;
ctx.setTransform(HD_SCALE, 0, 0, HD_SCALE, 0, 0);

type LocationId = 1 | 2 | 3 | 4;

interface LocationConfig {
  background: string;
  fisherman: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: -1 | 1;
  handX: number;
  handY: number;
  tipX: number;
  tipY: number;
  bobberX: number;
  bobberY: number;
}

const LOCATIONS: Record<LocationId, LocationConfig> = {
  1: {
    name: "Sunset Cove",
    background: "./assets/boat-man.png",
    fisherman: "./assets/backgr.png",
    x: 300,
    y: 207,
    width: 40,
    height: 54,
    direction: -1,
    handX: 512,
    handY: 239,
    tipX: 300,
    tipY: 217,
    bobberX: 200,
    bobberY: 279,
  },
  2: {
    name: "Mountain River",
    background: "./assets/nature.png",
    fisherman: "./assets/nature-man.png",
    x: 180,
    y: 170,
    width: 75,
    height: 100,
    direction: 1,
    handX: 116,
    handY: 247,
    tipX: 258,
    tipY: 160,
    bobberX: 335,
    bobberY: 292,
  },
  3: {
    name: "Tropical Lagoon",
    background: "./assets/island.png",
    fisherman: "./assets/island-man.png",
    x: 440,
    y: 160,
    width: 44,
    height: 59,
    direction: 1,
    handX: 80,
    handY: 253,
    tipX: 440,
    tipY: 166,
    bobberX: 265,
    bobberY: 260,
  },
  4: {
    name: "Winter Lake",
    background: "./assets/snow.png",
    fisherman: "./assets/snow-man.png",
    x: 420,
    y: 200,
    width: 86,
    height: 101,
    direction: -1,
    handX: 542,
    handY: 246,
    tipX: 505,
    tipY: 240,
    bobberX: 531,
    bobberY: 286,
  },
};

// COZY_SUBMISSION_FIX_V1
let activeLocation: LocationId = 1;
let location = LOCATIONS[activeLocation];
const locationSelect =
  getRequiredElement<HTMLSelectElement>("#location-select");
const locationHeading = getRequiredElement<HTMLElement>("#location-title");
const locationNumber = getRequiredElement<HTMLElement>("#location-number");
const locationDescription = getRequiredElement<HTMLElement>(
  "#location-description",
);
const weatherLabel = getRequiredElement<HTMLElement>("#weather-label");
const locationDescriptions: Record<LocationId, string> = {
  1: "A peaceful evening on the lake",
  2: "Wild trout by the mountain stream",
  3: "Turquoise water and tropical sunshine",
  4: "A quiet winter fishing adventure",
};
const locationWeather: Record<LocationId, string> = {
  1: "🌅 DAY 01 · SUNSET",
  2: "☀ DAY 01 · CLEAR",
  3: "🌴 DAY 01 · SUNNY",
  4: "❄ DAY 01 · SNOW",
};
function updateLocationLabels(): void {
  locationSelect.value = String(activeLocation);
  locationHeading.textContent = location.name;
  locationNumber.textContent = `LOCATION 0${activeLocation}`;
  locationDescription.textContent = locationDescriptions[activeLocation];
  weatherLabel.textContent = locationWeather[activeLocation];
}
updateLocationLabels();

interface GameArt {
  background: HTMLImageElement;
  fisherman: HTMLImageElement;
}

type FishingPhase = "ready" | "waiting" | "bite" | "reeling";

let phase: FishingPhase = "ready";
let pendingCatch: CatchResult | null = null;
const savedCatches = loadInventory();
const economy = loadEconomy(savedCatches);
let shopState = loadShop();

// COZY_LOCATION_UNLOCKS_V1: ownership from the existing shop save.
function refreshLocationOptions(): void {
  for (const item of FISHING_LOCATIONS) {
    const option = locationSelect.querySelector<HTMLOptionElement>(
      `option[value="${item.id}"]`,
    );
    if (!option) continue;
    const unlocked = shopState.ownedLocationIds.includes(item.id);
    option.textContent = unlocked
      ? item.name
      : `🔒 ${item.name} · ${item.price} coins`;
    // Keep locked options selectable so the player can discover the shop.
    option.disabled = false;
  }
  locationSelect.value = String(activeLocation);
}
refreshLocationOptions();
let caughtFish = economy.totalFishCaught;

catchCount.textContent = String(caughtFish);
inventoryCount.textContent = String(savedCatches.length);
walletBalance.textContent = String(economy.coins);

let biteTimer: number | undefined;
let escapeTimer: number | undefined;
let pointerHeld = false;
let spaceHeld = false;
let ignoreNextClick = false;
let spaceReleasePending = false;
let reelState: ReelState = { progress: 0, tension: 0, elapsed: 0 };
let lastFrame = 0;
let hasMadeReelProgress = false;
let zeroProgressIdleSeconds = 0;
const ZERO_PROGRESS_ESCAPE_SECONDS = 5;
let castStartedAt = 0;
let splashStartedAt = -1;

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load art: ${src}`));
    image.src = src;
  });
}

function drawFisherman(art: GameArt, time: number): void {
  const breathe = Math.sin(time * 2) * 0.6;

  ctx.drawImage(
    art.fisherman,
    location.x,
    location.y + breathe,
    location.width,
    location.height,
  );
}

function drawAmbientEffects(time: number): void {
  // Subtle water sparkle without external graphics or heavy redraws.
  if (activeLocation === 4) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 12; i++) {
      const px = (i * 113 + time * (5 + (i % 3))) % WIDTH;
      const py = (i * 59 + time * (12 + (i % 5))) % HEIGHT;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.restore();
    return;
  }
  const surfaceY =
    activeLocation === 2 ? 238 : activeLocation === 3 ? 180 : 248;
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 22; i++) {
    const x = (i * 73 + time * (3 + (i % 4))) % WIDTH;
    const y = surfaceY + ((i * 41) % (HEIGHT - surfaceY - 5));
    if (activeLocation === 2 && x < 260) continue;
    ctx.fillStyle = i % 3 ? "#b3e9e9" : "#fff5c8";
    ctx.fillRect(Math.round(x), Math.round(y), 5 + (i % 5), 1);
  }
  ctx.restore();
}

function drawScene(art: GameArt, time: number): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.drawImage(art.background, 0, 0, WIDTH, HEIGHT);
  drawAmbientEffects(time);

  // HD display: magnify around the feet / base, preserving original position.
  const sizeBoost: Record<LocationId, number> = {
    1: 1.08,
    2: 1.13,
    3: 1.12,
    4: 1.1,
  };
  const scale = sizeBoost[activeLocation];
  const anchorX = location.x + location.width / 2;
  const anchorY = location.y + location.height;
  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.scale(scale, scale);
  ctx.translate(-anchorX, -anchorY);
  drawFisherman(art, time);
  ctx.restore();
  drawFishingLine(time);
}

function clearFishingTimers(): void {
  window.clearTimeout(biteTimer);
  window.clearTimeout(escapeTimer);
  biteTimer = undefined;
  escapeTimer = undefined;
}

function updateButton(): void {
  const labels: Record<FishingPhase, string> = {
    ready: "🎣 Cast line",
    waiting: "↩ Reel in",
    bite: "🐟 Hook fish!",
    reeling: "🎣 Hold to reel",
  };
  castButton.textContent = labels[phase];
  castButton.setAttribute("aria-pressed", String(phase !== "ready"));
  inventoryOpen.disabled = phase !== "ready";
  shopOpen.disabled = phase !== "ready";
  locationSelect.disabled = phase !== "ready";
  document
    .querySelector(".game-panel")
    ?.classList.toggle("game-panel--reeling", phase === "reeling");
}

function updateMeters(): void {
  const progress = Math.round(reelState.progress);
  const tension = Math.round(reelState.tension);

  progressFill.style.width = `${progress}%`;
  tensionFill.style.width = `${tension}%`;
  tensionFill.classList.toggle("reel-panel__fill--danger", tension >= 75);
  progressText.textContent = `${progress}%`;
  tensionText.textContent = `${tension}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));
  tensionTrack.setAttribute("aria-valuenow", String(tension));
}

function resetFishing(message: string): void {
  clearFishingTimers();
  pendingCatch = null;
  phase = "ready";
  castStartedAt = 0;
  splashStartedAt = -1;
  pointerHeld = false;
  spaceHeld = false;
  reelPanel.hidden = true;
  hasMadeReelProgress = false;
  zeroProgressIdleSeconds = 0;
  updateButton();
  status.textContent = message;
}

function castLine(): void {
  clearFishingTimers();
  phase = "waiting";
  status.textContent = "Waiting for a fish to bite...";
  updateButton();

  castStartedAt = performance.now() / 1000;
  splashStartedAt = -1;
  const delay = 2300 + Math.random() * 3200;
  biteTimer = window.setTimeout(() => {
    if (phase !== "waiting") return;

    pendingCatch = generateCatch();
    phase = "bite";
    updateButton();
    status.textContent = "FISH ON! Click Hook fish before it escapes!";

    escapeTimer = window.setTimeout(() => {
      if (phase === "bite") {
        resetFishing("The fish escaped before you hooked it. Try again!");
      }
    }, 3000);
  }, delay);
}

function startReeling(): void {
  clearFishingTimers();
  phase = "reeling";
  pointerHeld = false;
  spaceHeld = false;
  reelState = { progress: 0, tension: 10, elapsed: 0 };
  hasMadeReelProgress = false;
  zeroProgressIdleSeconds = 0;
  reelPanel.hidden = false;
  updateButton();
  updateMeters();

  const resistance = pendingCatch ? getCatchResistance(pendingCatch) : 1;

  const strength =
    resistance < 1 ? "Light" : resistance < 1.3 ? "Medium" : "Strong";

  status.textContent =
    `${strength} resistance! Hold to reel, ` +
    `but release before the line breaks!`;
}

function drawFishingLine(time: number): void {
  // Пока удочка не заброшена, леску не рисуем
  if (phase === "ready") return;

  const { tipX, tipY, bobberX, bobberY } = location;

  const biting = phase === "bite";
  const reeling = phase === "reeling";

  const wave = activeLocation === 4 ? 0 : Math.sin(time * 2.5) * 1.5;
  const biteMovement = biting ? Math.sin(time * 17) * 5 : 0;

  // Float follows an arc for the first 0.8 s after casting.
  const progress = Math.min(1, Math.max(0, (time - castStartedAt) / 0.8));
  const flying = progress < 1;
  const currentX = flying ? tipX + (bobberX - tipX) * progress : bobberX;
  const currentY = flying
    ? tipY + (bobberY - tipY) * progress - 38 * Math.sin(progress * Math.PI)
    : bobberY + wave + biteMovement;
  if (!flying && splashStartedAt < 0) splashStartedAt = time;

  ctx.save();

  // Леска от кончика удочки до поплавка
  ctx.strokeStyle = "rgba(245, 245, 235, 0.85)";
  ctx.lineWidth = 0.9;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);

  // Небольшое провисание лески
  if (reeling || biting) {
    ctx.lineTo(currentX, currentY);
  } else {
    ctx.quadraticCurveTo(
      (tipX + bobberX) / 2,
      (tipY + currentY) / 2 + 8,
      currentX,
      currentY,
    );
  }

  ctx.stroke();

  if (activeLocation !== 4) {
    // Круги на воде
    const ripple = (time * 5) % 1;

    ctx.strokeStyle = `rgba(220, 245, 250, ${flying ? 0 : 0.6 * (1 - ripple)})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(
      currentX,
      currentY + 3,
      4 + ripple * 9,
      2 + ripple * 3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  // Поплавок
  const x = Math.round(currentX);
  const y = Math.round(currentY);

  // Антенна
  ctx.strokeStyle = "#352e2a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y - 5);
  ctx.stroke();

  // Красная верхняя часть
  ctx.fillStyle = "#e94c42";
  ctx.fillRect(x - 2, y - 5, 5, 5);

  // Белая нижняя часть
  ctx.fillStyle = "#fff2d2";
  ctx.fillRect(x - 2, y, 5, 4);

  // При поклёвке поплавок погружается
  if (biting && !flying) {
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Short landing splash after float reaches water.
  if (!flying && splashStartedAt > 0 && time - splashStartedAt < 0.65) {
    const splash = (time - splashStartedAt) / 0.65;
    ctx.strokeStyle = `rgba(250, 255, 255, ${0.75 * (1 - splash)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      bobberX,
      bobberY + 3,
      3 + splash * 20,
      2 + splash * 7,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function showCatchResult(result: CatchResult): void {
  const { item, weightKg } = result;
  catchImage.src = item.image;
  catchImage.alt = `Pixel art of ${item.name}`;
  catchTitle.textContent = item.name;
  catchEyebrow.textContent =
    item.kind === "fish" ? "A new catch!" : "Something unexpected!";
  catchRarity.textContent = item.rarity;
  catchRarity.className = `catch-card__rarity catch-card__rarity--${item.rarity}`;
  catchWeight.textContent = `${weightKg.toFixed(2)} kg`;

  const price = getSalePrice(item, weightKg);

  catchValue.textContent = price > 0 ? `${price} coins` : "Not for sale";

  catchDescription.textContent = item.description;
  catchDialog.showModal();
}

catchContinue.addEventListener("click", () => catchDialog.close());
catchDialog.addEventListener("close", () => {
  // The pointer release may have happened on the modal, not on Cast.
  ignoreNextClick = false;
  castButton.focus();
});

function updateEquippedRod(): void {
  const rod = getEquippedRod(shopState);

  equippedRodLabel.textContent = `Equipped: ${rod.name}`;
}

function renderShop(): void {
  shopList.replaceChildren();
  const rodsTitle = document.createElement("h3");
  rodsTitle.textContent = "Fishing Rods";
  rodsTitle.className = "shop-section-title";
  shopList.append(rodsTitle);

  for (const rod of RODS) {
    const card = document.createElement("div");
    card.className = "shop-item";

    const equipped = shopState.equippedRodId === rod.id;
    const owned = shopState.ownedRodIds.includes(rod.id);

    if (equipped) {
      card.classList.add("shop-item--equipped");
    }

    const details = document.createElement("div");
    details.className = "shop-item__details";

    const name = document.createElement("strong");
    name.textContent = rod.name;

    const description = document.createElement("p");
    description.textContent = rod.description;

    const price = document.createElement("span");
    price.textContent = rod.price === 0 ? "Free" : `${rod.price} coins`;

    details.append(name, description, price);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-item__action";

    if (equipped) {
      button.textContent = "Equipped ✓";
      button.disabled = true;
    } else if (owned) {
      button.textContent = "Equip";
    } else if (economy.coins < rod.price) {
      button.textContent = "Not enough coins";
      button.disabled = true;
    } else {
      button.textContent = `Buy · ${rod.price}`;
    }

    button.addEventListener("click", () => {
      if (owned) {
        shopState = equipRod(shopState, rod.id);

        status.textContent = `${rod.name} equipped!`;
      } else {
        const result = buyRod(shopState, economy.coins, rod.id);

        if (!result.success) return;

        shopState = result.shop;
        economy.coins = result.coins;

        saveEconomy(economy);

        walletBalance.textContent = String(economy.coins);

        status.textContent = `Purchased and equipped ${rod.name}!`;
      }

      saveShop(shopState);
      updateEquippedRod();
      renderShop();
    });

    card.append(details, button);
    shopList.append(card);
  }

  const destinationsTitle = document.createElement("h3");
  destinationsTitle.textContent = "Fishing Locations";
  destinationsTitle.className = "shop-section-title";
  shopList.append(destinationsTitle);

  for (const destination of FISHING_LOCATIONS) {
    const unlocked = shopState.ownedLocationIds.includes(destination.id);
    const card = document.createElement("div");
    card.className = "shop-item";
    if (unlocked) card.classList.add("shop-item--equipped");
    const details = document.createElement("div");
    details.className = "shop-item__details";
    const title = document.createElement("strong");
    title.textContent = `${unlocked ? "🗺️" : "🔒"} ${destination.name}`;
    const description = document.createElement("p");
    description.textContent = destination.description;
    const price = document.createElement("span");
    price.textContent = unlocked
      ? "Unlocked forever"
      : `${destination.price} coins`;
    details.append(title, description, price);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-item__action";
    if (unlocked) {
      button.textContent =
        activeLocation === destination.id ? "Current location ✓" : "Travel";
      button.disabled = activeLocation === destination.id;
      button.addEventListener("click", () => {
        shopDialog.close();
        locationSelect.value = String(destination.id);
        locationSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });
    } else {
      button.textContent =
        economy.coins < destination.price
          ? "Not enough coins"
          : `Unlock · ${destination.price}`;
      button.disabled = economy.coins < destination.price;
      button.addEventListener("click", () => {
        const result = buyLocation(shopState, economy.coins, destination.id);
        if (!result.success) return;
        shopState = result.shop;
        economy.coins = result.coins;
        saveShop(shopState);
        saveEconomy(economy);
        walletBalance.textContent = String(economy.coins);
        refreshLocationOptions();
        status.textContent = `${destination.name} unlocked! Choose it from Locations.`;
        renderShop();
      });
    }
    card.append(details, button);
    shopList.append(card);
  }
}

shopOpen.addEventListener("click", () => {
  renderShop();
  shopDialog.showModal();
});

shopClose.addEventListener("click", () => {
  shopDialog.close();
});

updateEquippedRod();

function renderInventory(): void {
  inventoryList.replaceChildren();

  const fishIds = new Set(economy.discoveredFishIds);

  const totalSpecies = CATCHES.filter((item) => item.kind === "fish").length;

  inventorySummary.textContent =
    `${caughtFish} fish caught · ` +
    `${fishIds.size}/${totalSpecies} species discovered · ` +
    `${savedCatches.length} total items`;

  const discoveredNames = CATCHES.filter(
    (item) => item.kind === "fish" && fishIds.has(item.id),
  ).map((item) => item.name);

  discoveredSpecies.textContent =
    discoveredNames.length > 0
      ? `Discovered: ${discoveredNames.join(", ")}`
      : "Discovered: none yet";

  if (savedCatches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "inventory-empty";
    empty.textContent = "Your collection is empty. Catch your first fish!";
    inventoryList.append(empty);
    return;
  }

  // Display the latest 50 catches.
  for (const entry of savedCatches.slice(0, 50)) {
    const item = CATCHES.find((catchItem) => catchItem.id === entry.id);

    if (!item) continue;

    const card = document.createElement("div");
    card.className = "inventory-item";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;

    const info = document.createElement("div");
    info.className = "inventory-item__info";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const details = document.createElement("span");
    details.textContent =
      `${item.rarity.toUpperCase()} · ` + `${entry.weightKg.toFixed(2)} kg`;

    info.append(name, details);

    if (item.kind === "fish") {
      const price = getSalePrice(item, entry.weightKg);

      const sellButton = document.createElement("button");
      sellButton.type = "button";
      sellButton.className = "inventory-item__sell";
      sellButton.textContent = `🪙 Sell for ${price}`;

      sellButton.addEventListener("click", () => {
        const index = savedCatches.indexOf(entry);

        // Prevent selling an already removed item.
        if (index === -1) return;

        // Remove only this particular fish.
        savedCatches.splice(index, 1);

        // Add coins to the wallet.
        economy.coins += price;

        // Save both changes.
        saveInventory(savedCatches);
        saveEconomy(economy);

        // Update the interface.
        walletBalance.textContent = String(economy.coins);

        inventoryCount.textContent = String(savedCatches.length);

        renderInventory();
      });

      info.append(sellButton);
    }

    card.append(image, info);
    inventoryList.append(card);
  }
}

inventoryOpen.addEventListener("click", () => {
  renderInventory();
  inventoryDialog.showModal();
});

inventoryClose.addEventListener("click", () => {
  inventoryDialog.close();
});

function finishReeling(success: boolean): void {
  const result = pendingCatch;
  // Avoid accidentally casting again when the held button is released.
  ignoreNextClick = pointerHeld;
  spaceReleasePending = spaceHeld;
  if (success && result) {
    savedCatches.unshift({
      id: result.item.id,
      weightKg: result.weightKg,
      caughtAt: Date.now(),
    });

    // Keep only the latest 500 catches.
    if (savedCatches.length > 500) {
      savedCatches.length = 500;
    }

    if (result.item.kind === "fish") {
      economy.totalFishCaught++;

      if (!economy.discoveredFishIds.includes(result.item.id)) {
        economy.discoveredFishIds.push(result.item.id);
      }
    }

    saveInventory(savedCatches);
    saveEconomy(economy);

    caughtFish = economy.totalFishCaught;

    catchCount.textContent = String(caughtFish);
    inventoryCount.textContent = String(savedCatches.length);
    walletBalance.textContent = String(economy.coins);

    resetFishing(
      result.item.kind === "fish"
        ? `You caught ${result.item.name}! Total fish caught: ${caughtFish}.`
        : `You found ${result.item.name}! Keep fishing for your next catch.`,
    );
    showCatchResult(result);
  } else {
    resetFishing("The fishing line snapped! Let it relax next time.");
  }
}

castButton.addEventListener("click", () => {
  if (ignoreNextClick) {
    ignoreNextClick = false;
    return;
  }
  if (phase === "ready") {
    castLine();
  } else if (phase === "waiting") {
    resetFishing("Too early! No fish this time.");
  } else if (phase === "bite") {
    startReeling();
  }
  // When reeling, click does nothing. Holding the button controls the line.
});

castButton.addEventListener("pointerdown", (event) => {
  if (phase !== "reeling") return;
  pointerHeld = true;
  castButton.setPointerCapture(event.pointerId);
});

function releasePointer(): void {
  pointerHeld = false;
}

castButton.addEventListener("pointerup", releasePointer);
castButton.addEventListener("pointercancel", releasePointer);
castButton.addEventListener("lostpointercapture", releasePointer);

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || phase !== "reeling") return;
  event.preventDefault();
  spaceHeld = true;
});

window.addEventListener("keyup", (event) => {
  if (event.code !== "Space") return;
  if (phase !== "reeling" && !spaceReleasePending) return;
  event.preventDefault();
  spaceHeld = false;
  spaceReleasePending = false;
});

window.addEventListener("blur", () => {
  pointerHeld = false;
  spaceHeld = false;
});

async function startGame(): Promise<void> {
  try {
    const [background, fisherman] = await Promise.all([
      loadImage(new URL(location.background, import.meta.url).href),
      loadImage(new URL(location.fisherman, import.meta.url).href),
    ]);

    const art: GameArt = { background, fisherman };
    // Change art while preserving coins, catches and game state.
    locationSelect.addEventListener("change", async () => {
      const next = Number(locationSelect.value) as LocationId;
      if (phase !== "ready" || !(next in LOCATIONS)) {
        updateLocationLabels();
        return;
      }
      if (!shopState.ownedLocationIds.includes(next as ShopLocationId)) {
        const destination = FISHING_LOCATIONS.find((item) => item.id === next);
        updateLocationLabels();
        status.textContent = `${destination?.name ?? "Location"} is locked. Unlock it in the Shop.`;
        renderShop();
        shopDialog.showModal();
        return;
      }
      locationSelect.disabled = true;
      try {
        const config = LOCATIONS[next];
        const [newBackground, newFisherman] = await Promise.all([
          loadImage(new URL(config.background, import.meta.url).href),
          loadImage(new URL(config.fisherman, import.meta.url).href),
        ]);
        art.background = newBackground;
        art.fisherman = newFisherman;
        activeLocation = next;
        location = config;
        updateLocationLabels();
        status.textContent = `Ready to fish at ${location.name}!`;
      } catch (error) {
        console.error("Failed to load location", error);
        updateLocationLabels();
        status.textContent = "Failed to load this location.";
      } finally {
        locationSelect.disabled = phase !== "ready";
      }
    });

    function animate(timestamp: number): void {
      if (lastFrame === 0 || timestamp - lastFrame >= 33) {
        const deltaSeconds =
          lastFrame === 0 ? 0 : (timestamp - lastFrame) / 1000;
        lastFrame = timestamp;

        if (phase === "reeling") {
          reelState = nextReelState(
            reelState,
            pointerHeld || spaceHeld,
            deltaSeconds,
            getEquippedRod(shopState).tensionMultiplier,
            pendingCatch ? getCatchResistance(pendingCatch) : 1,
          );

          updateMeters();

          // Once the player has gained progress, losing all of it means
          // the fish escapes immediately.
          if (reelState.progress > 0) {
            hasMadeReelProgress = true;
            zeroProgressIdleSeconds = 0;
          } else if (!pointerHeld && !spaceHeld) {
            // A newly hooked fish can wait at 0% for only five seconds.
            zeroProgressIdleSeconds += Math.max(0, Math.min(deltaSeconds, 0.1));
          }

          if (reelState.tension >= 100) {
            finishReeling(false);
          } else if (reelState.progress >= 100) {
            finishReeling(true);
          } else if (hasMadeReelProgress && reelState.progress <= 0) {
            resetFishing(
              "The fish escaped! Your reeling progress fell to zero.",
            );
          } else if (zeroProgressIdleSeconds >= ZERO_PROGRESS_ESCAPE_SECONDS) {
            resetFishing(
              "The fish escaped! You waited five seconds without reeling.",
            );
          }
        }

        drawScene(art, timestamp / 1000);
      }
      window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    status.textContent =
      "The game artwork could not be loaded. Please refresh the page.";
    castButton.disabled = true;
  }
}

void startGame();
