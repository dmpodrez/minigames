import { beforeEach, describe, expect, it, vi } from "vitest";

const { logoutFromFirebaseMock } = vi.hoisted(() => ({
  logoutFromFirebaseMock: vi.fn(),
}));

vi.mock("../auth-service", () => ({
  logoutFromFirebase: logoutFromFirebaseMock,
}));

import {
  APP_SESSION_DURATION_MS,
  APP_SESSION_KEY,
  saveAppSession,
  type AppSession,
} from "../app-session";

import { createSessionManager } from "../session-manager";

describe("session manager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();

    logoutFromFirebaseMock.mockResolvedValue(undefined);
  });

  it("starts and stores a new app session", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);

    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired: vi.fn(),
    });

    const session = manager.start({
      email: "alex@example.com",
      displayName: "Alex",
      avatarUrl: null,
    });

    expect(session).toEqual({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 10_000,
    });

    expect(manager.getSession()).toEqual(session);
    expect(onSessionChange).toHaveBeenCalledWith(session);

    expect(JSON.parse(localStorage.getItem(APP_SESSION_KEY) ?? "")).toEqual(
      session,
    );
  });

  it("restores a valid session without changing authenticatedAt", async () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 10_000,
    };

    saveAppSession(session);

    vi.spyOn(Date, "now").mockReturnValue(10_000 + APP_SESSION_DURATION_MS - 1);

    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired: vi.fn(),
    });

    const restored = await manager.restore();

    expect(restored).toEqual(session);
    expect(restored?.authenticatedAt).toBe(10_000);
    expect(manager.getSession()).toEqual(session);

    expect(onSessionChange).toHaveBeenCalledWith(session);
    expect(logoutFromFirebaseMock).not.toHaveBeenCalled();
  });

  it("switches to Guest and signs out Firebase when session is missing", async () => {
    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired: vi.fn(),
    });

    const result = await manager.restore();

    expect(result).toBeNull();
    expect(manager.getSession()).toBeNull();

    expect(onSessionChange).toHaveBeenCalledWith(null);
    expect(logoutFromFirebaseMock).toHaveBeenCalledOnce();
  });

  it("switches to Guest for malformed session data", async () => {
    localStorage.setItem(APP_SESSION_KEY, "{invalid-json");
    localStorage.setItem("theme", "dark");

    const manager = createSessionManager({
      onSessionChange: vi.fn(),
      onExpired: vi.fn(),
    });

    await manager.restore();

    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");

    expect(logoutFromFirebaseMock).toHaveBeenCalledOnce();
  });

  it("expires the session exactly after five minutes", async () => {
    const authenticatedAt = 1_000;

    saveAppSession({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt,
    });

    vi.spyOn(Date, "now").mockReturnValue(
      authenticatedAt + APP_SESSION_DURATION_MS,
    );

    const onExpired = vi.fn();
    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired,
    });

    const result = await manager.restore();

    expect(result).toBeNull();
    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();

    expect(onSessionChange).toHaveBeenCalledWith(null);
    expect(logoutFromFirebaseMock).toHaveBeenCalledOnce();
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("notifies about expiration only once", async () => {
    const authenticatedAt = 1_000;

    saveAppSession({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt,
    });

    vi.spyOn(Date, "now").mockReturnValue(
      authenticatedAt + APP_SESSION_DURATION_MS,
    );

    const onExpired = vi.fn();

    const manager = createSessionManager({
      onSessionChange: vi.fn(),
      onExpired,
    });

    await manager.check();
    await manager.check();

    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("returns a valid session from check", async () => {
    const session: AppSession = {
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 10_000,
    };

    saveAppSession(session);

    vi.spyOn(Date, "now").mockReturnValue(20_000);

    const manager = createSessionManager({
      onSessionChange: vi.fn(),
      onExpired: vi.fn(),
    });

    const result = await manager.check();

    expect(result).toEqual(session);
    expect(manager.getSession()).toEqual(session);
    expect(logoutFromFirebaseMock).not.toHaveBeenCalled();
  });

  it("logs out and removes only the app session", async () => {
    saveAppSession({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 10_000,
    });

    localStorage.setItem("theme", "dark");

    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired: vi.fn(),
    });

    await manager.logout();

    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");

    expect(manager.getSession()).toBeNull();
    expect(onSessionChange).toHaveBeenCalledWith(null);
    expect(logoutFromFirebaseMock).toHaveBeenCalledOnce();
  });

  it("remains Guest even when Firebase signOut fails", async () => {
    logoutFromFirebaseMock.mockRejectedValue(
      new Error("Firebase signOut failed"),
    );

    const onSessionChange = vi.fn();

    const manager = createSessionManager({
      onSessionChange,
      onExpired: vi.fn(),
    });

    await expect(manager.logout()).rejects.toThrow("Firebase signOut failed");

    expect(manager.getSession()).toBeNull();
    expect(onSessionChange).toHaveBeenCalledWith(null);
    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
  });
});
