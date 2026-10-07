import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginWithEmailMock, loginWithGoogleMock, registerWithEmailMock } =
  vi.hoisted(() => ({
    loginWithEmailMock: vi.fn(),
    loginWithGoogleMock: vi.fn(),
    registerWithEmailMock: vi.fn(),
  }));

vi.mock("../auth-service", () => ({
  loginWithEmail: loginWithEmailMock,
  loginWithGoogle: loginWithGoogleMock,
  registerWithEmail: registerWithEmailMock,
}));

import { setupAuthFlow } from "../auth-flow";

function createAuthUi() {
  document.body.innerHTML = `
    <dialog class="auth-dialog">
      <form class="login-form">
        <input name="email" value="user@example.com" />
        <input name="password" value="abcdef" />
        <button type="submit">Login</button>
      </form>

      <form class="register-form">
        <input name="username" value="Alex99" />
        <input name="email" value="alex@example.com" />
        <input name="password" value="Abc123!" />
        <button type="submit">Register</button>
      </form>

      <button class="google-button" type="button">
        Google
      </button>
    </dialog>
  `;

  return {
    dialog: document.querySelector<HTMLDialogElement>("dialog")!,
    loginForm: document.querySelector<HTMLFormElement>(".login-form")!,
    registerForm: document.querySelector<HTMLFormElement>(".register-form")!,
  };
}

describe("auth flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.replaceChildren();
  });

  it("logs in with email credentials", async () => {
    const ui = createAuthUi();

    loginWithEmailMock.mockResolvedValue({
      email: "user@example.com",
      displayName: "User",
      avatarUrl: null,
    });

    const onSuccess = vi.fn();

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess,
      onError: vi.fn(),
    });

    ui.loginForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await vi.waitFor(() => {
      expect(loginWithEmailMock).toHaveBeenCalledWith(
        "user@example.com",
        "abcdef",
      );
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("registers with email, password and username", async () => {
    const ui = createAuthUi();

    registerWithEmailMock.mockResolvedValue({
      email: "alex@example.com",
      displayName: "Alex99",
      avatarUrl: null,
    });

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    ui.registerForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await vi.waitFor(() => {
      expect(registerWithEmailMock).toHaveBeenCalledWith(
        "alex@example.com",
        "Abc123!",
        "Alex99",
      );
    });
  });

  it("does not authenticate when validation fails", () => {
    const ui = createAuthUi();

    setupAuthFlow({
      ...ui,
      validateLogin: () => false,
      validateRegister: () => false,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    ui.loginForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(loginWithEmailMock).not.toHaveBeenCalled();
  });

  it("locks controls while authentication is pending", async () => {
    const ui = createAuthUi();

    let resolveLogin:
      | ((value: {
          email: string;
          displayName: string;
          avatarUrl: null;
        }) => void)
      | undefined;

    loginWithEmailMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    ui.loginForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await vi.waitFor(() => {
      expect(ui.dialog.getAttribute("aria-busy")).toBe("true");
    });

    const controls = ui.dialog.querySelectorAll<
      HTMLInputElement | HTMLButtonElement
    >("input, button");

    controls.forEach((control) => {
      expect(control.disabled).toBe(true);
    });

    resolveLogin?.({
      email: "user@example.com",
      displayName: "User",
      avatarUrl: null,
    });

    await vi.waitFor(() => {
      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });
  });

  it("handles Google authentication", async () => {
    const ui = createAuthUi();

    loginWithGoogleMock.mockResolvedValue({
      email: "google@example.com",
      displayName: "Google User",
      avatarUrl: null,
    });

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess: vi.fn(),
      onError: vi.fn(),
    });

    ui.dialog.querySelector<HTMLButtonElement>(".google-button")!.click();

    await vi.waitFor(() => {
      expect(loginWithGoogleMock).toHaveBeenCalledOnce();
    });
  });

  it("keeps the dialog usable after authentication failure", async () => {
    const ui = createAuthUi();
    const onError = vi.fn();

    loginWithEmailMock.mockRejectedValue(new Error("Invalid credentials"));

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess: vi.fn(),
      onError,
    });

    ui.loginForm.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        "Authentication failed. Please try again.",
      );
    });

    expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
  });
});
