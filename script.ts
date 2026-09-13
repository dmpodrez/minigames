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

  cards.forEach((card, index) => {
    const isActive = index === currentIndex;
    const isEdge = index === currentIndex - 2 || index === currentIndex + 2;
    const isVisible = index >= currentIndex - 2 && index <= currentIndex + 2;
    const shouldShowOverlay =
      index >= currentIndex - 1 && index <= currentIndex + 1;

    card.classList.toggle("game-card--active", isActive);
    card.classList.toggle("game-card--edge", isEdge);
    card.classList.toggle("game-card--hidden", !isVisible);

    const gameOverlay = card.querySelector<HTMLElement>(".game-overlay");
    gameOverlay?.classList.toggle("game-overlay--hidden", !shouldShowOverlay);
  });

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
