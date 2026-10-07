import {
  createAppSession,
  inspectAppSession,
  removeAppSession,
  saveAppSession,
  type AppSession,
  type SessionSource,
} from "./app-session";

import { logoutFromFirebase } from "./auth-service";

interface SessionManagerOptions {
  onSessionChange: (session: AppSession | null) => void;
  onExpired: () => void;
}

export interface SessionManager {
  restore: () => Promise<AppSession | null>;
  start: (user: SessionSource) => AppSession;
  getSession: () => AppSession | null;
  check: () => Promise<AppSession | null>;
  logout: () => Promise<void>;
}

export function createSessionManager(
  options: SessionManagerOptions,
): SessionManager {
  let currentSession: AppSession | null = null;
  let expirationNotified = false;

  async function forceGuest(): Promise<void> {
    currentSession = null;
    removeAppSession();
    options.onSessionChange(null);

    try {
      await logoutFromFirebase();
    } catch {
      // App session remains Guest even if Firebase signOut fails.
    }
  }

  async function restore(): Promise<AppSession | null> {
    const result = inspectAppSession();

    if (result.status === "valid") {
      currentSession = result.session;
      expirationNotified = false;
      options.onSessionChange(currentSession);

      return currentSession;
    }

    await forceGuest();

    if (result.status === "expired" && !expirationNotified) {
      expirationNotified = true;
      options.onExpired();
    }

    return null;
  }

  function start(user: SessionSource): AppSession {
    const session = createAppSession(user);

    saveAppSession(session);

    currentSession = session;
    expirationNotified = false;
    options.onSessionChange(session);

    return session;
  }

  async function check(): Promise<AppSession | null> {
    const result = inspectAppSession();

    if (result.status === "valid") {
      currentSession = result.session;
      return currentSession;
    }

    await forceGuest();

    if (result.status === "expired" && !expirationNotified) {
      expirationNotified = true;
      options.onExpired();
    }

    return null;
  }

  async function logout(): Promise<void> {
    currentSession = null;
    expirationNotified = false;

    removeAppSession();
    options.onSessionChange(null);

    await logoutFromFirebase();
  }

  return {
    restore,
    start,
    getSession: () => currentSession,
    check,
    logout,
  };
}
