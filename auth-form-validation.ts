import {
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
  type ValidationResult,
} from "./auth-validation";

export type AuthFormMode = "login" | "register";

interface AuthFormController {
  reset: () => void;
  validate: () => boolean;
}

function getInput(
  form: HTMLFormElement,
  name: string,
): HTMLInputElement | null {
  return form.querySelector<HTMLInputElement>(`[name="${name}"]`);
}

function getErrorElement(input: HTMLInputElement): HTMLElement {
  const field = input.closest<HTMLElement>(".auth-field");

  if (!field) {
    throw new Error(`Auth field not found for ${input.name}`);
  }

  let error = field.querySelector<HTMLElement>(".auth-field-error");

  if (!error) {
    error = document.createElement("p");
    error.className = "auth-field-error";
    error.setAttribute("aria-live", "polite");

    field.append(error);
  }

  return error;
}

function renderValidation(
  input: HTMLInputElement,
  result: ValidationResult,
): void {
  const error = getErrorElement(input);

  input.setAttribute("aria-invalid", String(!result.valid));
  error.textContent = result.message;

  input
    .closest(".auth-input")
    ?.classList.toggle("auth-input--error", !result.valid);
}

export function setupAuthFormValidation(
  form: HTMLFormElement,
  mode: AuthFormMode,
): AuthFormController {
  const submitButton = form.querySelector<HTMLButtonElement>(".auth-submit");

  const email = getInput(form, "email");
  const password = getInput(form, "password");
  const username = mode === "register" ? getInput(form, "username") : null;
  const confirmPassword =
    mode === "register" ? getInput(form, "confirm-password") : null;

  function validateField(input: HTMLInputElement): boolean {
    let result: ValidationResult;

    if (input === email) {
      result = validateEmail(input.value);
    } else if (input === username) {
      result = validateUsername(input.value);
    } else if (input === confirmPassword) {
      result = validateConfirmPassword(input.value, password?.value ?? "");
    } else if (input === password) {
      result =
        mode === "register"
          ? validateRegisterPassword(input.value)
          : validateLoginPassword(input.value);
    } else {
      return true;
    }

    renderValidation(input, result);

    return result.valid;
  }

  function getInputs(): HTMLInputElement[] {
    return [username, email, password, confirmPassword].filter(
      (input): input is HTMLInputElement => input !== null,
    );
  }

  function isFormValid(): boolean {
    if (!email || !password) {
      return false;
    }

    const emailValid = validateEmail(email.value).valid;

    const passwordValid =
      mode === "register"
        ? validateRegisterPassword(password.value).valid
        : validateLoginPassword(password.value).valid;

    if (mode === "login") {
      return emailValid && passwordValid;
    }

    if (!username || !confirmPassword) {
      return false;
    }

    return (
      validateUsername(username.value).valid &&
      emailValid &&
      passwordValid &&
      validateConfirmPassword(confirmPassword.value, password.value).valid
    );
  }

  function updateSubmitState(): void {
    if (submitButton) {
      submitButton.disabled = !isFormValid();
    }
  }

  function validate(): boolean {
    const inputs = getInputs();

    const valid = inputs.map((input) => validateField(input)).every(Boolean);

    updateSubmitState();

    return valid;
  }

  function reset(): void {
    form.reset();

    for (const input of getInputs()) {
      input.removeAttribute("aria-invalid");
      input.closest(".auth-input")?.classList.remove("auth-input--error");

      const field = input.closest<HTMLElement>(".auth-field");
      const error = field?.querySelector<HTMLElement>(".auth-field-error");

      if (error) {
        error.textContent = "";
      }
    }

    updateSubmitState();
  }

  for (const input of getInputs()) {
    const handleValidation = (): void => {
      validateField(input);

      if (input === password && confirmPassword?.value) {
        validateField(confirmPassword);
      }

      updateSubmitState();
    };

    input.addEventListener("input", handleValidation);
    input.addEventListener("change", handleValidation);
    input.addEventListener("blur", handleValidation);
  }

  submitButton?.setAttribute("disabled", "");

  return {
    reset,
    validate,
  };
}
