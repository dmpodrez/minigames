import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  type AuthUser,
} from "./auth-service";

interface AuthFlowOptions {
  dialog: HTMLDialogElement;
  loginForm: HTMLFormElement;
  registerForm: HTMLFormElement;
  validateLogin: () => boolean;
  validateRegister: () => boolean;
  onSuccess: (user: AuthUser) => void | Promise<void>;
  onError: (message: string) => void;
}

export interface AuthFlowController {
  isPending: () => boolean;
}

function getInput(form: HTMLFormElement, name: string): HTMLInputElement {
  const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);

  if (!input) {
    throw new Error(`Auth input not found: ${name}`);
  }

  return input;
}

export function setupAuthFlow(options: AuthFlowOptions): AuthFlowController {
  let pending = false;

  const previousDisabledState = new Map<
    HTMLInputElement | HTMLButtonElement,
    boolean
  >();

  function setPending(value: boolean): void {
    pending = value;

    options.dialog.classList.toggle("auth-dialog--pending", value);
    options.dialog.setAttribute("aria-busy", String(value));

    const controls = options.dialog.querySelectorAll<
      HTMLInputElement | HTMLButtonElement
    >("input, button");

    controls.forEach((control) => {
      if (value) {
        previousDisabledState.set(control, control.disabled);
        control.disabled = true;
      } else {
        control.disabled = previousDisabledState.get(control) ?? false;
      }
    });

    if (!value) {
      previousDisabledState.clear();
    }
  }

  async function run(action: () => Promise<AuthUser>): Promise<void> {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const user = await action();

      await options.onSuccess(user);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";

      options.onError(message);
    } finally {
      setPending(false);
    }
  }

  options.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!options.validateLogin()) {
      return;
    }

    const email = getInput(options.loginForm, "email").value.trim();

    const password = getInput(options.loginForm, "password").value;

    void run(() => loginWithEmail(email, password));
  });

  options.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!options.validateRegister()) {
      return;
    }

    const username = getInput(options.registerForm, "username").value.trim();

    const email = getInput(options.registerForm, "email").value.trim();

    const password = getInput(options.registerForm, "password").value;

    void run(() => registerWithEmail(email, password, username));
  });

  const googleButtons =
    options.dialog.querySelectorAll<HTMLButtonElement>(".google-button");

  googleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      void run(loginWithGoogle);
    });
  });

  return {
    isPending: () => pending,
  };
}
