import { afterEach, describe, expect, it } from "vitest";

import { setupAuthFormValidation } from "../auth-form-validation";

function createLoginForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form class="auth-form">
      <div class="auth-field">
        <div class="auth-input">
          <input name="email" type="email" />
        </div>
      </div>

      <div class="auth-field">
        <div class="auth-input">
          <input name="password" type="password" />
        </div>
      </div>

      <button class="auth-submit" type="submit">Login</button>
    </form>
  `;

  return document.querySelector<HTMLFormElement>(".auth-form")!;
}

function createRegisterForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form class="auth-form">
      <div class="auth-field">
        <div class="auth-input">
          <input name="username" />
        </div>
      </div>

      <div class="auth-field">
        <div class="auth-input">
          <input name="email" type="email" />
        </div>
      </div>

      <div class="auth-field">
        <div class="auth-input">
          <input name="password" type="password" />
        </div>
      </div>

      <div class="auth-field">
        <div class="auth-input">
          <input name="confirm-password" type="password" />
        </div>
      </div>

      <button class="auth-submit" type="submit">
        Create Account
      </button>
    </form>
  `;

  return document.querySelector<HTMLFormElement>(".auth-form")!;
}

function inputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("auth form validation", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("keeps login submit disabled until the form is valid", () => {
    const form = createLoginForm();

    setupAuthFormValidation(form, "login");

    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;
    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;
    const submit = form.querySelector<HTMLButtonElement>(".auth-submit")!;

    expect(submit.disabled).toBe(true);

    inputValue(email, "user@example.com");
    inputValue(password, "abcdef");

    expect(submit.disabled).toBe(false);
  });

  it("shows and clears an inline email error in real time", () => {
    const form = createLoginForm();

    setupAuthFormValidation(form, "login");

    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;

    inputValue(email, "invalid-email");

    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(
      email.closest(".auth-field")?.querySelector(".auth-field-error")
        ?.textContent,
    ).toBe("Enter a valid email address.");

    inputValue(email, "user@example.com");

    expect(email.getAttribute("aria-invalid")).toBe("false");
    expect(
      email.closest(".auth-field")?.querySelector(".auth-field-error")
        ?.textContent,
    ).toBe("");
  });

  it("validates a field on blur", () => {
    const form = createLoginForm();

    setupAuthFormValidation(form, "login");

    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;

    password.value = "123";
    password.dispatchEvent(new FocusEvent("blur"));

    expect(password.getAttribute("aria-invalid")).toBe("true");
    expect(
      password.closest(".auth-field")?.querySelector(".auth-field-error")
        ?.textContent,
    ).toBe("Password must be at least 6 characters.");
  });

  it("revalidates confirm password when password changes", () => {
    const form = createRegisterForm();

    setupAuthFormValidation(form, "register");

    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;
    const confirmation = form.querySelector<HTMLInputElement>(
      '[name="confirm-password"]',
    )!;

    inputValue(password, "Abc123!");
    inputValue(confirmation, "Abc123!");

    expect(confirmation.getAttribute("aria-invalid")).toBe("false");

    inputValue(password, "Changed1!");

    expect(confirmation.getAttribute("aria-invalid")).toBe("true");
    expect(
      confirmation.closest(".auth-field")?.querySelector(".auth-field-error")
        ?.textContent,
    ).toBe("Passwords do not match.");
  });

  it("enables register submit only when all fields are valid", () => {
    const form = createRegisterForm();

    setupAuthFormValidation(form, "register");

    const username = form.querySelector<HTMLInputElement>('[name="username"]')!;
    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;
    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;
    const confirmation = form.querySelector<HTMLInputElement>(
      '[name="confirm-password"]',
    )!;
    const submit = form.querySelector<HTMLButtonElement>(".auth-submit")!;

    inputValue(username, "Alex99");
    inputValue(email, "alex@example.com");
    inputValue(password, "Abc123!");
    inputValue(confirmation, "Abc123!");

    expect(submit.disabled).toBe(false);
  });

  it("reset clears values and validation errors", () => {
    const form = createLoginForm();

    const controller = setupAuthFormValidation(form, "login");

    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;
    const submit = form.querySelector<HTMLButtonElement>(".auth-submit")!;

    inputValue(email, "wrong");

    expect(email.getAttribute("aria-invalid")).toBe("true");

    controller.reset();

    expect(email.value).toBe("");
    expect(email.hasAttribute("aria-invalid")).toBe(false);
    expect(submit.disabled).toBe(true);
  });
  it("validates the whole login form through the controller", () => {
    const form = createLoginForm();
    const controller = setupAuthFormValidation(form, "login");

    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;
    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;

    email.value = "user@example.com";
    password.value = "abcdef";

    expect(controller.validate()).toBe(true);
  });

  it("returns false and renders errors when the whole form is invalid", () => {
    const form = createLoginForm();
    const controller = setupAuthFormValidation(form, "login");

    expect(controller.validate()).toBe(false);

    const email = form.querySelector<HTMLInputElement>('[name="email"]')!;
    const password = form.querySelector<HTMLInputElement>('[name="password"]')!;

    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(password.getAttribute("aria-invalid")).toBe("true");
  });

  it("validates the whole registration form through the controller", () => {
    const form = createRegisterForm();
    const controller = setupAuthFormValidation(form, "register");

    form.querySelector<HTMLInputElement>('[name="username"]')!.value = "Alex99";
    form.querySelector<HTMLInputElement>('[name="email"]')!.value =
      "alex@example.com";
    form.querySelector<HTMLInputElement>('[name="password"]')!.value =
      "Abc123!";
    form.querySelector<HTMLInputElement>('[name="confirm-password"]')!.value =
      "Abc123!";

    expect(controller.validate()).toBe(true);
  });

  it("throws when an auth input is not inside an auth field", () => {
    document.body.innerHTML = `
    <form class="auth-form">
      <input name="email" />
      <div class="auth-field">
        <div class="auth-input">
          <input name="password" />
        </div>
      </div>
      <button class="auth-submit" type="submit">Login</button>
    </form>
  `;

    const form = document.querySelector<HTMLFormElement>(".auth-form")!;
    const controller = setupAuthFormValidation(form, "login");

    expect(() => controller.validate()).toThrow(
      "Auth field not found for email",
    );
  });
});
