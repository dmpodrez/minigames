export const APP_SESSION_KEY = "minigames:dmpodrez:app-session";

export const APP_SESSION_DURATION_MS = 5 * 60 * 1000;

export interface AppSession {
  email: string;
  displayName: string;
  authenticatedAt: number;
  avatarUrl?: string;
}

export interface SessionSource {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function fallbackDisplayName(email: string): string {
  const localPart = email.split("@")[0]?.trim();

  if (localPart) {
    return localPart;
  }

  return "Player";
}

export function resolveDisplayName(
  displayName: string | null,
  email: string,
): string {
  const trimmed = displayName?.trim();

  return trimmed || fallbackDisplayName(email);
}

export function createAppSession(
  user: SessionSource,
  now = Date.now(),
): AppSession {
  const session: AppSession = {
    email: user.email,
    displayName: resolveDisplayName(user.displayName, user.email),
    authenticatedAt: now,
  };

  if (user.avatarUrl) {
    session.avatarUrl = user.avatarUrl;
  }

  return session;
}

export function saveAppSession(session: AppSession): void {
  localStorage.setItem(APP_SESSION_KEY, JSON.stringify(session));
}

export function removeAppSession(): void {
  localStorage.removeItem(APP_SESSION_KEY);
}

function isValidSessionShape(value: unknown): value is AppSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AppSession>;

  return (
    typeof session.email === "string" &&
    session.email.length > 0 &&
    typeof session.displayName === "string" &&
    session.displayName.length > 0 &&
    typeof session.authenticatedAt === "number" &&
    Number.isFinite(session.authenticatedAt) &&
    (session.avatarUrl === undefined || typeof session.avatarUrl === "string")
  );
}

export function isAppSessionExpired(
  session: AppSession,
  now = Date.now(),
): boolean {
  return now - session.authenticatedAt >= APP_SESSION_DURATION_MS;
}
export type AppSessionStatus = "missing" | "invalid" | "expired" | "valid";

export interface AppSessionReadResult {
  status: AppSessionStatus;
  session: AppSession | null;
}

export function inspectAppSession(now = Date.now()): AppSessionReadResult {
  const raw = localStorage.getItem(APP_SESSION_KEY);

  if (!raw) {
    return {
      status: "missing",
      session: null,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isValidSessionShape(parsed)) {
      removeAppSession();

      return {
        status: "invalid",
        session: null,
      };
    }

    if (isAppSessionExpired(parsed, now)) {
      removeAppSession();

      return {
        status: "expired",
        session: null,
      };
    }

    return {
      status: "valid",
      session: parsed,
    };
  } catch {
    removeAppSession();

    return {
      status: "invalid",
      session: null,
    };
  }
}
export function readAppSession(now = Date.now()): AppSession | null {
  return inspectAppSession(now).session;
}
