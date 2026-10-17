import { describe, expect, it } from "vitest";
import { conferenceInvitationUrl, conferenceMeetingUrl } from "./conference";

describe("invitations de conférence", () => {
  it("conserve le nom de salle dans le lien partagé", () => {
    const link = conferenceInvitationUrl("https://district.example", "bureau & membres");
    expect(new URL(link).searchParams.get("room")).toBe("bureau & membres");
  });
  it("dirige tous les participants vers la même salle externe", () => {
    const url = new URL(conferenceMeetingUrl("bureau-octobre", false, "Koffi"));
    expect(url.origin).toBe("https://meet.ffmuc.net");
    expect(url.pathname).toBe("/NovalimCIE_bureau-octobre");
  });
  it("désactive la caméra au démarrage d’un appel audio", () => {
    expect(conferenceMeetingUrl("reunion", true, "Membre")).toContain("config.startWithVideoMuted=true");
    expect(conferenceMeetingUrl("reunion", false, "Membre")).toContain("config.startWithVideoMuted=false");
  });
});