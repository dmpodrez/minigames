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
let isAnimating = false;

function formatLikes(count: number): string {
  return `${(count / 1000).toFixed(1)}K`;
}

async function loadGames(): Promise<void> {
  const response = await fetch("./assets/data/all-games-seed.json");

  if (!response.ok) {
    throw new Error(`Failed to load games: ${response.status}`);
  }

  const result: GamesResponse = await response.json();

  games = result.data;
  currentIndex = games.length;

  renderGames();
}

function renderGames(): void {
  const sliderGames: Game[] = [...games, ...games, ...games];

  gamesTrack.innerHTML = sliderGames
    .map((game, index) => {
      return `
        <article class="game-card ${
          index === currentIndex ? "game-card--active" : ""
        }">
          <img
            class="game-image"
            src=".${game.cardImage}"
            alt="${game.name}"
          >

          <div class="game-overlay">
            <h3>${game.name}</h3>

            <div class="game-info">
              <span class="game-rating">
                <img src="./assets/svg/star.svg" alt="">
                ${game.rating}
              </span>

              <span class="game-likes">
                <img src="./assets/svg/heart.svg" alt="">
                ${formatLikes(game.likesCount)}
              </span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  updateSlider(false);
}

function updateSlider(animate = true): void {
  const cards = gamesTrack.querySelectorAll<HTMLElement>(".game-card");

  const showThreeCards = window.innerWidth <= 768;

  cards.forEach((card, index) => {
    const distanceFromActive = index - currentIndex;

    const isActive = distanceFromActive === 0;

    const isVisible = showThreeCards
      ? Math.abs(distanceFromActive) <= 1
      : Math.abs(distanceFromActive) <= 2;

    const isEdge = !showThreeCards && Math.abs(distanceFromActive) === 2;

    const shouldShowOverlay = Math.abs(distanceFromActive) <= 1;

    card.classList.toggle("game-card--active", isActive);

    card.classList.toggle("game-card--edge", isEdge);

    card.classList.toggle("game-card--hidden", !isVisible);

    const gameOverlay = card.querySelector<HTMLElement>(".game-overlay");

    gameOverlay?.classList.toggle("game-overlay--hidden", !shouldShowOverlay);
  });

  /*
   * <= 768px
   *
   * У нас остаются только:
   * previous + active + next.
   *
   * Они сами занимают ровно 100% viewport,
   * поэтому сдвиг ленты здесь НЕ нужен.
   */
  if (showThreeCards) {
    gamesTrack.style.transition = "none";
    gamesTrack.style.transform = "translateX(0)";
    isAnimating = false;

    return;
  }

  /* Desktop slider */

  const activeCard = cards[currentIndex];

  if (!activeCard) {
    return;
  }

  gamesTrack.style.transition = animate ? "transform 0.4s ease" : "none";

  const offset =
    activeCard.offsetLeft -
    (gamesViewport.clientWidth - activeCard.clientWidth) / 2;

  gamesTrack.style.transform = `translateX(-${offset}px)`;

  if (!animate) {
    void gamesTrack.offsetWidth;
  }
}
window.addEventListener("resize", () => {
  updateSlider(false);
});
nextButton.addEventListener("click", () => {
  if (isAnimating) {
    return;
  }

  isAnimating = true;
  currentIndex++;
  updateSlider();
});

prevButton.addEventListener("click", () => {
  if (isAnimating) {
    return;
  }

  isAnimating = true;
  currentIndex--;
  updateSlider();
});
window.addEventListener("resize", () => {
  updateSlider(false);
});
gamesTrack.addEventListener("transitionend", (event: TransitionEvent) => {
  if (event.propertyName !== "transform") {
    return;
  }

  const total = games.length;

  if (currentIndex < total) {
    currentIndex += total;
    updateSlider(false);
  }

  if (currentIndex >= total * 2) {
    currentIndex -= total;
    updateSlider(false);
  }

  isAnimating = false;
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
  const response = await fetch("./assets/data/leaderboard.json");

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
