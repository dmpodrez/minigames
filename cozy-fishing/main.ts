import "./styles.scss";
import "./reeling.scss";
import { nextReelState, type ReelState } from "./game/reeling";

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
let caughtFish = 0;
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

function finishReeling(success: boolean): void {
  // Avoid accidentally casting again when the held button is released.
  ignoreNextClick = pointerHeld;
  spaceReleasePending = spaceHeld;
  if (success) {
    caughtFish++;
    catchCount.textContent = String(caughtFish);
    resetFishing(`You caught a fish! Total catches: ${caughtFish}.`);
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
