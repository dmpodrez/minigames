import { beforeEach, describe, expect, it } from "vitest";

import {
  APP_SESSION_DURATION_MS,
  APP_SESSION_KEY,
  createAppSession,
  isAppSessionExpired,
  readAppSession,
  removeAppSession,
  resolveDisplayName,
  saveAppSession,
  type AppSession,
} from "../app-session";

describe("app session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resolves display name from Firebase displayName", () => {
    expect(resolveDisplayName(" Alex ", "alex@example.com")).toBe("Alex");
  });

  it("falls back to email local part when displayName is missing", () => {
    expect(resolveDisplayName(null, "alex@example.com")).toBe("alex");
  });

  it("falls back to Player when email local part is unavailable", () => {
    expect(resolveDisplayName(null, "")).toBe("Player");
  });

  it("creates a session with the original authentication timestamp", () => {
    const session = createAppSession(
      {
        email: "alex@example.com",
        displayName: "Alex",
        avatarUrl: null,
      },
      123456,
    );

    expect(session).toEqual({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 123456,
    });
  });

  it("includes avatarUrl when available", () => {
    const session = createAppSession(
      {
        email: "alex@example.com",
        displayName: "Alex",
        avatarUrl: "https://example.com/avatar.jpg",
      },
      1000,
    );

    expect(session.avatarUrl).toBe("https://example.com/avatar.jpg");
  });

  it("saves and restores a valid session without changing authenticatedAt", () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 10_000,
    };

    saveAppSession(session);

    const restored = readAppSession(10_000 + APP_SESSION_DURATION_MS - 1);

    expect(restored).toEqual(session);
    expect(restored?.authenticatedAt).toBe(10_000);
  });

  it("is not expired one millisecond before five minutes", () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1_000,
    };

    expect(
      isAppSessionExpired(session, 1_000 + APP_SESSION_DURATION_MS - 1),
    ).toBe(false);
  });

  it("expires exactly at five minutes", () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1_000,
    };

    expect(isAppSessionExpired(session, 1_000 + APP_SESSION_DURATION_MS)).toBe(
      true,
    );
  });

  it("removes an expired session from localStorage", () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1_000,
    };

    saveAppSession(session);

    expect(readAppSession(1_000 + APP_SESSION_DURATION_MS)).toBeNull();

    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
  });

  it("removes malformed JSON without touching unrelated storage", () => {
    localStorage.setItem(APP_SESSION_KEY, "{bad json");
    localStorage.setItem("theme", "dark");

    expect(readAppSession()).toBeNull();

    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("removes invalid session shape", () => {
    localStorage.setItem(
      APP_SESSION_KEY,
      JSON.stringify({
        email: "alex@example.com",
        authenticatedAt: 1000,
      }),
    );

    expect(readAppSession()).toBeNull();
  });

  it("returns null when no session exists", () => {
    expect(readAppSession()).toBeNull();
  });

  it("removes only the app session key", () => {
    saveAppSession({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1000,
    });

    localStorage.setItem("other-key", "keep-me");

    removeAppSession();

    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("other-key")).toBe("keep-me");
  });
});
