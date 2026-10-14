import { describe, expect, it } from "vitest";
import { mapDynamicPortal } from "./portals";

describe("portails administrables", () => {
  it("conserve le lien externe configuré par l’administrateur", () => {
    const portal = mapDynamicPortal({ slug: "ccjy", title: "CCJY", subtitle: null, logo_url: null, cover_url: null, external_url: "https://ccj-yop.org", show_in_menu: false });
    expect(portal.path).toBe("https://ccj-yop.org");
    expect(portal.external).toBe(true);
    expect(portal.show_in_menu).toBe(false);
  });
  it("dirige un portail interne vers sa page dédiée", () => {
    const portal = mapDynamicPortal({ slug: "education", title: "Éducation", subtitle: null, logo_url: null, cover_url: null });
    expect(portal.path).toBe("/portail/education");
    expect(portal.external).toBe(false);
  });
});