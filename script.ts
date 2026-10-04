import "./style.scss";
import {
  getFeaturedGames,
  getLeaderboard,
  type Game,
  type Player,
} from "./api";
import { renderApp } from "./view";

renderApp();

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return element;
}

type SnackbarVariant = "success" | "error";

const snackbar = document.createElement("div");
snackbar.className = "api-snackbar";
snackbar.setAttribute("role", "status");
snackbar.setAttribute("aria-live", "polite");
document.body.append(snackbar);

let snackbarTimer: number | null = null;

function showSnackbar(message: string, variant: SnackbarVariant): void {
  snackbar.textContent = message;
  snackbar.className = `api-snackbar api-snackbar--${variant} api-snackbar--visible`;

  if (snackbarTimer !== null) {
    window.clearTimeout(snackbarTimer);
  }

  snackbarTimer = window.setTimeout(() => {
    snackbar.classList.remove("api-snackbar--visible");
    snackbarTimer = null;
  }, 3200);
}

function apiStateMarkup(
  message: string,
  kind: "empty" | "error",
  retryAction?: string,
): string {
  const retryButton = retryAction
    ? `<button type="button" class="api-state__retry" data-api-retry="${retryAction}">Retry</button>`
    : "";

  return `
    <div class="api-state api-state--${kind}">
      <strong>${message}</strong>
      ${retryButton}
    </div>
  `;
}

function sliderSkeletonMarkup(): string {
  return Array.from(
    { length: isCompactSlider() ? 3 : 5 },
    () => `
      <article class="game-card api-skeleton-card" aria-hidden="true">
        <span class="api-skeleton api-skeleton--fill"></span>
      </article>
    `,
  ).join("");
}

function leaderboardSkeletonMarkup(): string {
  return Array.from(
    { length: 5 },
    () => `
      <tr class="api-skeleton-row" aria-hidden="true">
        ${Array.from({ length: 6 }, () => '<td><span class="api-skeleton api-skeleton--line"></span></td>').join("")}
      </tr>
    `,
  ).join("");
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
function formatCompactScore(score: number): string {
  return `${(score / 1000).toFixed(1)}K`;
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
  games = [];
  gamesTrack.innerHTML = sliderSkeletonMarkup();

  try {
    const result = await getFeaturedGames();
    games = result.data;
    currentIndex = 0;

    if (games.length === 0) {
      gamesTrack.innerHTML = apiStateMarkup(
        "No featured games found.",
        "empty",
      );
      return;
    }

    renderGames();
  } catch {
    gamesTrack.innerHTML = apiStateMarkup(
      "Featured games could not be loaded.",
      "error",
      "featured",
    );
    showSnackbar("Failed to load featured games.", "error");
  }
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
        <article class="${cardClasses}" data-slider-card>
          <img
            class="game-image"
            src="${game.cardImage}"
            alt="${game.name}"
            draggable="false"
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

  window.requestAnimationFrame(syncStory2SliderOverlays);
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
const SWIPE_THRESHOLD = 40;

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

void loadGames();

async function loadLeaderboard(): Promise<void> {
  leaderboardBody.innerHTML = leaderboardSkeletonMarkup();

  try {
    const result = await getLeaderboard();

    if (result.data.length === 0) {
      leaderboardBody.innerHTML = `
        <tr>
          <td colspan="6">
            ${apiStateMarkup("No leaderboard data found.", "empty")}
          </td>
        </tr>
      `;
      return;
    }

    renderLeaderboard(result.data);
  } catch {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="6">
          ${apiStateMarkup(
            "Leaderboard could not be loaded.",
            "error",
            "leaderboard",
          )}
        </td>
      </tr>
    `;
    showSnackbar("Failed to load leaderboard.", "error");
  }
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
          <td>
            <span class="score-full">
              ${player.totalScore.toLocaleString("en-US")}
            </span>

            <span class="score-mobile">
              ${formatCompactScore(player.totalScore)}
            </span>
          </td>

          <td>
            🔥
            <span class="streak-full">
              ${player.streakDays} days
            </span>

            <span class="streak-compact">
              ${player.streakDays}d
            </span>
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
void loadLeaderboard();

document.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const retryButton = target.closest<HTMLButtonElement>("[data-api-retry]");

  if (!retryButton) {
    return;
  }

  const action = retryButton.dataset.apiRetry;

  if (action === "featured") {
    void loadGames();
  }

  if (action === "leaderboard") {
    void loadLeaderboard();
  }
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

/* =========================
   STORY 2 — SPA + LIBRARY
   ========================= */

type PageName = "home" | "library";

interface LibraryGame extends Game {
  slug: string;
  category: string;
  price: string;
  shortDescription: string;
  featured: boolean;
}

interface LibraryGamesResponse {
  data: LibraryGame[];
}

const homePage = getElement<HTMLElement>('[data-page-view="home"]');
const libraryPage = getElement<HTMLElement>('[data-page-view="library"]');
const pageLinks =
  document.querySelectorAll<HTMLAnchorElement>("[data-page-link]");
const libraryGrid = getElement<HTMLElement>(".library-grid");
const libraryChips =
  document.querySelectorAll<HTMLButtonElement>(".library-chip");
const librarySort = getElement<HTMLElement>(".library-sort");
const librarySortTrigger = getElement<HTMLButtonElement>(
  ".library-sort-trigger",
);
const librarySortValue = getElement<HTMLElement>(".library-sort-value");
const librarySortMenu = getElement<HTMLElement>(".library-sort-menu");
const librarySortOptions =
  librarySortMenu.querySelectorAll<HTMLButtonElement>("[data-sort-value]");
const paginationPages = getElement<HTMLElement>(".pagination-pages");
const paginationPrev = getElement<HTMLButtonElement>(".pagination-prev");
const paginationNext = getElement<HTMLButtonElement>(".pagination-next");

let libraryGames: LibraryGame[] = [];
let libraryPageNumber = 1;
const LIBRARY_PAGE_COUNT = 6;

function setActiveNavigation(page: PageName): void {
  pageLinks.forEach((link) => {
    const isActive = link.dataset.pageLink === page;
    link.classList.toggle("page-link--active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function showPage(page: PageName): void {
  homePage.hidden = page !== "home";
  libraryPage.hidden = page !== "library";
  setActiveNavigation(page);

  if (page === "library") {
    closeMobileMenu();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event: MouseEvent) => {
    const page = link.dataset.pageLink;

    if (page !== "home" && page !== "library") {
      return;
    }

    event.preventDefault();
    showPage(page);
  });
});

function libraryCardTemplate(game: LibraryGame): string {
  return `
    <article class="library-card">
      <div class="library-card-image-wrap">
        <img
          class="library-card-image"
          src="${game.cardImage}"
          alt="${game.name}"
        >
      </div>

      <div class="library-card-body">
        <div class="library-card-heading">
          <div>
            <p class="library-card-category">${game.category}</p>
            <h2>${game.name}</h2>
          </div>

          <span class="library-card-price">${game.price}</span>
        </div>

        <p class="library-card-description">
          ${game.shortDescription}
        </p>

        <div class="library-card-meta">
          <span>
            <img src="/assets/svg/star.svg" alt="">
            ${game.rating}
          </span>

          <span>
            <img src="/assets/svg/heart.svg" alt="">
            ${formatLikes(game.likesCount)}
          </span>
        </div>

        <button
          class="library-details-button"
          type="button"
          data-game-details-open
        >
          Details
        </button>
      </div>
    </article>
  `;
}

function renderLibraryCards(): void {
  libraryGrid.innerHTML = libraryGames
    .slice(0, 12)
    .map(libraryCardTemplate)
    .join("");
}

async function loadLibraryGames(): Promise<void> {
  const response = await fetch("/assets/data/all-games-seed.json");

  if (!response.ok) {
    throw new Error(`Failed to load library games: ${response.status}`);
  }

  const result: LibraryGamesResponse = await response.json();
  libraryGames = result.data;
  renderLibraryCards();
}

libraryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    libraryChips.forEach((item) => {
      const isCurrent = item === chip;
      item.classList.toggle("library-chip--active", isCurrent);
      item.setAttribute("aria-pressed", String(isCurrent));
    });
  });
});

function closeSortMenu(): void {
  librarySortMenu.hidden = true;
  librarySortTrigger.setAttribute("aria-expanded", "false");
}

librarySortTrigger.addEventListener("click", () => {
  const shouldOpen = librarySortMenu.hidden;
  librarySortMenu.hidden = !shouldOpen;
  librarySortTrigger.setAttribute("aria-expanded", String(shouldOpen));
});

librarySortOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const value = option.dataset.sortValue;

    if (!value) {
      return;
    }

    librarySortValue.textContent = value;

    librarySortOptions.forEach((item) => {
      item.setAttribute("aria-selected", String(item === option));
    });

    closeSortMenu();
  });
});

document.addEventListener("click", (event: MouseEvent) => {
  if (
    !librarySortMenu.hidden &&
    event.target instanceof Node &&
    !librarySort.contains(event.target)
  ) {
    closeSortMenu();
  }
});

function visiblePaginationNumbers(): number[] {
  const visibleCount = window.innerWidth <= 600 ? 3 : 4;
  const half = Math.floor(visibleCount / 2);

  let start = Math.max(1, libraryPageNumber - half);
  let end = start + visibleCount - 1;

  if (end > LIBRARY_PAGE_COUNT) {
    end = LIBRARY_PAGE_COUNT;
    start = Math.max(1, end - visibleCount + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function renderPagination(): void {
  paginationPages.innerHTML = visiblePaginationNumbers()
    .map(
      (page) => `
        <button
          class="pagination-page ${
            page === libraryPageNumber ? "pagination-page--active" : ""
          }"
          type="button"
          data-page-number="${page}"
          aria-label="Page ${page}"
          ${page === libraryPageNumber ? 'aria-current="page"' : ""}
        >
          ${page}
        </button>
      `,
    )
    .join("");

  paginationPrev.disabled = libraryPageNumber === 1;
  paginationNext.disabled = libraryPageNumber === LIBRARY_PAGE_COUNT;
}

function setLibraryPage(page: number): void {
  libraryPageNumber = Math.min(LIBRARY_PAGE_COUNT, Math.max(1, page));
  renderPagination();
}

paginationPages.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const page = Number(target.dataset.pageNumber);

  if (Number.isInteger(page)) {
    setLibraryPage(page);
  }
});

paginationPrev.addEventListener("click", () => {
  if (!paginationPrev.disabled) {
    setLibraryPage(libraryPageNumber - 1);
  }
});

paginationNext.addEventListener("click", () => {
  if (!paginationNext.disabled) {
    setLibraryPage(libraryPageNumber + 1);
  }
});

window.addEventListener("resize", renderPagination);

loadLibraryGames().catch((error: unknown) => {
  console.error(error);
});
renderPagination();
showPage("home");

/* =========================
   STORY 2 — GAME DETAILS
   ========================= */

const gameDetailsDialog = getElement<HTMLDialogElement>(".game-details-dialog");
const gameDetailsClose = getElement<HTMLButtonElement>(".game-details-close");
const favoriteButton = getElement<HTMLButtonElement>(".game-favorite-button");
const commentForm = getElement<HTMLFormElement>(".comment-form");
const commentTextarea = getElement<HTMLTextAreaElement>("#game-comment");
const commentLikes =
  document.querySelectorAll<HTMLButtonElement>(".comment-like");

function resetGameDetailsState(): void {
  favoriteButton.classList.remove("game-favorite-button--active");
  favoriteButton.setAttribute("aria-pressed", "false");
  favoriteButton.textContent = "♡ Add to Favorites";

  commentTextarea.value = "";
  commentTextarea.style.height = "";
  commentTextarea.style.overflowY = "hidden";

  commentLikes.forEach((button) => {
    button.classList.remove("comment-like--active");
    button.setAttribute("aria-pressed", "false");
    button.firstChild?.replaceWith("♡ ");
  });
}

function openGameDetailsDialog(): void {
  resetGameDetailsState();

  if (!gameDetailsDialog.open) {
    gameDetailsDialog.showModal();
  }
}

function closeGameDetailsDialog(): void {
  if (!gameDetailsDialog.open) {
    return;
  }

  gameDetailsDialog.classList.add("game-details-dialog--closing");

  window.setTimeout(() => {
    gameDetailsDialog.close();
    gameDetailsDialog.classList.remove("game-details-dialog--closing");
    resetGameDetailsState();
  }, 180);
}

document.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (target instanceof Element && target.closest("[data-game-details-open]")) {
    openGameDetailsDialog();
  }
});

gameDetailsClose.addEventListener("click", closeGameDetailsDialog);

gameDetailsDialog.addEventListener("click", (event: MouseEvent) => {
  if (event.target === gameDetailsDialog) {
    closeGameDetailsDialog();
  }
});

gameDetailsDialog.addEventListener("cancel", (event: Event) => {
  event.preventDefault();
  closeGameDetailsDialog();
});

favoriteButton.addEventListener("click", () => {
  const isActive = favoriteButton.getAttribute("aria-pressed") === "true";
  const nextActive = !isActive;

  favoriteButton.setAttribute("aria-pressed", String(nextActive));
  favoriteButton.classList.toggle("game-favorite-button--active", nextActive);
  favoriteButton.textContent = nextActive
    ? "♥ Added to Favorites"
    : "♡ Add to Favorites";
});

commentTextarea.addEventListener("input", () => {
  commentTextarea.style.height = "auto";
  const nextHeight = Math.min(commentTextarea.scrollHeight, 88);
  commentTextarea.style.height = `${nextHeight}px`;
  commentTextarea.style.overflowY =
    commentTextarea.scrollHeight > 88 ? "auto" : "hidden";
});

commentForm.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();
});

commentLikes.forEach((button) => {
  button.addEventListener("click", () => {
    const isActive = button.getAttribute("aria-pressed") === "true";
    const nextActive = !isActive;

    button.setAttribute("aria-pressed", String(nextActive));
    button.classList.toggle("comment-like--active", nextActive);
    button.firstChild?.replaceWith(nextActive ? "♥ " : "♡ ");
  });
});

/* =========================
   STORY 2 — SLIDER AUTOPLAY
   ========================= */

const STORY_2_AUTOPLAY_MS = 4000;
const LONG_PRESS_THRESHOLD = 400;

let story2AutoplayTimer: number | null = null;
let story2AutoplayStartedAt = 0;
let story2AutoplayRemaining = STORY_2_AUTOPLAY_MS;

let story2PointerStartX = 0;
let story2PointerStartY = 0;
let story2PointerId: number | null = null;
let story2PressStartedAt = 0;
let story2Holding = false;

let suppressSliderClick = false;
let suppressSliderClickTimer: number | null = null;

function clearStory2Autoplay(): void {
  if (story2AutoplayTimer !== null) {
    window.clearTimeout(story2AutoplayTimer);
    story2AutoplayTimer = null;
  }
}

function scheduleStory2Autoplay(delay = STORY_2_AUTOPLAY_MS): void {
  clearStory2Autoplay();

  story2AutoplayRemaining = delay;
  story2AutoplayStartedAt = performance.now();

  story2AutoplayTimer = window.setTimeout(() => {
    if (!story2Holding) {
      void changeSlide("next");
      scheduleStory2Autoplay();
    }
  }, delay);
}

function pauseStory2Autoplay(): void {
  if (story2AutoplayTimer === null) {
    return;
  }

  const elapsed = performance.now() - story2AutoplayStartedAt;

  story2AutoplayRemaining = Math.max(0, story2AutoplayRemaining - elapsed);

  clearStory2Autoplay();
}

function resetStory2Autoplay(): void {
  scheduleStory2Autoplay(STORY_2_AUTOPLAY_MS);
}

function suppressNextSliderClick(): void {
  suppressSliderClick = true;

  if (suppressSliderClickTimer !== null) {
    window.clearTimeout(suppressSliderClickTimer);
  }

  suppressSliderClickTimer = window.setTimeout(() => {
    suppressSliderClick = false;
    suppressSliderClickTimer = null;
  }, 300);
}

function syncStory2SliderOverlays(): void {
  gamesTrack.querySelectorAll<HTMLElement>(".game-card").forEach((card) => {
    const overlay = card.querySelector<HTMLElement>(".game-overlay");

    if (!overlay) {
      return;
    }

    const showInfo = card.getBoundingClientRect().width >= 288;

    overlay.classList.toggle("game-overlay--hidden", !showInfo);
  });
}

nextButton.addEventListener("click", resetStory2Autoplay);

prevButton.addEventListener("click", resetStory2Autoplay);

gamesViewport.addEventListener("pointerdown", (event: PointerEvent) => {
  if (!event.isPrimary) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  story2PointerId = event.pointerId;
  story2PointerStartX = event.clientX;
  story2PointerStartY = event.clientY;
  story2PressStartedAt = performance.now();
  story2Holding = true;

  pauseStory2Autoplay();

  gamesViewport.setPointerCapture(event.pointerId);
});

gamesViewport.addEventListener("pointerup", (event: PointerEvent) => {
  if (event.pointerId !== story2PointerId) {
    return;
  }

  const deltaX = event.clientX - story2PointerStartX;

  const deltaY = event.clientY - story2PointerStartY;

  const pressDuration = performance.now() - story2PressStartedAt;

  const didSwipe =
    Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY);

  story2Holding = false;
  story2PointerId = null;

  if (gamesViewport.hasPointerCapture(event.pointerId)) {
    gamesViewport.releasePointerCapture(event.pointerId);
  }

  if (didSwipe) {
    suppressNextSliderClick();

    if (deltaX < 0) {
      void changeSlide("next");
    } else {
      void changeSlide("previous");
    }

    resetStory2Autoplay();
    return;
  }

  /*
   * A long press pauses autoplay but must NOT
   * open the Game Details dialog after release.
   */
  if (pressDuration >= LONG_PRESS_THRESHOLD) {
    suppressNextSliderClick();
  }

  scheduleStory2Autoplay(story2AutoplayRemaining);
});

gamesViewport.addEventListener("pointercancel", (event: PointerEvent) => {
  if (event.pointerId !== story2PointerId) {
    return;
  }

  story2Holding = false;
  story2PointerId = null;

  if (gamesViewport.hasPointerCapture(event.pointerId)) {
    gamesViewport.releasePointerCapture(event.pointerId);
  }

  scheduleStory2Autoplay(story2AutoplayRemaining);
});

gamesTrack.addEventListener("click", (event: MouseEvent) => {
  /*
   * Prevent opening Game Details after
   * swipe or press-and-hold.
   */
  if (suppressSliderClick) {
    suppressSliderClick = false;

    if (suppressSliderClickTimer !== null) {
      window.clearTimeout(suppressSliderClickTimer);
      suppressSliderClickTimer = null;
    }

    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const target = event.target;

  if (target instanceof Element && target.closest(".game-card")) {
    openGameDetailsDialog();
  }
});

window.addEventListener("resize", syncStory2SliderOverlays);

window.requestAnimationFrame(syncStory2SliderOverlays);

scheduleStory2Autoplay();
