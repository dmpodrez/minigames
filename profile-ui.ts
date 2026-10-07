import type { AppSession } from "./app-session";

interface ProfileUiOptions {
  onLogout: () => void | Promise<void>;
}

export interface ProfileUi {
  render: (session: AppSession | null) => void;
}

const ALPHANUMERIC_PATTERN = /[\p{L}\p{N}]/u;

function firstAlphanumeric(value: string): string {
  return (
    Array.from(value).find((character) =>
      ALPHANUMERIC_PATTERN.test(character),
    ) ?? ""
  );
}

export function getProfileInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  const initials = words
    .slice(0, 2)
    .map(firstAlphanumeric)
    .filter(Boolean)
    .map((character) => character.toUpperCase())
    .join("");

  return initials || "P";
}

function createInitialsAvatar(session: AppSession): HTMLSpanElement {
  const avatar = document.createElement("span");

  avatar.className = "auth-profile__initials";
  avatar.textContent = getProfileInitials(session.displayName);
  avatar.setAttribute("aria-hidden", "true");

  return avatar;
}

function createAvatar(session: AppSession): HTMLElement {
  const fallback = createInitialsAvatar(session);

  if (!session.avatarUrl) {
    return fallback;
  }

  const image = document.createElement("img");

  image.className = "auth-profile__avatar-image";
  image.src = session.avatarUrl;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");

  image.addEventListener(
    "error",
    () => {
      image.replaceWith(fallback);
    },
    { once: true },
  );

  return image;
}

function createProfile(
  session: AppSession,
  variant: "desktop" | "mobile-header" | "mobile-menu",
  onLogout: () => void | Promise<void>,
): HTMLElement {
  const profile = document.createElement("div");

  profile.className = `auth-profile auth-profile--${variant}`;

  const avatar = document.createElement("span");
  avatar.className = "auth-profile__avatar";
  avatar.append(createAvatar(session));

  profile.append(avatar);

  if (variant !== "mobile-header") {
    const name = document.createElement("span");

    name.className = "auth-profile__name";
    name.textContent = session.displayName;

    const logoutButton = document.createElement("button");

    logoutButton.className = "auth-profile__logout";
    logoutButton.type = "button";
    logoutButton.textContent = "Log Out";

    logoutButton.addEventListener("click", () => {
      void onLogout();
    });

    profile.append(name, logoutButton);
  }

  return profile;
}

export function setupProfileUi(options: ProfileUiOptions): ProfileUi {
  const guestControls = document.querySelectorAll<HTMLElement>(".auth-open");

  const desktopContainer = document.querySelector<HTMLElement>(".nav");

  const mobileHeaderContainer = document.querySelector<HTMLElement>(
    ".header-mobile-actions",
  );

  const mobileMenuContainer = document.querySelector<HTMLElement>(
    ".mobile-menu-actions",
  );

  function removeProfiles(): void {
    document
      .querySelectorAll(".auth-profile")
      .forEach((profile) => profile.remove());
  }

  function render(session: AppSession | null): void {
    removeProfiles();

    guestControls.forEach((control) => {
      control.hidden = session !== null;
    });

    if (!session) {
      return;
    }

    desktopContainer?.append(
      createProfile(session, "desktop", options.onLogout),
    );

    if (mobileHeaderContainer) {
      const burger = mobileHeaderContainer.querySelector(".burger-button");

      const profile = createProfile(session, "mobile-header", options.onLogout);

      mobileHeaderContainer.insertBefore(profile, burger);
    }

    mobileMenuContainer?.append(
      createProfile(session, "mobile-menu", options.onLogout),
    );
  }

  return {
    render,
  };
}
