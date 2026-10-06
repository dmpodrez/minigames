import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCategories,
  getLeaderboard,
  getFeaturedGames,
  getGameComments,
  getGameDetails,
  getGames,
} from "../api";

function createJsonResponse(
  body: unknown,
  options: {
    ok?: boolean;
    status?: number;
  } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests featured games from the backend", async () => {
    const responseBody = {
      data: [],
      meta: {
        page: 1,
        limit: 6,
        totalItems: 0,
        totalPages: 0,
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse(responseBody));

    vi.stubGlobal("fetch", fetchMock);

    const result = await getFeaturedGames();

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledOnce();

    const url = fetchMock.mock.calls[0]?.[0];

    expect(url).toBeInstanceOf(URL);
    expect(String(url)).toContain("/api/games");
    expect((url as URL).searchParams.get("featured")).toBe("true");
  });

  it("uses default Library query parameters", async () => {
    const responseBody = {
      data: [],
      meta: {
        page: 1,
        limit: 6,
        totalItems: 0,
        totalPages: 0,
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse(responseBody));

    vi.stubGlobal("fetch", fetchMock);

    await getGames();

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.searchParams.get("category")).toBe("all");
    expect(url.searchParams.get("sort")).toBe("rating-desc");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("6");
  });

  it("uses supplied Library query parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: [],
        meta: {
          page: 3,
          limit: 6,
          totalItems: 20,
          totalPages: 4,
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await getGames({
      category: "puzzle",
      sort: "name-asc",
      page: 3,
      limit: 6,
    });

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.searchParams.get("category")).toBe("puzzle");
    expect(url.searchParams.get("sort")).toBe("name-asc");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("limit")).toBe("6");
  });

  it("encodes the game slug in the details request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {},
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await getGameDetails("game with spaces");

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.pathname).toContain("/games/game%20with%20spaces");
  });

  it("requests the three newest comments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await getGameComments("cat-mail-co");

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.pathname).toContain("/games/cat-mail-co/comments");
    expect(url.searchParams.get("limit")).toBe("3");
    expect(url.searchParams.get("sort")).toBe("newest");
  });
  it("requests leaderboard data", async () => {
    const responseBody = {
      data: [],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse(responseBody));

    vi.stubGlobal("fetch", fetchMock);

    const result = await getLeaderboard();

    expect(result).toEqual(responseBody);

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.pathname).toContain("/api/leaderboard");
  });

  it("requests game categories", async () => {
    const responseBody = {
      data: [],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse(responseBody));

    vi.stubGlobal("fetch", fetchMock);

    const result = await getCategories();

    expect(result).toEqual(responseBody);

    const url = fetchMock.mock.calls[0]?.[0] as URL;

    expect(url.pathname).toContain("/api/categories");
  });
  it("throws ApiError with the response status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({}, { ok: false, status: 404 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getGameDetails("missing-game")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        status: 404,
      }),
    );
  });
});
