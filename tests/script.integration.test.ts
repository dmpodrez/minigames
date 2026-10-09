import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => {
  class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }

  const game = {
    slug: "test-game",
    name: "Test Game",
    category: "Puzzle",
    price: "Free",
    shortDescription: "Test description",
    rating: 4.8,
    likesCount: 1200,
    cardImage: "/test.jpg",
    featured: true,
  };

  return {
    ApiError,

    getFeaturedGames: vi.fn().mockResolvedValue({
      data: [game],
    }),

    getLeaderboard: vi.fn().mockResolvedValue({
      data: [
        {
          rank: 1,
          playerName: "TestPlayer",
          gamesPlayed: 10,
          totalScore: 12000,
          streakDays: 5,
          favoriteGameSlug: "test-game",
          favoriteGameName: "Test Game",
        },
      ],
    }),

    getCategories: vi.fn().mockResolvedValue({
      data: [
        {
          slug: "all",
          label: "All Games",
          isDefault: true,
        },
        {
          slug: "puzzle",
          label: "Puzzle",
          isDefault: false,
        },
      ],
    }),

    getGames: vi.fn().mockResolvedValue({
      data: [game],
      meta: {
        page: 1,
        limit: 6,
        totalItems: 12,
        totalPages: 3,
      },
    }),

    getGameDetails: vi.fn().mockResolvedValue({
      data: {
        slug: "test-game",
        name: "Test Game",
        heroImage: "/hero.jpg",
        rating: 4.8,
        likesCount: 1200,
        isLikedByCurrentUser: false,
        fullDescription: "Full test description",
        specs: {
          genre: "Puzzle",
          players: "Solo",
          duration: "10 min",
          price: "Free",
        },
        topRecords: [
          {
            position: 1,
            playerName: "PlayerOne",
            score: 5000,
            achievedAt: "2026-10-01T10:00:00Z",
          },
        ],
      },
    }),

    getGameComments: vi.fn().mockResolvedValue({
      data: [
        {
          commentId: "comment-1",
          authorName: "Alex",
          text: "Great game!",
          likesCount: 3,
          isLikedByCurrentUser: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        totalComments: 1,
      },
    }),

    toggleGameFavorite: vi.fn(),

    createGameComment: vi.fn(),

    toggleCommentLike: vi.fn(),
  };
});

vi.mock("../auth-form-validation", () => ({
  setupAuthFormValidation: vi.fn(() => ({
    reset: vi.fn(),
    validate: vi.fn(() => true),
  })),
}));

vi.mock("../auth-flow", () => ({
  setupAuthFlow: vi.fn(() => ({
    isPending: () => false,
  })),
}));

vi.mock("../profile-ui", () => ({
  setupProfileUi: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock("../session-manager", () => ({
  createSessionManager: vi.fn(() => ({
    restore: vi.fn().mockResolvedValue(null),

    start: vi.fn((user) => ({
      displayName: user.displayName,
      email: user.email,
      authenticatedAt: Date.now(),
      avatarUrl: user.avatarUrl,
    })),

    getSession: vi.fn(() => null),

    check: vi.fn().mockResolvedValue(null),

    logout: vi.fn().mockResolvedValue(undefined),
  })),
}));

function click(element: Element | null): void {
  if (!element) {
    throw new Error("Expected clickable element");
  }

  element.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("application integration", () => {
  beforeAll(async () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });

    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });

    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });

    window.history.replaceState({}, "", "/home");
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => {
        return {
          finished: Promise.resolve(),
          cancel: vi.fn(),
        } as unknown as Animation;
      }),
    });

    const capturedPointers = new WeakMap<HTMLElement, Set<number>>();

    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value(this: HTMLElement, pointerId: number) {
        let ids = capturedPointers.get(this);

        if (!ids) {
          ids = new Set<number>();
          capturedPointers.set(this, ids);
        }

        ids.add(pointerId);
      },
    });

    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value(this: HTMLElement, pointerId: number) {
        return capturedPointers.get(this)?.has(pointerId) ?? false;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value(this: HTMLElement, pointerId: number) {
        capturedPointers.get(this)?.delete(pointerId);
      },
    });
    await import("../script");

    await vi.waitFor(() => {
      expect(
        document.querySelector(".game-card[data-game-slug='test-game']"),
      ).not.toBeNull();

      expect(document.querySelector(".leaderboard-row")).not.toBeNull();
    });
  });

  it("runs the main guest SPA flow", async () => {
    expect(window.location.pathname).toBe("/home");

    expect(document.body.textContent).toContain("Test Game");

    // Home -> Library
    click(document.querySelector('.nav [data-page-link="library"]'));

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe("/library");

      expect(
        document.querySelector(".library-card[data-game-slug='test-game']"),
      ).not.toBeNull();
    });

    expect(window.location.search).toContain("category=all");

    expect(window.location.search).toContain("sort=rating-desc");

    expect(window.location.search).toContain("page=1");

    // Category filter
    click(document.querySelector('[data-category="puzzle"]'));

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("category")).toBe(
        "puzzle",
      );
    });

    // Sorting
    click(document.querySelector(".library-sort-trigger"));

    click(document.querySelector('[data-sort-value="rating-asc"]'));

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("sort")).toBe(
        "rating-asc",
      );
    });

    // Open Game Details
    click(document.querySelector("[data-game-details-open]"));

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("game")).toBe(
        "test-game",
      );

      expect(
        document.querySelector(".game-details-header h2")?.textContent,
      ).toBe("Test Game");
    });

    const gameDialog = document.querySelector<HTMLDialogElement>(
      ".game-details-dialog",
    );

    expect(gameDialog?.open).toBe(true);

    expect(document.querySelector("#comments-title")?.textContent).toBe(
      "Comments (1)",
    );

    expect(document.querySelector(".comment-item p")?.textContent).toBe(
      "Great game!",
    );

    // Guest favorite -> Auth
    click(document.querySelector(".game-favorite-button"));

    await vi.waitFor(() => {
      const url = new URL(window.location.href);

      expect(url.searchParams.get("game")).toBe("test-game");

      expect(url.searchParams.get("auth")).toBe("login");
    });

    const authDialog =
      document.querySelector<HTMLDialogElement>(".auth-dialog");

    expect(authDialog?.open).toBe(true);

    expect(document.querySelector(".api-snackbar")?.textContent).toContain(
      "sign in",
    );

    // Invalid route -> custom 404
    window.history.pushState({}, "", "/unknown");

    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      const page = document.querySelector<HTMLElement>("#not-found-page");

      expect(page?.hidden).toBe(false);

      expect(page?.textContent).toContain("Page Not Found");
    });

    // 404 -> Home
    click(document.querySelector("[data-return-home]"));

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe("/home");
    });
  });
  it("handles slider pointer interactions and click suppression", async () => {
    window.history.replaceState({}, "", "/home");

    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(document.querySelector(".games-track .game-card")).not.toBeNull();
    });

    const viewport = document.querySelector<HTMLElement>(".games-viewport");

    const track = document.querySelector<HTMLElement>(".games-track");

    if (!viewport || !track) {
      throw new Error("Slider elements were not rendered");
    }

    let currentTime = 1_000;

    const performanceSpy = vi
      .spyOn(performance, "now")
      .mockImplementation(() => currentTime);

    // Non-primary pointer must be ignored.
    dispatchPointer(viewport, "pointerdown", {
      pointerId: 1,
      isPrimary: false,
      pointerType: "touch",
      button: 0,
      clientX: 200,
      clientY: 50,
    });

    // Right mouse button must be ignored.
    dispatchPointer(viewport, "pointerdown", {
      pointerId: 2,
      isPrimary: true,
      pointerType: "mouse",
      button: 2,
      clientX: 200,
      clientY: 50,
    });

    // Real swipe to the left.
    dispatchPointer(viewport, "pointerdown", {
      pointerId: 3,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 220,
      clientY: 50,
    });

    currentTime = 1_100;

    dispatchPointer(viewport, "pointerup", {
      pointerId: 3,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 100,
      clientY: 52,
    });

    await Promise.resolve();
    await Promise.resolve();

    // Click immediately after swipe must NOT
    // open Game Details.
    const cardAfterSwipe = track.querySelector<HTMLElement>(
      ".game-card[data-game-slug]",
    );

    click(cardAfterSwipe);

    expect(new URL(window.location.href).searchParams.has("game")).toBe(false);

    // Next normal click should work.
    click(track.querySelector(".game-card[data-game-slug]"));

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.get("game")).toBe(
        "test-game",
      );
    });

    // Return to plain Home.
    window.history.replaceState({}, "", "/home");

    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.has("game")).toBe(
        false,
      );
    });

    // Long press must also suppress the next click.
    currentTime = 2_000;

    dispatchPointer(viewport, "pointerdown", {
      pointerId: 4,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 150,
      clientY: 50,
    });

    currentTime = 2_500;

    dispatchPointer(viewport, "pointerup", {
      pointerId: 4,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 150,
      clientY: 50,
    });

    click(track.querySelector(".game-card[data-game-slug]"));

    expect(new URL(window.location.href).searchParams.has("game")).toBe(false);

    // Pointer cancellation.
    dispatchPointer(viewport, "pointerdown", {
      pointerId: 5,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 100,
      clientY: 40,
    });

    dispatchPointer(viewport, "pointercancel", {
      pointerId: 5,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: 100,
      clientY: 40,
    });

    performanceSpy.mockRestore();
  });
});
interface PointerTestInit {
  pointerId: number;
  isPrimary: boolean;
  pointerType: string;
  button: number;
  clientX: number;
  clientY: number;
}

function dispatchPointer(
  element: Element,
  type: string,
  init: PointerTestInit,
): void {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.entries(init).forEach(([key, value]) => {
    Object.defineProperty(event, key, {
      configurable: true,
      value,
    });
  });

  element.dispatchEvent(event);
}
