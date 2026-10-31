export type RoomTheme = "soft-pink" | "midnight-stage" | "mint-pop";
export type CameraPreset = "front" | "angle-left" | "angle-right";
export type ZoneId = "back-wall" | "side-wall" | "floor" | "shelf" | "desk";
export type ItemType = "album" | "lightstick" | "poster" | "chair" | "bed" | "blanket";
export type IconSymbol = "star" | "heart" | "crown" | "moon" | "spark" | "initial";
export type IconPattern = "solid" | "stripe" | "checker" | "gradient";
export type IconFrame = "none" | "thin" | "rounded" | "sticker";

export type Vec3 = [number, number, number];

export type RoomState = {
  version: 1;
  roomTheme: RoomTheme;
  cameraPreset: CameraPreset;
  placedItems: PlacedItem[];
  customItems: CustomItem[];
  updatedAt: string;
};

export type PlacedItem = {
  id: string;
  customItemId: string;
  zone: ZoneId;
  position: Vec3;
  rotation: Vec3;
  scale: number;
};

export type CustomItem = {
  id: string;
  type: ItemType;
  name: string;
  design: IconDesign;
};

export type IconDesign = {
  palette: string[];
  symbol: IconSymbol;
  text?: string;
  pattern: IconPattern;
  frame: IconFrame;
};

export type ThemeTokens = {
  name: string;
  surface: string;
  room: string;
  wall: string;
  wallSide: string;
  floor: string;
  shelf: string;
  rug: string;
  accent: string;
  accentDeep: string;
  text: string;
  muted: string;
};
