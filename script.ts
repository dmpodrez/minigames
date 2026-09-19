import "./style.scss";
import { renderApp } from "./view";

renderApp();

interface Game {
  name: string;
  cardImage: string;
  rating: number;
  likesCount: number;
}

interface GamesResponse {
  data: Game[];
}

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return element;
}

const gamesTrack = getElement<HTMLElement>(".games-track");
const nextButton = getElement<HTMLButtonElement>(".slider-next");
const prevButton = getElement<HTMLButtonElement>(".slider-prev");
const gamesViewport = getElement<HTMLElement>(".games-viewport");
const leaderboardBody =
  getElement<HTMLTableSectionElement>(".leaderboard-body");
let games: Game[] = [];
let currentIndex = 0;
let isSliderAnimating = false;

type SlideDirection = "next" | "previous";

function formatLikes(count: number): string {
  return `${(count / 1000).toFixed(1)}K`;
}

function isCompactSlider(): boolean {
  return window.innerWidth <= 768;
}

function wrapIndex(index: number): number {
  if (games.length === 0) {
    return 0;
  }

  return ((index % games.length) + games.length) % games.length;
}

async function loadGames(): Promise<void> {
  const response = await fetch("/assets/data/all-games-seed.json");

  if (!response.ok) {
    throw new Error(`Failed to load games: ${response.status}`);
  }

  const result: GamesResponse = await response.json();

  games = result.data;
  currentIndex = 0;

  renderGames();
}

function renderGames(): void {
  if (games.length === 0) {
    return;
  }

  const compact = isCompactSlider();

  const offsets = compact ? [-1, 0, 1] : [-2, -1, 0, 1, 2];

  gamesTrack.innerHTML = offsets
    .map((offset) => {
      const gameIndex = wrapIndex(currentIndex + offset);
      const game = games[gameIndex];

      const isActive = offset === 0;
      const isEdge = !compact && Math.abs(offset) === 2;

      const showOverlay = compact ? isActive : Math.abs(offset) <= 1;

      const cardClasses = [
        "game-card",
        isActive ? "game-card--active" : "",
        isEdge ? "game-card--edge" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <article class="${cardClasses}">
          <img
            class="game-image"
            src="${game.cardImage}"
            alt="${game.name}"
          >

          <div
            class="game-overlay ${showOverlay ? "" : "game-overlay--hidden"}"
          >
            <h3>${game.name}</h3>

            <div class="game-info">
              <span class="game-rating">
                <img src="/assets/svg/star.svg" alt="">
                ${game.rating}
              </span>

              <span class="game-likes">
                <img src="/assets/svg/heart.svg" alt="">
                ${formatLikes(game.likesCount)}
              </span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function changeSlide(direction: SlideDirection): Promise<void> {
  if (isSliderAnimating || games.length === 0) {
    return;
  }

  isSliderAnimating = true;

  const isNext = direction === "next";

  const exitX = isNext ? "-18px" : "18px";
  const enterX = isNext ? "18px" : "-18px";

  const exitAnimation = gamesTrack.animate(
    [
      {
        transform: "translateX(0)",
        opacity: 1,
      },
      {
        transform: `translateX(${exitX})`,
        opacity: 0.35,
      },
    ],
    {
      duration: 140,
      easing: "ease-in",
      fill: "both",
    },
  );

  try {
    await exitAnimation.finished;
  } catch {
    // Animation can be cancelled during resize.
  }

  exitAnimation.cancel();

  currentIndex = wrapIndex(currentIndex + (isNext ? 1 : -1));

  renderGames();

  const enterAnimation = gamesTrack.animate(
    [
      {
        transform: `translateX(${enterX})`,
        opacity: 0.35,
      },
      {
        transform: "translateX(0)",
        opacity: 1,
      },
    ],
    {
      duration: 260,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );

  try {
    await enterAnimation.finished;
  } catch {
    // Animation can be cancelled during resize.
  }

  enterAnimation.cancel();

  isSliderAnimating = false;
}

nextButton.addEventListener("click", () => {
  void changeSlide("next");
});

prevButton.addEventListener("click", () => {
  void changeSlide("previous");
});

let swipeStartX = 0;
let swipeStartY = 0;
let swipePointerId: number | null = null;

const SWIPE_THRESHOLD = 40;

gamesViewport.addEventListener("pointerdown", (event: PointerEvent) => {
  if (!isCompactSlider() || event.pointerType === "mouse") {
    return;
  }

  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
  swipePointerId = event.pointerId;
});

gamesViewport.addEventListener("pointerup", (event: PointerEvent) => {
  if (event.pointerId !== swipePointerId) {
    return;
  }

  const deltaX = event.clientX - swipeStartX;
  const deltaY = event.clientY - swipeStartY;

  swipePointerId = null;

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    return;
  }

  if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
    return;
  }

  if (deltaX < 0) {
    void changeSlide("next");
    return;
  }

  void changeSlide("previous");
});

gamesViewport.addEventListener("pointercancel", () => {
  swipePointerId = null;
});

/* =========================
   RESPONSIVE
   ========================= */

let compactSlider = isCompactSlider();

window.addEventListener("resize", () => {
  const nextCompactSlider = isCompactSlider();

  if (nextCompactSlider !== compactSlider) {
    compactSlider = nextCompactSlider;

    gamesTrack.getAnimations().forEach((animation) => {
      animation.cancel();
    });

    isSliderAnimating = false;

    renderGames();
  }
});

loadGames().catch((error: unknown) => {
  console.error(error);
});

interface Player {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}

interface LeaderboardResponse {
  data: Player[];
}
async function loadLeaderboard(): Promise<void> {
  const response = await fetch("/assets/data/leaderboard.json");

  if (!response.ok) {
    throw new Error(`Failed to load leaderboard: ${response.status}`);
  }

  const result: LeaderboardResponse = await response.json();

  renderLeaderboard(result.data);
}
function renderLeaderboard(players: Player[]): void {
  leaderboardBody.innerHTML = players
    .map((player) => {
      return `
        <tr class="leaderboard-row">
          <td class="leaderboard-rank ${
            player.rank === 1 ? "leaderboard-rank--first" : ""
          }">
            #${player.rank}
          </td>

          <td class="leaderboard-player">
            <div class="leaderboard-player__content">
              <span class="player-avatar player-avatar--rank-${player.rank}">
                ${getInitials(player.playerName)}
              </span>
              <span>${player.playerName}</span>
            </div>
          </td>

          <td>${player.gamesPlayed}</td>
          <td>${player.totalScore.toLocaleString("en-US")}</td>

          <td>
            🔥 ${player.streakDays} days
          </td>

          <td>
            <span class="favorite-game">
              ${player.favoriteGameName}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}
function getInitials(name: string): string {
  const words = name.split(/[_\s]+/);

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  const capitals = name.match(/[A-Z]/g);

  if (capitals && capitals.length >= 2) {
    return capitals.slice(0, 2).join("");
  }

  return name.slice(0, 2).toUpperCase();
}
loadLeaderboard().catch((error: unknown) => {
  console.error(error);
});

type AuthMode = "login" | "register";

const authDialog = getElement<HTMLDialogElement>(".auth-dialog");

const authOpenButtons =
  document.querySelectorAll<HTMLButtonElement>(".auth-open");

const authTabs =
  document.querySelectorAll<HTMLButtonElement>("[data-auth-tab]");

const authPanels = document.querySelectorAll<HTMLElement>("[data-auth-panel]");

const authSwitchButtons =
  document.querySelectorAll<HTMLButtonElement>("[data-auth-switch]");

const authForms = document.querySelectorAll<HTMLFormElement>(".auth-form");

function setAuthMode(mode: AuthMode): void {
  authTabs.forEach((tab) => {
    const isActive = tab.dataset.authTab === mode;

    tab.classList.toggle("auth-tab--active", isActive);
  });

  authPanels.forEach((panel) => {
    const isActive = panel.dataset.authPanel === mode;

    panel.classList.toggle("auth-panel--active", isActive);
  });
}

function openAuthDialog(mode: AuthMode): void {
  setAuthMode(mode);

  if (!authDialog.open) {
    authDialog.showModal();
  }
}

function closeAuthDialog(): void {
  if (!authDialog.open) {
    return;
  }

  authDialog.classList.add("auth-dialog--closing");

  window.setTimeout(() => {
    authDialog.close();
    authDialog.classList.remove("auth-dialog--closing");
  }, 200);
}

authOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.authMode as AuthMode;

    openAuthDialog(mode);
  });
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.authTab as AuthMode;

    setAuthMode(mode);
  });
});

authSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.authSwitch as AuthMode;

    setAuthMode(mode);
  });
});

authDialog.addEventListener("click", (event: MouseEvent) => {
  if (event.target === authDialog) {
    closeAuthDialog();
  }
});

authDialog.addEventListener("cancel", (event: Event) => {
  event.preventDefault();
  closeAuthDialog();
});

authForms.forEach((form) => {
  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();
  });
});
const passwordToggleButtons =
  document.querySelectorAll<HTMLButtonElement>(".password-toggle");

passwordToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const authInput = button.closest(".auth-input");

    if (!authInput) {
      return;
    }

    const input = authInput.querySelector<HTMLInputElement>("input");

    if (!input) {
      return;
    }

    const isPasswordHidden = input.type === "password";

    input.type = isPasswordHidden ? "text" : "password";

    button.setAttribute(
      "aria-label",
      isPasswordHidden ? "Hide password" : "Show password",
    );
  });
});
/* Mobile menu */

const burgerButton = getElement<HTMLButtonElement>(".burger-button");

const mobileMenuOverlay = getElement<HTMLElement>(".mobile-menu-overlay");

const mobileMenuLinks =
  document.querySelectorAll<HTMLAnchorElement>(".mobile-menu-nav a");

const mobileMenuAuthButtons = document.querySelectorAll<HTMLButtonElement>(
  ".mobile-menu .auth-open",
);

function openMobileMenu(): void {
  mobileMenuOverlay.classList.add("mobile-menu-overlay--open");
  burgerButton.classList.add("burger-button--active");

  burgerButton.setAttribute("aria-expanded", "true");
  burgerButton.setAttribute("aria-label", "Close menu");
  mobileMenuOverlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("menu-open");
}

function closeMobileMenu(): void {
  mobileMenuOverlay.classList.remove("mobile-menu-overlay--open");
  burgerButton.classList.remove("burger-button--active");

  burgerButton.setAttribute("aria-expanded", "false");
  burgerButton.setAttribute("aria-label", "Open menu");
  mobileMenuOverlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("menu-open");
}

function toggleMobileMenu(): void {
  const isOpen = mobileMenuOverlay.classList.contains(
    "mobile-menu-overlay--open",
  );

  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

burgerButton.addEventListener("click", toggleMobileMenu);

/* Close by clicking backdrop */
mobileMenuOverlay.addEventListener("click", (event: MouseEvent) => {
  if (event.target === mobileMenuOverlay) {
    closeMobileMenu();
  }
});

/* Close after clicking navigation link */
mobileMenuLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

/* Close menu when Login / Sign Up opens auth dialog */
mobileMenuAuthButtons.forEach((button) => {
  button.addEventListener("click", closeMobileMenu);
});

/* Close with Escape */
document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (
    event.key === "Escape" &&
    mobileMenuOverlay.classList.contains("mobile-menu-overlay--open")
  ) {
    closeMobileMenu();
  }
});

/* Safety: close menu when returning to desktop */
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});
