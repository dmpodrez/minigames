export interface ValidationResult {
  valid: boolean;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Z][A-Za-z0-9]{1,29}$/;
const REGISTER_PASSWORD_PATTERN =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/;

export function validateEmail(value: string): ValidationResult {
  const email = value.trim();

  if (!email) {
    return {
      valid: false,
      message: "Email is required.",
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      valid: false,
      message: "Enter a valid email address.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateLoginPassword(value: string): ValidationResult {
  if (!value) {
    return {
      valid: false,
      message: "Password is required.",
    };
  }

  if (value.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateUsername(value: string): ValidationResult {
  const username = value.trim();

  if (!username) {
    return {
      valid: false,
      message: "Username is required.",
    };
  }

  if (username.length < 2 || username.length > 30) {
    return {
      valid: false,
      message: "Username must be between 2 and 30 characters.",
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      message:
        "Username must start with an uppercase English letter and contain only English letters or digits.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateRegisterPassword(value: string): ValidationResult {
  if (!value) {
    return {
      valid: false,
      message: "Password is required.",
    };
  }

  if (value.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters.",
    };
  }

  if (!REGISTER_PASSWORD_PATTERN.test(value)) {
    return {
      valid: false,
      message:
        "Password must contain an uppercase letter, a digit and a special character.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateConfirmPassword(
  value: string,
  password: string,
): ValidationResult {
  if (!value) {
    return {
      valid: false,
      message: "Please confirm your password.",
    };
  }

  if (value !== password) {
    return {
      valid: false,
      message: "Passwords do not match.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}
