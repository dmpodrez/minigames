import "./styles.scss";
import "./reeling.scss";
import "./catch.scss";
import { generateCatch, type CatchResult } from "./game/catches";
import { nextReelState, type ReelState } from "./game/reeling";
import "./inventory.scss";
import { getSalePrice, loadEconomy, saveEconomy } from "./game/economy";
import { CATCHES } from "./game/catches";
import { loadInventory, saveInventory } from "./game/inventory";
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

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Cozy Fishing: Canvas 2D is not supported");
}
const ctx = context;

const WIDTH = 640;
const HEIGHT = 360;

const ART = {
  background: new URL("./assets/lake-background.png", import.meta.url).href,
  pier: new URL("./assets/wooden-pier.png", import.meta.url).href,
  fisherman: new URL("./assets/fisherman-sprites.png", import.meta.url).href,
};

interface GameArt {
  background: HTMLImageElement;
  pier: HTMLImageElement;
  fisherman: HTMLImageElement;
}

type FishingPhase = "ready" | "waiting" | "bite" | "reeling";

let phase: FishingPhase = "ready";

const savedCatches = loadInventory();
const economy = loadEconomy(savedCatches);

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

ctx.imageSmoothingEnabled = false;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load art: ${src}`));
    image.src = src;
  });
}

function drawWaterDetails(time: number): void {
  ctx.save();
  ctx.globalAlpha = 0.22;

  for (let i = 0; i < 24; i++) {
    const x = (i * 139 + Math.sin(time * 0.75 + i) * 5 + WIDTH) % WIDTH;
    const y = 222 + ((i * 53) % 133);
    ctx.fillStyle = i % 3 === 0 ? "#f4d5a7" : "#a3c2b7";
    ctx.fillRect(Math.round(x), y, 4 + (i % 4) * 2, 1);
  }

  ctx.restore();
}

function drawFisherman(art: GameArt, time: number): void {
  const frame = time % 4.5 < 0.14 ? 1 : 0;
  ctx.drawImage(art.fisherman, frame * 48, 0, 48, 64, 486, 185, 60, 80);
}

function drawFishingRod(time: number): void {
  const handX = 497;
  const handY = 240;
  const tipX = 409;
  const tipY = 178;

  ctx.lineCap = "round";
  ctx.strokeStyle = "#342e2d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.quadraticCurveTo(451, 193, tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = "#dfbc81";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(445, 190);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  if (phase === "ready") return;

  const isBiting = phase === "bite" || phase === "reeling";
  const bobberX = 390;
  const bobberY =
    274 + Math.sin(time * (isBiting ? 13 : 2)) * (isBiting ? 4 : 2);

  ctx.strokeStyle = "#e9e7da";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(bobberX, bobberY);
  ctx.stroke();

  ctx.strokeStyle = "#8dc1c1";
  ctx.beginPath();
  ctx.ellipse(
    bobberX,
    bobberY + 4,
    9 + Math.sin(time * 3),
    3,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();

  ctx.fillStyle = "#f1eddf";
  ctx.fillRect(bobberX - 2, Math.round(bobberY) - 5, 5, 5);
  ctx.fillStyle = "#df6857";
  ctx.fillRect(bobberX - 2, Math.round(bobberY), 5, 6);
}

function drawScene(art: GameArt, time: number): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(art.background, 0, 0, WIDTH, HEIGHT);
  drawWaterDetails(time);
  ctx.drawImage(art.pier, 440, 174);
  drawFisherman(art, time);
  drawFishingRod(time);
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
  phase = "ready";
  pointerHeld = false;
  spaceHeld = false;
  reelPanel.hidden = true;
  updateButton();
  status.textContent = message;
}

function castLine(): void {
  clearFishingTimers();
  phase = "waiting";
  status.textContent = "Waiting for a fish to bite...";
  updateButton();

  const delay = 2000 + Math.random() * 3500;
  biteTimer = window.setTimeout(() => {
    if (phase !== "waiting") return;
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
  reelPanel.hidden = false;
  updateButton();
  updateMeters();
  status.textContent =
    "Hold to reel. Release before the line tension reaches 100%!";
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
  // Avoid accidentally casting again when the held button is released.
  ignoreNextClick = pointerHeld;
  spaceReleasePending = spaceHeld;
  if (success) {
    const result = generateCatch();

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
    const [background, pier, fisherman] = await Promise.all([
      loadImage(ART.background),
      loadImage(ART.pier),
      loadImage(ART.fisherman),
    ]);
    const art: GameArt = { background, pier, fisherman };

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
          );
          updateMeters();

          if (reelState.tension >= 100) {
            finishReeling(false);
          } else if (reelState.progress >= 100) {
            finishReeling(true);
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
