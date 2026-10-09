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

  return {
    ApiError,

    getFeaturedGames: vi.fn().mockRejectedValue(new Error("featured failed")),

    getLeaderboard: vi.fn().mockRejectedValue(new Error("leaderboard failed")),

    getCategories: vi.fn().mockRejectedValue(new Error("categories failed")),

    getGames: vi.fn().mockRejectedValue(new Error("library failed")),

    getGameDetails: vi.fn().mockRejectedValue(new Error("details failed")),

    getGameComments: vi.fn().mockRejectedValue(new Error("comments failed")),

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

import {
  ApiError,
  getCategories,
  getFeaturedGames,
  getGameComments,
  getGameDetails,
  getGames,
  getLeaderboard,
} from "../api";

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

describe("application error flows", () => {
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

    window.history.replaceState(
      {},
      "",
      "/library?category=all&sort=rating-desc&page=1&game=missing-game",
    );

    await import("../script");

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        "Featured games could not be loaded.",
      );

      expect(document.body.textContent).toContain(
        "Leaderboard could not be loaded.",
      );

      expect(document.body.textContent).toContain(
        "Categories could not be loaded.",
      );

      expect(document.body.textContent).toContain(
        "Library games could not be loaded.",
      );
    });
  });

  it("renders API error states", async () => {
    await vi.waitFor(() => {
      expect(
        document.querySelector(".game-details-header h2")?.textContent,
      ).toBe("Game details unavailable");

      expect(document.querySelector(".comment-list")?.textContent).toContain(
        "Comments could not be loaded.",
      );
    });
  });

  it("retries failed API sections", async () => {
    const featuredBefore = vi.mocked(getFeaturedGames).mock.calls.length;

    click(document.querySelector('[data-api-retry="featured"]'));

    await vi.waitFor(() => {
      expect(vi.mocked(getFeaturedGames).mock.calls.length).toBeGreaterThan(
        featuredBefore,
      );
    });

    const leaderboardBefore = vi.mocked(getLeaderboard).mock.calls.length;

    click(document.querySelector('[data-api-retry="leaderboard"]'));

    await vi.waitFor(() => {
      expect(vi.mocked(getLeaderboard).mock.calls.length).toBeGreaterThan(
        leaderboardBefore,
      );
    });

    const categoriesBefore = vi.mocked(getCategories).mock.calls.length;

    click(document.querySelector('[data-api-retry="categories"]'));

    await vi.waitFor(() => {
      expect(vi.mocked(getCategories).mock.calls.length).toBeGreaterThan(
        categoriesBefore,
      );
    });

    const gamesBefore = vi.mocked(getGames).mock.calls.length;

    click(document.querySelector('[data-api-retry="library"]'));

    await vi.waitFor(() => {
      expect(vi.mocked(getGames).mock.calls.length).toBeGreaterThan(
        gamesBefore,
      );
    });
  });

  it("handles game not found on retry", async () => {
    vi.mocked(getGameDetails).mockRejectedValueOnce(
      new ApiError("Game not found", 404),
    );

    click(document.querySelector('[data-api-retry="game-details"]'));

    await vi.waitFor(() => {
      expect(
        document.querySelector(".game-details-header h2")?.textContent,
      ).toBe("Game Not Found");

      expect(document.querySelector(".game-details-eyebrow")?.textContent).toBe(
        "404",
      );
    });
  });

  it("retries failed comments", async () => {
    const before = vi.mocked(getGameComments).mock.calls.length;

    click(document.querySelector('[data-api-retry="game-comments"]'));

    await vi.waitFor(() => {
      expect(vi.mocked(getGameComments).mock.calls.length).toBeGreaterThan(
        before,
      );
    });
  });

  it("opens and closes the mobile menu", () => {
    const burger = document.querySelector<HTMLButtonElement>(".burger-button");

    const overlay = document.querySelector<HTMLElement>(".mobile-menu-overlay");

    click(burger);

    expect(overlay?.classList.contains("mobile-menu-overlay--open")).toBe(true);

    expect(burger?.getAttribute("aria-expanded")).toBe("true");

    overlay?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
      }),
    );

    expect(overlay?.classList.contains("mobile-menu-overlay--open")).toBe(
      false,
    );

    click(burger);

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );

    expect(overlay?.classList.contains("mobile-menu-overlay--open")).toBe(
      false,
    );
  });

  it("toggles password visibility", () => {
    const button =
      document.querySelector<HTMLButtonElement>(".password-toggle");

    const input = button
      ?.closest(".auth-input")
      ?.querySelector<HTMLInputElement>("input");

    expect(input).not.toBeNull();

    expect(input?.type).toBe("password");

    click(button);

    expect(input?.type).toBe("text");

    click(button);

    expect(input?.type).toBe("password");
  });

  it("opens auth from URL and handles cancel", async () => {
    window.history.pushState({}, "", "/home?auth=register");

    window.dispatchEvent(new PopStateEvent("popstate"));

    const dialog = document.querySelector<HTMLDialogElement>(".auth-dialog");

    await vi.waitFor(() => {
      expect(dialog?.open).toBe(true);
    });

    dialog?.dispatchEvent(
      new Event("cancel", {
        cancelable: true,
      }),
    );

    await vi.waitFor(() => {
      expect(new URL(window.location.href).searchParams.has("auth")).toBe(
        false,
      );
    });
  });

  it("renders custom 404 and returns home", async () => {
    window.history.pushState({}, "", "/totally-invalid-route");

    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(
        document.querySelector<HTMLElement>("#not-found-page")?.hidden,
      ).toBe(false);
    });

    click(document.querySelector("[data-return-home]"));

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe("/home");
    });
  });
});
