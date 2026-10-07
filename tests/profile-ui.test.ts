import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProfileInitials, setupProfileUi } from "../profile-ui";

describe("profile UI", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav class="nav">
        <button class="auth-open">Log In</button>
        <button class="auth-open">Sign Up</button>
      </nav>

      <div class="header-mobile-actions">
        <button class="auth-open">Sign Up</button>
        <button class="burger-button">Menu</button>
      </div>

      <div class="mobile-menu-actions">
        <button class="auth-open">Log In</button>
        <button class="auth-open">Sign Up</button>
      </div>
    `;
  });

  it("creates initials from one word", () => {
    expect(getProfileInitials("Alex")).toBe("A");
  });

  it("creates initials from the first two words", () => {
    expect(getProfileInitials("Alex Smith")).toBe("AS");
  });

  it("supports Unicode letters", () => {
    expect(getProfileInitials("Дмитрий Подрез")).toBe("ДП");
  });

  it("uses generic initials when no alphanumeric character exists", () => {
    expect(getProfileInitials("!!! ---")).toBe("P");
  });

  it("renders authenticated profile and hides guest controls", () => {
    const profileUi = setupProfileUi({
      onLogout: vi.fn(),
    });

    profileUi.render({
      email: "alex@example.com",
      displayName: "Alex Smith",
      authenticatedAt: 1000,
    });

    const guestControls = document.querySelectorAll<HTMLElement>(".auth-open");

    guestControls.forEach((control) => {
      expect(control.hidden).toBe(true);
    });

    expect(document.querySelectorAll(".auth-profile")).toHaveLength(3);

    expect(document.querySelector(".auth-profile__name")?.textContent).toBe(
      "Alex Smith",
    );
  });

  it("restores Guest controls when session becomes null", () => {
    const profileUi = setupProfileUi({
      onLogout: vi.fn(),
    });

    profileUi.render({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1000,
    });

    profileUi.render(null);

    expect(document.querySelectorAll(".auth-profile")).toHaveLength(0);

    document.querySelectorAll<HTMLElement>(".auth-open").forEach((control) => {
      expect(control.hidden).toBe(false);
    });
  });

  it("calls logout from the profile button", () => {
    const onLogout = vi.fn();

    const profileUi = setupProfileUi({
      onLogout,
    });

    profileUi.render({
      email: "alex@example.com",
      displayName: "Alex",
      authenticatedAt: 1000,
    });

    document.querySelector<HTMLButtonElement>(".auth-profile__logout")?.click();

    expect(onLogout).toHaveBeenCalledOnce();
  });
});
