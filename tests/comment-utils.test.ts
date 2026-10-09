import { describe, expect, it, vi } from "vitest";

import {
  COMMENT_MAX_LENGTH,
  createAvatarTokenResolver,
  getCommentInitial,
  validateCommentText,
  resolveCommentAuthorName,
} from "../comment-utils";

describe("comment utils", () => {
  it("trims and accepts valid comment text", () => {
    expect(validateCommentText("  Great game!  ")).toEqual({
      valid: true,
      text: "Great game!",
      message: "",
    });
  });

  it("rejects an empty comment", () => {
    expect(validateCommentText("     ")).toEqual({
      valid: false,
      text: "",
      message: "Comment cannot be empty.",
    });
  });

  it("accepts exactly 500 characters", () => {
    const text = "a".repeat(COMMENT_MAX_LENGTH);

    expect(validateCommentText(text).valid).toBe(true);
  });

  it("rejects more than 500 characters", () => {
    const text = "a".repeat(COMMENT_MAX_LENGTH + 1);

    expect(validateCommentText(text).valid).toBe(false);
  });

  it("creates uppercase comment initial", () => {
    expect(getCommentInitial("  dmitry")).toBe("D");
  });

  it("supports Unicode initials", () => {
    expect(getCommentInitial("  дмитрий")).toBe("Д");
  });

  it("uses fallback for empty username", () => {
    expect(getCommentInitial("   ")).toBe("?");
  });

  it("keeps avatar token stable for the same commenter", () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.8);

    const resolveToken = createAvatarTokenResolver(random);

    const first = resolveToken("Alex");
    const second = resolveToken("Alex");

    expect(second).toBe(first);
    expect(random).toHaveBeenCalledOnce();
  });

  it("can assign different tokens to different commenters", () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.99);

    const resolveToken = createAvatarTokenResolver(random);

    expect(resolveToken("Alex")).toBe("avatar-random-1");

    expect(resolveToken("Kate")).toBe("avatar-random-5");
  });
  it("uses valid display name for comment author", () => {
    expect(resolveCommentAuthorName("Dmitry", "dmitry@example.com")).toBe(
      "Dmitry",
    );
  });

  it("falls back to email local part for invalid display name", () => {
    expect(resolveCommentAuthorName("", "dmpodrez@example.com")).toBe(
      "dmpodrez",
    );
  });

  it("uses generic fallback when both names are invalid", () => {
    expect(resolveCommentAuthorName("", "x@example.com")).toBe("Player");
  });
});
