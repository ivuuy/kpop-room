import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { RoomState } from "../types";

const SHARE_PREFIX = "#room=";

export const roomToHash = (room: RoomState) => {
  return `${SHARE_PREFIX}${compressToEncodedURIComponent(JSON.stringify(room))}`;
};

export const roomToShareUrl = (room: RoomState) => {
  const url = new URL(window.location.href);
  url.hash = roomToHash(room).slice(1);
  return url.toString();
};

export const parseSharedRoom = (): RoomState | null => {
  const hash = window.location.hash;
  if (!hash.startsWith(SHARE_PREFIX)) return null;

  try {
    const payload = hash.slice(SHARE_PREFIX.length);
    const json = decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    const parsed = JSON.parse(json) as RoomState;
    if (parsed.version !== 1 || !Array.isArray(parsed.placedItems) || !Array.isArray(parsed.customItems)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
