import { describe, expect, it } from "vitest";

import {
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from "../auth-validation";

describe("auth validation", () => {
  describe("validateEmail", () => {
    it("rejects empty email", () => {
      expect(validateEmail("")).toEqual({
        valid: false,
        message: "Email is required.",
      });
    });

    it("rejects invalid email", () => {
      expect(validateEmail("test@domain")).toEqual({
        valid: false,
        message: "Enter a valid email address.",
      });
    });

    it("accepts valid email", () => {
      expect(validateEmail("user@example.com")).toEqual({
        valid: true,
        message: "",
      });
    });

    it("trims surrounding spaces", () => {
      expect(validateEmail("  user@example.com  ").valid).toBe(true);
    });
  });

  describe("validateLoginPassword", () => {
    it("rejects empty password", () => {
      expect(validateLoginPassword("")).toEqual({
        valid: false,
        message: "Password is required.",
      });
    });

    it("rejects password shorter than 6 characters", () => {
      expect(validateLoginPassword("12345").valid).toBe(false);
    });

    it("accepts password with at least 6 characters", () => {
      expect(validateLoginPassword("abcdef").valid).toBe(true);
    });
  });

  describe("validateUsername", () => {
    it("rejects empty username", () => {
      expect(validateUsername("").valid).toBe(false);
    });

    it("rejects username shorter than 2 characters", () => {
      expect(validateUsername("A").valid).toBe(false);
    });

    it("rejects username longer than 30 characters", () => {
      expect(validateUsername(`A${"b".repeat(30)}`).valid).toBe(false);
    });

    it("rejects username starting with lowercase letter", () => {
      expect(validateUsername("alex99").valid).toBe(false);
    });

    it("rejects username with unsupported characters", () => {
      expect(validateUsername("Alex_99").valid).toBe(false);
    });

    it("accepts username beginning with uppercase English letter", () => {
      expect(validateUsername("Alex99")).toEqual({
        valid: true,
        message: "",
      });
    });
  });

  describe("validateRegisterPassword", () => {
    it("rejects empty password", () => {
      expect(validateRegisterPassword("").valid).toBe(false);
    });

    it("rejects password shorter than 6 characters", () => {
      expect(validateRegisterPassword("A1!aa").valid).toBe(false);
    });

    it("rejects password without uppercase letter", () => {
      expect(validateRegisterPassword("abc123!").valid).toBe(false);
    });

    it("rejects password without digit", () => {
      expect(validateRegisterPassword("Abcdef!").valid).toBe(false);
    });

    it("rejects password without special character", () => {
      expect(validateRegisterPassword("Abc123").valid).toBe(false);
    });

    it("accepts valid registration password", () => {
      expect(validateRegisterPassword("Abc123!")).toEqual({
        valid: true,
        message: "",
      });
    });
  });

  describe("validateConfirmPassword", () => {
    it("rejects empty confirmation", () => {
      expect(validateConfirmPassword("", "Abc123!").valid).toBe(false);
    });

    it("rejects mismatched password", () => {
      expect(validateConfirmPassword("Abc123?", "Abc123!")).toEqual({
        valid: false,
        message: "Passwords do not match.",
      });
    });

    it("accepts matching password", () => {
      expect(validateConfirmPassword("Abc123!", "Abc123!")).toEqual({
        valid: true,
        message: "",
      });
    });
  });
});
