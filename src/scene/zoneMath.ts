import type { ItemType, Vec3, ZoneId } from "../types";

export const validZonesForType = (type: ItemType): ZoneId[] => {
  if (type === "poster") return ["back-wall", "side-wall"];
  if (type === "lightstick") return ["floor", "shelf", "desk"];
  if (type === "chair" || type === "bed" || type === "blanket") return ["floor"];
  return ["floor", "shelf", "desk"];
};

export const defaultZoneForType = (type: ItemType): ZoneId => {
  if (type === "poster") return "back-wall";
  if (type === "lightstick") return "desk";
  if (type === "chair" || type === "bed" || type === "blanket") return "floor";
  return "shelf";
};

export const rotationForZone = (zone: ZoneId): Vec3 => {
  if (zone === "back-wall") return [0, 0, 0];
  if (zone === "side-wall") return [0, -Math.PI / 2, 0];
  if (zone === "floor") return [-Math.PI / 2, 0, 0];
  return [0, 0, 0];
};

export const defaultRotationForPlacement = (type: ItemType, zone: ZoneId): Vec3 => {
  if (zone === "back-wall" || zone === "side-wall") return rotationForZone(zone);
  if (type === "poster") return rotationForZone(zone);
  return [0, 0, 0];
};

export const defaultScaleForType = (type: ItemType) => {
  if (type === "poster") return 1;
  if (type === "bed") return 0.9;
  if (type === "chair") return 0.88;
  if (type === "blanket") return 0.95;
  return 0.9;
};

export const defaultPositionForZone = (zone: ZoneId, index = 0): Vec3 => {
  const offset = (index % 5) * 0.28;
  if (zone === "back-wall") return [-1.4 + offset, 2.15, -2.96];
  if (zone === "side-wall") return [2.96, 2.0, -1.35 + offset];
  if (zone === "floor") return [-1.1 + offset, 0.04, -0.4 + offset * 0.1];
  if (zone === "shelf") return [0.25 + offset * 0.4, 1.42, -2.58];
  return [-1.18 + offset * 0.25, 0.88, -2.04];
};

export const clampPositionToZone = (zone: ZoneId, position: Vec3): Vec3 => {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  if (zone === "back-wall") return [clamp(position[0], -2.35, 2.35), clamp(position[1], 0.95, 3.2), -2.96];
  if (zone === "side-wall") return [2.96, clamp(position[1], 0.95, 3.05), clamp(position[2], -2.25, 1.45)];
  if (zone === "floor") return [clamp(position[0], -2.35, 2.2), 0.04, clamp(position[2], -2.15, 1.65)];
  if (zone === "shelf") return [clamp(position[0], -0.1, 2.08), 1.42, -2.58];
  return [clamp(position[0], -1.75, -0.25), 0.88, clamp(position[2], -2.18, -1.55)];
};
