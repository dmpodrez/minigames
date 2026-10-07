import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUserWithEmailAndPasswordMock,
  signInWithEmailAndPasswordMock,
  signInWithPopupMock,
  signOutMock,
  updateProfileMock,
} = vi.hoisted(() => ({
  createUserWithEmailAndPasswordMock: vi.fn(),
  signInWithEmailAndPasswordMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signOutMock: vi.fn(),
  updateProfileMock: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: createUserWithEmailAndPasswordMock,
  signInWithEmailAndPassword: signInWithEmailAndPasswordMock,
  signInWithPopup: signInWithPopupMock,
  signOut: signOutMock,
  updateProfile: updateProfileMock,
}));

vi.mock("../firebase", () => ({
  firebaseAuth: { name: "test-auth" },
  googleProvider: { name: "google-provider" },
}));

import {
  loginWithEmail,
  loginWithGoogle,
  logoutFromFirebase,
  registerWithEmail,
} from "../auth-service";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with email and updates displayName", async () => {
    const user = {
      email: "alex@example.com",
      displayName: null,
      photoURL: null,
    };

    createUserWithEmailAndPasswordMock.mockResolvedValue({
      user,
    });

    updateProfileMock.mockResolvedValue(undefined);

    const result = await registerWithEmail(
      "alex@example.com",
      "Abc123!",
      "Alex99",
    );

    expect(createUserWithEmailAndPasswordMock).toHaveBeenCalledWith(
      expect.anything(),
      "alex@example.com",
      "Abc123!",
    );

    expect(updateProfileMock).toHaveBeenCalledWith(user, {
      displayName: "Alex99",
    });

    expect(result).toEqual({
      email: "alex@example.com",
      displayName: "Alex99",
      avatarUrl: null,
    });
  });

  it("logs in with email and password", async () => {
    signInWithEmailAndPasswordMock.mockResolvedValue({
      user: {
        email: "alex@example.com",
        displayName: "Alex99",
        photoURL: null,
      },
    });

    const result = await loginWithEmail("alex@example.com", "Abc123!");

    expect(result).toEqual({
      email: "alex@example.com",
      displayName: "Alex99",
      avatarUrl: null,
    });
  });

  it("logs in with Google", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: {
        email: "google@example.com",
        displayName: "Google User",
        photoURL: "https://example.com/avatar.jpg",
      },
    });

    const result = await loginWithGoogle();

    expect(signInWithPopupMock).toHaveBeenCalledOnce();

    expect(result).toEqual({
      email: "google@example.com",
      displayName: "Google User",
      avatarUrl: "https://example.com/avatar.jpg",
    });
  });

  it("falls back to an empty email when Firebase user email is null", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: {
        email: null,
        displayName: null,
        photoURL: null,
      },
    });

    const result = await loginWithGoogle();

    expect(result.email).toBe("");
  });

  it("signs out from Firebase", async () => {
    signOutMock.mockResolvedValue(undefined);

    await logoutFromFirebase();

    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("propagates Firebase authentication errors", async () => {
    const error = new Error("Invalid credentials");

    signInWithEmailAndPasswordMock.mockRejectedValue(error);

    await expect(
      loginWithEmail("alex@example.com", "wrong-password"),
    ).rejects.toBe(error);
  });
});
