import "./style.scss";
import {
  ApiError,
  getCategories,
  getFeaturedGames,
  getGameComments,
  getGameDetails,
  getGames,
  getLeaderboard,
  type Category,
  type Game,
  type GameComment,
  type GameDetails,
  type GameSort,
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
        <article
          class="${cardClasses}"
          data-slider-card
          data-game-slug="${game.slug}"
        >
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

function isAuthMode(value: string | null | undefined): value is AuthMode {
  return value === "login" || value === "register";
}

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

function openAuthDialogUi(mode: AuthMode): void {
  setAuthMode(mode);

  if (!authDialog.open) {
    authDialog.showModal();
  }
}

function closeAuthDialogUi(): void {
  if (authDialog.open) {
    authDialog.close();
  }

  authDialog.classList.remove("auth-dialog--closing");
}

function updateAuthUrl(mode: AuthMode | null, replace = false): void {
  const url = new URL(window.location.href);

  if (mode) {
    url.searchParams.set("auth", mode);
    url.searchParams.delete("game");
  } else {
    url.searchParams.delete("auth");
  }

  writeUrl(url, replace);
}

authOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.authMode;

    if (isAuthMode(mode)) {
      updateAuthUrl(mode);
    }
  });
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.authTab;

    if (isAuthMode(mode)) {
      updateAuthUrl(mode, true);
    }
  });
});

authSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.authSwitch;

    if (isAuthMode(mode)) {
      updateAuthUrl(mode, true);
    }
  });
});

authDialog.addEventListener("click", (event: MouseEvent) => {
  if (event.target === authDialog) {
    updateAuthUrl(null, true);
  }
});

authDialog.addEventListener("cancel", (event: Event) => {
  event.preventDefault();
  updateAuthUrl(null, true);
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
   STORY 3 — ROUTING + LIBRARY API
   ========================= */

type PageName = "home" | "library" | "not-found";

const homePage = getElement<HTMLElement>('[data-page-view="home"]');
const libraryPage = getElement<HTMLElement>('[data-page-view="library"]');
const notFoundPage = getElement<HTMLElement>('[data-page-view="not-found"]');
const returnHomeButton = getElement<HTMLButtonElement>("[data-return-home]");
const pageLinks =
  document.querySelectorAll<HTMLAnchorElement>("[data-page-link]");
const libraryGrid = getElement<HTMLElement>(".library-grid");
const libraryChips = getElement<HTMLElement>(".library-chips");
const librarySort = getElement<HTMLElement>(".library-sort");
const librarySortTrigger = getElement<HTMLButtonElement>(
  ".library-sort-trigger",
);
const librarySortValue = getElement<HTMLElement>(".library-sort-value");
const librarySortMenu = getElement<HTMLElement>(".library-sort-menu");
const paginationPages = getElement<HTMLElement>(".pagination-pages");
const paginationPrev = getElement<HTMLButtonElement>(".pagination-prev");
const paginationNext = getElement<HTMLButtonElement>(".pagination-next");

const LIBRARY_PAGE_SIZE = 6;
const LIBRARY_SORT_OPTIONS: ReadonlyArray<{
  value: GameSort;
  label: string;
}> = [
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

let libraryCategories: Category[] = [];
let libraryCategory = "all";
let librarySortOrder: GameSort = "rating-desc";
let libraryPageNumber = 1;
let libraryTotalPages = 1;
let activePage: PageName | null = null;

function routeUrlString(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function writeUrl(url: URL, replace = false): void {
  const nextUrl = routeUrlString(url);

  if (replace) {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }

  void applyRoute();
}

function navigateToPath(pathname: "/home" | "/library"): void {
  const url = new URL(window.location.href);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  writeUrl(url);
}

function isGameSort(value: string | null | undefined): value is GameSort {
  return (
    value === "rating-desc" ||
    value === "rating-asc" ||
    value === "name-asc" ||
    value === "name-desc"
  );
}

function parsePageNumber(value: string | null): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

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
  const pageChanged = activePage !== page;

  homePage.hidden = page !== "home";
  libraryPage.hidden = page !== "library";
  notFoundPage.hidden = page !== "not-found";
  setActiveNavigation(page);
  closeMobileMenu();

  activePage = page;

  if (pageChanged) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event: MouseEvent) => {
    const page = link.dataset.pageLink;

    if (page !== "home" && page !== "library") {
      return;
    }

    event.preventDefault();
    navigateToPath(page === "library" ? "/library" : "/home");
  });
});

returnHomeButton.addEventListener("click", () => {
  navigateToPath("/home");
});

function libraryCardTemplate(game: Game): string {
  return `
    <article class="library-card" data-game-slug="${game.slug}">
      <div class="library-card-image-wrap">
        <img
          class="library-card-image"
          src="${game.cardImage}"
          alt="${game.name}"
          draggable="false"
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
          data-game-slug="${game.slug}"
        >
          Details
        </button>
      </div>
    </article>
  `;
}

function librarySkeletonMarkup(): string {
  return Array.from(
    { length: LIBRARY_PAGE_SIZE },
    () => `
      <article class="library-card library-card--skeleton" aria-hidden="true">
        <div class="library-card-image-wrap">
          <span class="api-skeleton api-skeleton--fill"></span>
        </div>
        <div class="library-card-body">
          <span class="api-skeleton api-skeleton--line"></span>
          <br>
          <span class="api-skeleton api-skeleton--line"></span>
          <br>
          <span class="api-skeleton api-skeleton--line"></span>
        </div>
      </article>
    `,
  ).join("");
}

function renderCategories(): void {
  libraryChips.innerHTML = libraryCategories
    .map((category) => {
      const isActive = category.slug === libraryCategory;

      return `
        <button
          class="library-chip ${isActive ? "library-chip--active" : ""}"
          type="button"
          data-category="${category.slug}"
          aria-pressed="${String(isActive)}"
        >
          ${category.label}
        </button>
      `;
    })
    .join("");
}

function categorySkeletonMarkup(): string {
  return Array.from(
    { length: 6 },
    () => '<span class="api-skeleton library-chip-skeleton"></span>',
  ).join("");
}

async function loadCategories(): Promise<boolean> {
  libraryChips.innerHTML = categorySkeletonMarkup();

  try {
    const result = await getCategories();
    libraryCategories = result.data;

    if (libraryCategories.length === 0) {
      libraryChips.innerHTML = apiStateMarkup("No categories found.", "empty");
      return false;
    }

    return true;
  } catch {
    libraryCategories = [];
    libraryChips.innerHTML = apiStateMarkup(
      "Categories could not be loaded.",
      "error",
      "categories",
    );
    showSnackbar("Failed to load categories.", "error");
    return false;
  }
}

function renderSortOptions(): void {
  librarySortMenu.innerHTML = LIBRARY_SORT_OPTIONS.map((option) => {
    const selected = option.value === librarySortOrder;

    return `
      <button
        type="button"
        role="option"
        aria-selected="${String(selected)}"
        data-sort-value="${option.value}"
      >
        ${option.label}
      </button>
    `;
  }).join("");

  const current =
    LIBRARY_SORT_OPTIONS.find((option) => option.value === librarySortOrder) ??
    LIBRARY_SORT_OPTIONS[0];

  librarySortValue.textContent = current.label;
}

function renderLibraryCards(games: Game[]): void {
  if (games.length === 0) {
    libraryGrid.innerHTML = apiStateMarkup("Data Not Found", "empty");
    return;
  }

  libraryGrid.innerHTML = games.map(libraryCardTemplate).join("");
}

function visiblePaginationNumbers(): number[] {
  const visibleCount = window.innerWidth <= 600 ? 3 : 4;
  const safeTotalPages = Math.max(1, libraryTotalPages);
  const half = Math.floor(visibleCount / 2);

  let start = Math.max(1, libraryPageNumber - half);
  const end = Math.min(safeTotalPages, start + visibleCount - 1);

  if (end - start + 1 < visibleCount) {
    start = Math.max(1, end - visibleCount + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function renderPagination(): void {
  const safeTotalPages = Math.max(1, libraryTotalPages);

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

  paginationPrev.disabled = libraryPageNumber <= 1;
  paginationNext.disabled = libraryPageNumber >= safeTotalPages;
}

function replaceLibraryUrlFromState(): void {
  if (window.location.pathname !== "/library") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("category", libraryCategory);
  url.searchParams.set("sort", librarySortOrder);
  url.searchParams.set("page", String(libraryPageNumber));

  window.history.replaceState({}, "", routeUrlString(url));
}

async function loadLibraryGames(): Promise<void> {
  libraryGrid.innerHTML = librarySkeletonMarkup();

  try {
    const result = await getGames({
      category: libraryCategory,
      sort: librarySortOrder,
      page: libraryPageNumber,
      limit: LIBRARY_PAGE_SIZE,
    });

    libraryPageNumber = Math.max(1, result.meta.page || 1);
    libraryTotalPages = Math.max(1, result.meta.totalPages || 1);

    renderLibraryCards(result.data);
    renderPagination();
    replaceLibraryUrlFromState();
  } catch {
    libraryTotalPages = 1;
    libraryPageNumber = 1;
    libraryGrid.innerHTML = apiStateMarkup(
      "Library games could not be loaded.",
      "error",
      "library",
    );
    renderPagination();
    showSnackbar("Failed to load Library games.", "error");
  }
}

async function syncLibraryFromUrl(url: URL): Promise<void> {
  if (libraryCategories.length === 0) {
    await loadCategories();
  }

  const defaultCategory =
    libraryCategories.find((category) => category.isDefault)?.slug ?? "all";
  const requestedCategory = url.searchParams.get("category");
  const knownCategory = libraryCategories.some(
    (category) => category.slug === requestedCategory,
  );

  libraryCategory = knownCategory
    ? (requestedCategory ?? defaultCategory)
    : defaultCategory;

  const requestedSort = url.searchParams.get("sort");
  librarySortOrder = isGameSort(requestedSort) ? requestedSort : "rating-desc";

  libraryPageNumber = parsePageNumber(url.searchParams.get("page"));

  renderCategories();
  renderSortOptions();
  renderPagination();

  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.searchParams.set("category", libraryCategory);
  canonicalUrl.searchParams.set("sort", librarySortOrder);
  canonicalUrl.searchParams.set("page", String(libraryPageNumber));
  window.history.replaceState({}, "", routeUrlString(canonicalUrl));

  await loadLibraryGames();
}

function pushLibraryState(
  next: Partial<{
    category: string;
    sort: GameSort;
    page: number;
  }>,
): void {
  const url = new URL(window.location.href);
  url.pathname = "/library";
  url.searchParams.set("category", next.category ?? libraryCategory);
  url.searchParams.set("sort", next.sort ?? librarySortOrder);
  url.searchParams.set("page", String(next.page ?? libraryPageNumber));
  url.searchParams.delete("game");
  url.searchParams.delete("auth");
  writeUrl(url);
}

libraryChips.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const chip = target.closest<HTMLButtonElement>("[data-category]");

  if (!chip) {
    return;
  }

  const category = chip.dataset.category;

  if (!category || category === libraryCategory) {
    return;
  }

  pushLibraryState({
    category,
    page: 1,
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

librarySortMenu.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const option = target.closest<HTMLButtonElement>("[data-sort-value]");

  if (!option) {
    return;
  }

  const value = option.dataset.sortValue;

  if (!isGameSort(value)) {
    return;
  }

  closeSortMenu();
  pushLibraryState({
    sort: value,
    page: 1,
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

function setLibraryPage(page: number): void {
  const safeTotalPages = Math.max(1, libraryTotalPages);
  const nextPage = Math.min(safeTotalPages, Math.max(1, page));

  if (nextPage === libraryPageNumber) {
    return;
  }

  pushLibraryState({
    page: nextPage,
  });
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

/* =========================
   STORY 3 — GAME DETAILS API
   ========================= */

const gameDetailsDialog = getElement<HTMLDialogElement>(".game-details-dialog");
const gameDetailsClose = getElement<HTMLButtonElement>(".game-details-close");
const gameDetailsHeroImage = getElement<HTMLImageElement>(
  ".game-details-hero > img",
);
const gameDetailsEyebrow = getElement<HTMLElement>(".game-details-eyebrow");
const gameDetailsTitle = getElement<HTMLElement>(".game-details-header h2");
const gameDetailsRating = getElement<HTMLElement>(
  ".game-details-rating strong",
);
const gameDetailsDescription = getElement<HTMLElement>(
  ".game-details-description",
);
const gameDetailsBadges = getElement<HTMLElement>(".game-details-badges");
const gameRecordsList = getElement<HTMLOListElement>(".game-records ol");
const commentsTitle = getElement<HTMLElement>("#comments-title");
const commentList = getElement<HTMLElement>(".comment-list");
const favoriteButton = getElement<HTMLButtonElement>(".game-favorite-button");
const commentForm = getElement<HTMLFormElement>(".comment-form");

let currentGameSlug: string | null = null;
let gameDetailsRequestId = 0;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRelativeTime(timestamp: string): string {
  const createdAt = new Date(timestamp).getTime();

  if (!Number.isFinite(createdAt)) {
    return "";
  }

  const elapsedMs = Math.max(0, Date.now() - createdAt);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (elapsedMs < minute) {
    return "just now";
  }

  if (elapsedMs < hour) {
    const minutes = Math.floor(elapsedMs / minute);
    return `${minutes} min ago`;
  }

  if (elapsedMs < day) {
    const hours = Math.floor(elapsedMs / hour);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (elapsedMs < week) {
    const days = Math.floor(elapsedMs / day);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  if (elapsedMs < month) {
    const weeks = Math.min(3, Math.floor(elapsedMs / week));
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  if (elapsedMs < year) {
    const months = Math.min(11, Math.floor(elapsedMs / month));
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(elapsedMs / year);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function renderGameDetailsLoading(): void {
  gameDetailsHeroImage.removeAttribute("src");
  gameDetailsHeroImage.alt = "";
  gameDetailsHeroImage.classList.add("game-details-hero-image--loading");

  gameDetailsEyebrow.textContent = "Loading";
  gameDetailsTitle.textContent = "Loading game…";
  gameDetailsRating.textContent = "—";
  gameDetailsDescription.innerHTML =
    '<span class="api-skeleton api-skeleton--line"></span>';
  gameDetailsBadges.innerHTML = Array.from(
    { length: 4 },
    () => '<span class="api-skeleton game-details-badge-skeleton"></span>',
  ).join("");
  gameRecordsList.innerHTML = Array.from(
    { length: 3 },
    () => `
      <li aria-hidden="true">
        <span class="api-skeleton api-skeleton--line"></span>
        <span class="api-skeleton api-skeleton--line"></span>
        <span class="api-skeleton api-skeleton--line"></span>
      </li>
    `,
  ).join("");
  commentsTitle.textContent = "Comments";
  commentList.innerHTML = Array.from(
    { length: 3 },
    () => `
      <article class="comment-item" aria-hidden="true">
        <span class="api-skeleton api-skeleton--line"></span>
        <p><span class="api-skeleton api-skeleton--line"></span></p>
      </article>
    `,
  ).join("");

  favoriteButton.disabled = true;
  favoriteButton.textContent = "♡ Favorites available after sign in";
  commentForm.hidden = true;
}

function renderGameDetails(details: GameDetails): void {
  gameDetailsHeroImage.classList.remove("game-details-hero-image--loading");
  gameDetailsHeroImage.src = details.heroImage;
  gameDetailsHeroImage.alt = details.name;

  gameDetailsEyebrow.textContent = details.specs.genre || "Game details";
  gameDetailsTitle.textContent = details.name;
  gameDetailsRating.textContent = String(details.rating);
  gameDetailsDescription.textContent = details.fullDescription;

  const badges = [
    details.specs.genre,
    details.specs.players,
    details.specs.duration,
    details.specs.price,
  ].filter(Boolean);

  gameDetailsBadges.innerHTML = badges
    .map((badge) => `<span>${escapeHtml(badge)}</span>`)
    .join("");

  if (details.topRecords.length === 0) {
    gameRecordsList.innerHTML = `
      <li>
        <span></span>
        <span>No records yet.</span>
        <span></span>
      </li>
    `;
  } else {
    gameRecordsList.innerHTML = details.topRecords
      .map(
        (record) => `
          <li>
            <span class="record-position">#${record.position}</span>
            <span>${escapeHtml(record.playerName)}</span>
            <strong>${record.score.toLocaleString("en-US")}</strong>
          </li>
        `,
      )
      .join("");
  }

  favoriteButton.disabled = true;
  favoriteButton.setAttribute("aria-pressed", "false");
  favoriteButton.textContent = `♡ ${formatLikes(details.likesCount)} likes`;
  commentForm.hidden = true;
}

function renderGameNotFound(): void {
  gameDetailsHeroImage.classList.remove("game-details-hero-image--loading");
  gameDetailsHeroImage.removeAttribute("src");
  gameDetailsHeroImage.alt = "";
  gameDetailsEyebrow.textContent = "404";
  gameDetailsTitle.textContent = "Game Not Found";
  gameDetailsRating.textContent = "—";
  gameDetailsDescription.textContent =
    "The requested game does not exist or is no longer available.";
  gameDetailsBadges.innerHTML = "";
  gameRecordsList.innerHTML = "";
  commentsTitle.textContent = "Comments";
  commentList.innerHTML = "";
  favoriteButton.disabled = true;
  commentForm.hidden = true;
}

function renderGameDetailsError(): void {
  gameDetailsHeroImage.classList.remove("game-details-hero-image--loading");
  gameDetailsHeroImage.removeAttribute("src");
  gameDetailsHeroImage.alt = "";
  gameDetailsEyebrow.textContent = "Error";
  gameDetailsTitle.textContent = "Game details unavailable";
  gameDetailsRating.textContent = "—";
  gameDetailsDescription.innerHTML = apiStateMarkup(
    "Game details could not be loaded.",
    "error",
    "game-details",
  );
  gameDetailsBadges.innerHTML = "";
  gameRecordsList.innerHTML = "";
  favoriteButton.disabled = true;
  commentForm.hidden = true;
}

function renderComments(comments: GameComment[], totalItems: number): void {
  commentsTitle.textContent = `Comments (${totalItems})`;

  if (comments.length === 0) {
    commentList.innerHTML = apiStateMarkup("No comments yet.", "empty");
    return;
  }

  commentList.innerHTML = comments
    .map(
      (comment) => `
        <article class="comment-item">
          <div class="comment-heading">
            <div class="comment-author">
              <strong>${escapeHtml(comment.authorName)}</strong>
              <time datetime="${escapeHtml(comment.createdAt)}">
                ${formatRelativeTime(comment.createdAt)}
              </time>
            </div>

            <span class="comment-like comment-like--readonly">
              ♡ ${comment.likesCount}
            </span>
          </div>

          <p>${escapeHtml(comment.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCommentsError(): void {
  commentsTitle.textContent = "Comments";
  commentList.innerHTML = apiStateMarkup(
    "Comments could not be loaded.",
    "error",
    "game-comments",
  );
}

async function loadGameDetailsData(
  slug: string,
  requestId: number,
): Promise<void> {
  try {
    const result = await getGameDetails(slug);

    if (requestId !== gameDetailsRequestId) {
      return;
    }

    renderGameDetails(result.data);
  } catch (error: unknown) {
    if (requestId !== gameDetailsRequestId) {
      return;
    }

    if (error instanceof ApiError && error.status === 404) {
      renderGameNotFound();
      return;
    }

    renderGameDetailsError();
    showSnackbar("Failed to load game details.", "error");
  }
}

async function loadGameCommentsData(
  slug: string,
  requestId: number,
): Promise<void> {
  try {
    const result = await getGameComments(slug);

    if (requestId !== gameDetailsRequestId) {
      return;
    }

    renderComments(result.data, result.meta?.totalItems ?? result.data.length);
  } catch {
    if (requestId !== gameDetailsRequestId) {
      return;
    }

    renderCommentsError();
    showSnackbar("Failed to load game comments.", "error");
  }
}

function openGameDetailsDialog(slug: string): void {
  currentGameSlug = slug;
  gameDetailsRequestId += 1;
  const requestId = gameDetailsRequestId;

  renderGameDetailsLoading();

  if (!gameDetailsDialog.open) {
    gameDetailsDialog.showModal();
  }

  void loadGameDetailsData(slug, requestId);
  void loadGameCommentsData(slug, requestId);
}

function closeGameDetailsDialogUi(): void {
  gameDetailsRequestId += 1;
  currentGameSlug = null;

  if (gameDetailsDialog.open) {
    gameDetailsDialog.close();
  }

  gameDetailsDialog.classList.remove("game-details-dialog--closing");
}

function navigateToGame(slug: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("game", slug);
  url.searchParams.delete("auth");
  writeUrl(url);
}

function closeGameFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("game");
  writeUrl(url, true);
}

document.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const opener = target.closest<HTMLElement>("[data-game-details-open]");

  if (!opener) {
    return;
  }

  const slug =
    opener.dataset.gameSlug ??
    opener.closest<HTMLElement>("[data-game-slug]")?.dataset.gameSlug;

  if (slug) {
    navigateToGame(slug);
  }
});

gameDetailsClose.addEventListener("click", closeGameFromUrl);

gameDetailsDialog.addEventListener("click", (event: MouseEvent) => {
  if (event.target === gameDetailsDialog) {
    closeGameFromUrl();
  }
});

gameDetailsDialog.addEventListener("cancel", (event: Event) => {
  event.preventDefault();
  closeGameFromUrl();
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

  if (!(target instanceof Element)) {
    return;
  }

  const card = target.closest<HTMLElement>(".game-card[data-game-slug]");
  const slug = card?.dataset.gameSlug;

  if (slug) {
    navigateToGame(slug);
  }
});

window.addEventListener("resize", syncStory2SliderOverlays);

window.requestAnimationFrame(syncStory2SliderOverlays);

scheduleStory2Autoplay();

/* =========================
   STORY 3 — HISTORY ROUTER
   ========================= */

function normalizedPathname(): string {
  const trimmed = window.location.pathname.replace(/\/+$/, "");

  return trimmed || "/";
}

async function applyRoute(): Promise<void> {
  const url = new URL(window.location.href);
  const pathname = normalizedPathname();

  let page: PageName;

  if (pathname === "/" || pathname === "/home") {
    page = "home";
  } else if (pathname === "/library") {
    page = "library";
  } else {
    page = "not-found";
  }

  showPage(page);

  if (page === "not-found") {
    closeAuthDialogUi();
    closeGameDetailsDialogUi();
    return;
  }

  if (page === "library") {
    await syncLibraryFromUrl(url);
  }

  const authMode = url.searchParams.get("auth");

  if (isAuthMode(authMode)) {
    if (gameDetailsDialog.open) {
      closeGameDetailsDialogUi();
    }

    openAuthDialogUi(authMode);
  } else {
    closeAuthDialogUi();
  }

  const gameSlug = url.searchParams.get("game");

  if (gameSlug) {
    if (authDialog.open) {
      closeAuthDialogUi();
    }

    if (currentGameSlug !== gameSlug || !gameDetailsDialog.open) {
      openGameDetailsDialog(gameSlug);
    }
  } else {
    closeGameDetailsDialogUi();
  }
}

window.addEventListener("popstate", () => {
  void applyRoute();
});

void applyRoute();

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

  if (action === "categories") {
    libraryCategories = [];
    void applyRoute();
  }

  if (action === "library") {
    void loadLibraryGames();
  }

  if (action === "game-details" && currentGameSlug) {
    const requestId = ++gameDetailsRequestId;
    renderGameDetailsLoading();
    void loadGameDetailsData(currentGameSlug, requestId);
    void loadGameCommentsData(currentGameSlug, requestId);
  }

  if (action === "game-comments" && currentGameSlug) {
    const requestId = gameDetailsRequestId;
    commentList.innerHTML = Array.from(
      { length: 3 },
      () => `
        <article class="comment-item" aria-hidden="true">
          <span class="api-skeleton api-skeleton--line"></span>
        </article>
      `,
    ).join("");
    void loadGameCommentsData(currentGameSlug, requestId);
  }
});
