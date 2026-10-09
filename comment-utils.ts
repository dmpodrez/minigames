export const COMMENT_MAX_LENGTH = 500;

export const AVATAR_RANDOM_TOKENS = [
  "avatar-random-1",
  "avatar-random-2",
  "avatar-random-3",
  "avatar-random-4",
  "avatar-random-5",
] as const;

export type AvatarRandomToken = (typeof AVATAR_RANDOM_TOKENS)[number];

export interface CommentValidationResult {
  valid: boolean;
  text: string;
  message: string;
}

export function validateCommentText(value: string): CommentValidationResult {
  const text = value.trim();

  if (text.length === 0) {
    return {
      valid: false,
      text,
      message: "Comment cannot be empty.",
    };
  }

  if (text.length > COMMENT_MAX_LENGTH) {
    return {
      valid: false,
      text,
      message: `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters.`,
    };
  }

  return {
    valid: true,
    text,
    message: "",
  };
}

export function getCommentInitial(authorName: string): string {
  return authorName.trim().charAt(0).toUpperCase() || "?";
}
export function resolveCommentAuthorName(
  displayName: string,
  email: string,
): string {
  const trimmedName = displayName.trim();

  if (trimmedName.length >= 2 && trimmedName.length <= 30) {
    return trimmedName;
  }

  const emailLocalPart = email.split("@")[0]?.trim() ?? "";

  if (emailLocalPart.length >= 2 && emailLocalPart.length <= 30) {
    return emailLocalPart;
  }

  return "Player";
}
export function createAvatarTokenResolver(
  random: () => number = Math.random,
): (authorName: string) => AvatarRandomToken {
  const assignments = new Map<string, AvatarRandomToken>();

  return (authorName: string) => {
    const key = authorName.trim();

    const existing = assignments.get(key);

    if (existing) {
      return existing;
    }

    const index = Math.min(
      AVATAR_RANDOM_TOKENS.length - 1,
      Math.floor(random() * AVATAR_RANDOM_TOKENS.length),
    );

    const token = AVATAR_RANDOM_TOKENS[index];

    assignments.set(key, token);

    return token;
  };
}
