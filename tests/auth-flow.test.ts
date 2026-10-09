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
        <input
          name="email"
          value="user@example.com"
        />
        <input
          name="password"
          value="abcdef"
        />
        <button
          class="login-submit"
          type="submit"
        >
          Login
        </button>
      </form>

      <form class="register-form">
        <input
          name="username"
          value="Alex99"
        />
        <input
          name="email"
          value="alex@example.com"
        />
        <input
          name="password"
          value="Abc123!"
        />
        <button
          class="register-submit"
          type="submit"
        >
          Register
        </button>
      </form>

      <button
        class="google-button"
        type="button"
      >
        Google
      </button>
    </dialog>
  `;

  return {
    dialog: document.querySelector<HTMLDialogElement>(".auth-dialog")!,
    loginForm: document.querySelector<HTMLFormElement>(".login-form")!,
    registerForm: document.querySelector<HTMLFormElement>(".register-form")!,
  };
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(
    new Event("submit", {
      bubbles: true,
      cancelable: true,
    }),
  );
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

    submit(ui.loginForm);

    await vi.waitFor(() => {
      expect(loginWithEmailMock).toHaveBeenCalledWith(
        "user@example.com",
        "abcdef",
      );

      expect(onSuccess).toHaveBeenCalledOnce();

      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });
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

    submit(ui.registerForm);

    await vi.waitFor(() => {
      expect(registerWithEmailMock).toHaveBeenCalledWith(
        "alex@example.com",
        "Abc123!",
        "Alex99",
      );

      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
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

    submit(ui.loginForm);
    submit(ui.registerForm);

    expect(loginWithEmailMock).not.toHaveBeenCalled();

    expect(registerWithEmailMock).not.toHaveBeenCalled();
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

    submit(ui.loginForm);

    await vi.waitFor(() => {
      expect(ui.dialog.getAttribute("aria-busy")).toBe("true");
    });

    ui.dialog
      .querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")
      .forEach((control) => {
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

      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });
  });

  it("restores controls after authentication failure", async () => {
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

    submit(ui.loginForm);

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Invalid credentials");

      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });

    ui.dialog
      .querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")
      .forEach((control) => {
        expect(control.disabled).toBe(false);
      });
  });

  it("uses fallback message for non-Error rejection", async () => {
    const ui = createAuthUi();
    const onError = vi.fn();

    loginWithEmailMock.mockRejectedValue("firebase-error");

    setupAuthFlow({
      ...ui,
      validateLogin: () => true,
      validateRegister: () => true,
      onSuccess: vi.fn(),
      onError,
    });

    submit(ui.loginForm);

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        "Authentication failed. Please try again.",
      );

      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });
  });

  it("prevents duplicate requests while pending", async () => {
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

    submit(ui.loginForm);
    submit(ui.loginForm);

    expect(loginWithEmailMock).toHaveBeenCalledTimes(1);

    resolveLogin?.({
      email: "user@example.com",
      displayName: "User",
      avatarUrl: null,
    });

    await vi.waitFor(() => {
      expect(ui.dialog.getAttribute("aria-busy")).toBe("false");
    });
  });
});
