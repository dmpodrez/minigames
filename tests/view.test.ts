import { beforeEach, describe, expect, it } from "vitest";

import { renderApp } from "../view";

describe("application view", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("renders the main application structure", () => {
    renderApp();

    expect(document.querySelector(".header")).not.toBeNull();

    expect(document.querySelector("#home-page")).not.toBeNull();

    expect(document.querySelector("#library-page")).not.toBeNull();

    expect(document.querySelector("#not-found-page")).not.toBeNull();

    expect(document.querySelector(".footer")).not.toBeNull();
  });

  it("renders authentication dialog", () => {
    renderApp();

    const dialog = document.querySelector<HTMLDialogElement>(".auth-dialog");

    expect(dialog).not.toBeNull();

    expect(dialog?.querySelector('[data-auth-panel="login"]')).not.toBeNull();

    expect(
      dialog?.querySelector('[data-auth-panel="register"]'),
    ).not.toBeNull();
  });

  it("renders game details dialog and interactions", () => {
    renderApp();

    const dialog = document.querySelector<HTMLDialogElement>(
      ".game-details-dialog",
    );

    expect(dialog).not.toBeNull();

    expect(dialog?.querySelector(".game-favorite-button")).not.toBeNull();

    expect(dialog?.querySelector(".comment-form")).not.toBeNull();

    expect(dialog?.querySelector("#game-comment")).not.toBeNull();

    expect(dialog?.querySelector(".comment-list")).not.toBeNull();
  });

  it("renders library controls used by API state", () => {
    renderApp();

    expect(document.querySelector(".library-chips")).not.toBeNull();

    expect(document.querySelector(".library-sort-trigger")).not.toBeNull();

    expect(document.querySelector(".library-pagination")).not.toBeNull();

    expect(document.querySelector(".library-grid")).not.toBeNull();
  });

  it("renders custom 404 page with home action", () => {
    renderApp();

    const page = document.querySelector("#not-found-page");

    expect(page?.textContent).toContain("Page Not Found");

    expect(page?.querySelector("[data-return-home]")).not.toBeNull();
  });
});
