export const CONFERENCE_ORIGIN = "https://meet.ffmuc.net";

export function conferenceRoomName(room: string) {
  return `NovalimCIE_${room.trim()}`;
}

export function conferenceMeetingUrl(room: string, audioOnly: boolean, displayName: string) {
  const settings = [
    `config.startWithVideoMuted=${audioOnly}`,
    "config.prejoinPageEnabled=true",
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName || "Membre Novalim"))}`,
  ].join("&");
  return `${CONFERENCE_ORIGIN}/${encodeURIComponent(conferenceRoomName(room))}#${settings}`;
}

export function conferenceInvitationUrl(origin: string, room: string) {
  return `${origin}/conference?room=${encodeURIComponent(room)}`;
}