import type { CustomItem, RoomState, RoomTheme, ThemeTokens, ZoneId } from "./types";

export const STORAGE_KEY = "k-pop-room-state-v1";

export const THEME_TOKENS: Record<RoomTheme, ThemeTokens> = {
  "soft-pink": {
    name: "粉色梦境",
    surface: "#fff7fb",
    room: "#fff1f7",
    wall: "#ffd9e9",
    wallSide: "#ffc3dc",
    floor: "#f7d8b6",
    shelf: "#f6adc9",
    rug: "#ff8db9",
    accent: "#ff5f9f",
    accentDeep: "#ba2f6f",
    text: "#311724",
    muted: "#7f5265",
  },
  "midnight-stage": {
    name: "午夜舞台",
    surface: "#11101d",
    room: "#20172d",
    wall: "#31224a",
    wallSide: "#241a3b",
    floor: "#181827",
    shelf: "#6450d9",
    rug: "#4cf0d4",
    accent: "#9d7cff",
    accentDeep: "#5f43ca",
    text: "#f6f2ff",
    muted: "#b8aee0",
  },
  "mint-pop": {
    name: "薄荷汽水",
    surface: "#f4fff9",
    room: "#eafdf2",
    wall: "#bef7db",
    wallSide: "#a8ecca",
    floor: "#dcead0",
    shelf: "#78d9c4",
    rug: "#ffcf5c",
    accent: "#18b899",
    accentDeep: "#087c68",
    text: "#12342f",
    muted: "#50746d",
  },
};

export const ZONE_LABELS: Record<ZoneId, string> = {
  "back-wall": "海报墙",
  "side-wall": "侧墙",
  floor: "地板",
  shelf: "置物架",
  desk: "书桌",
};

export const ZONE_OPTIONS: ZoneId[] = ["back-wall", "side-wall", "floor", "shelf", "desk"];

export const STARTER_ITEMS: CustomItem[] = [
  {
    id: "starter-album",
    type: "album",
    name: "梦幻专辑",
    design: {
      palette: ["#ff6fae", "#ffffff", "#ffd0e5"],
      symbol: "star",
      text: "爱豆",
      pattern: "gradient",
      frame: "rounded",
    },
  },
  {
    id: "starter-lightstick",
    type: "lightstick",
    name: "星光应援棒",
    design: {
      palette: ["#92f5ff", "#ffffff", "#4b48d6"],
      symbol: "spark",
      text: "",
      pattern: "solid",
      frame: "thin",
    },
  },
  {
    id: "starter-poster",
    type: "poster",
    name: "月亮海报",
    design: {
      palette: ["#2f245f", "#f8f2ff", "#caa7ff"],
      symbol: "moon",
      text: "房间",
      pattern: "stripe",
      frame: "sticker",
    },
  },
  {
    id: "starter-chair",
    type: "chair",
    name: "奶油椅子",
    design: {
      palette: ["#ffd0e5", "#ffffff", "#ff6fae"],
      symbol: "heart",
      text: "",
      pattern: "solid",
      frame: "rounded",
    },
  },
  {
    id: "starter-bed",
    type: "bed",
    name: "小窝床",
    design: {
      palette: ["#f7d8b6", "#ffffff", "#ff8db9"],
      symbol: "moon",
      text: "",
      pattern: "gradient",
      frame: "rounded",
    },
  },
  {
    id: "starter-blanket",
    type: "blanket",
    name: "软软被子",
    design: {
      palette: ["#caa7ff", "#f8f2ff", "#92f5ff"],
      symbol: "spark",
      text: "",
      pattern: "stripe",
      frame: "sticker",
    },
  },
];

export const createDefaultRoom = (): RoomState => ({
  version: 1,
  roomTheme: "soft-pink",
  cameraPreset: "angle-left",
  placedItems: [
    {
      id: "placed-poster-1",
      customItemId: "starter-poster",
      zone: "back-wall",
      position: [-1.8, 2.25, -2.96],
      rotation: [0, 0, 0],
      scale: 1,
    },
    {
      id: "placed-album-1",
      customItemId: "starter-album",
      zone: "shelf",
      position: [0.55, 1.42, -2.58],
      rotation: [0, -0.08, 0],
      scale: 0.85,
    },
    {
      id: "placed-lightstick-1",
      customItemId: "starter-lightstick",
      zone: "desk",
      position: [-1.25, 0.88, -2.06],
      rotation: [0, 0, -0.15],
      scale: 0.9,
    },
    {
      id: "placed-bed-1",
      customItemId: "starter-bed",
      zone: "floor",
      position: [1.2, 0.04, -0.2],
      rotation: [0, -0.18, 0],
      scale: 0.88,
    },
  ],
  customItems: STARTER_ITEMS,
  updatedAt: new Date().toISOString(),
});
