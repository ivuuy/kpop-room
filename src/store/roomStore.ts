import { create } from "zustand";
import { STARTER_ITEMS, createDefaultRoom, STORAGE_KEY } from "../constants";
import type { CameraPreset, CustomItem, PlacedItem, RoomState, RoomTheme, Vec3, ZoneId } from "../types";
import { createId } from "../utils/id";
import { parseSharedRoom } from "../utils/share";

type DraftPlacement = {
  customItemId: string;
  zone: ZoneId;
};

type RoomStore = {
  room: RoomState;
  sharedRoom: RoomState | null;
  isReadOnlyPreview: boolean;
  selectedItemId: string | null;
  activeCustomItemId: string | null;
  draftPlacement: DraftPlacement | null;
  history: RoomState[];
  future: RoomState[];
  setTheme: (theme: RoomTheme) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSelectedItem: (id: string | null) => void;
  setActiveCustomItem: (id: string | null) => void;
  setDraftPlacement: (draft: DraftPlacement | null) => void;
  addCustomItem: (item: CustomItem) => void;
  placeItem: (customItemId: string, zone: ZoneId, position: Vec3, rotation?: Vec3, scale?: number) => void;
  moveItem: (id: string, position: Vec3, zone?: ZoneId) => void;
  rotateSelected: (amount: number) => void;
  scaleSelected: (amount: number) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  resetRoom: () => void;
  saveNow: () => void;
  undo: () => void;
  redo: () => void;
  editSharedCopy: () => void;
  dismissSharedPreview: () => void;
};

const withUpdatedAt = (room: RoomState): RoomState => ({
  ...room,
  updatedAt: new Date().toISOString(),
});

const normalizeRoomCopy = (room: RoomState): RoomState => {
  const starterById = new Map(STARTER_ITEMS.map((item) => [item.id, item]));
  const existingIds = new Set(room.customItems.map((item) => item.id));
  const missingStarters = STARTER_ITEMS.filter((item) => !existingIds.has(item.id));
  return {
    ...room,
    customItems: [
      ...room.customItems.map((item) => {
        const starter = starterById.get(item.id);
        return starter ? starter : item;
      }),
      ...missingStarters,
    ],
  };
};

const loadInitialRoom = () => {
  const sharedRoom = parseSharedRoom();
  if (sharedRoom) {
    return {
      room: createDefaultRoom(),
      sharedRoom,
      isReadOnlyPreview: true,
    };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as RoomState;
      if (parsed.version === 1 && Array.isArray(parsed.customItems)) {
        const normalized = normalizeRoomCopy(parsed);
        persistRoom(normalized);
        return {
          room: normalized,
          sharedRoom: null,
          isReadOnlyPreview: false,
        };
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    room: createDefaultRoom(),
    sharedRoom: null,
    isReadOnlyPreview: false,
  };
};

const persistRoom = (room: RoomState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
};

const commit = (
  set: (partial: Partial<RoomStore> | ((state: RoomStore) => Partial<RoomStore>)) => void,
  updater: (room: RoomState) => RoomState,
) => {
  set((state) => {
    if (state.isReadOnlyPreview) return {};
    const nextRoom = withUpdatedAt(updater(state.room));
    persistRoom(nextRoom);
    return {
      room: nextRoom,
      history: [...state.history.slice(-39), state.room],
      future: [],
    };
  });
};

const initial = loadInitialRoom();

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...initial,
  selectedItemId: null,
  activeCustomItemId: initial.room.customItems[0]?.id ?? null,
  draftPlacement: null,
  history: [],
  future: [],
  setTheme: (theme) => commit(set, (room) => ({ ...room, roomTheme: theme })),
  setCameraPreset: (preset) => commit(set, (room) => ({ ...room, cameraPreset: preset })),
  setSelectedItem: (id) => set({ selectedItemId: id }),
  setActiveCustomItem: (id) => set({ activeCustomItemId: id }),
  setDraftPlacement: (draft) => set({ draftPlacement: draft }),
  addCustomItem: (item) =>
    commit(set, (room) => ({
      ...room,
      customItems: [...room.customItems, item],
    })),
  placeItem: (customItemId, zone, position, rotation = [0, 0, 0], scale = 1) => {
    const id = createId("placed");
    commit(set, (room) => ({
      ...room,
      placedItems: [
        ...room.placedItems,
        {
          id,
          customItemId,
          zone,
          position,
          rotation,
          scale,
        },
      ],
    }));
    set({ selectedItemId: id, draftPlacement: null });
  },
  moveItem: (id, position, zone) =>
    set((state) => {
      if (state.isReadOnlyPreview) return {};
      const nextRoom = withUpdatedAt({
        ...state.room,
        placedItems: state.room.placedItems.map((item) =>
          item.id === id ? { ...item, position, zone: zone ?? item.zone } : item,
        ),
      });
      persistRoom(nextRoom);
      return { room: nextRoom };
    }),
  rotateSelected: (amount) => {
    const selectedItemId = get().selectedItemId;
    if (!selectedItemId) return;
    commit(set, (room) => ({
      ...room,
      placedItems: room.placedItems.map((item) =>
        item.id === selectedItemId
          ? { ...item, rotation: [item.rotation[0], item.rotation[1] + amount, item.rotation[2]] }
          : item,
      ),
    }));
  },
  scaleSelected: (amount) => {
    const selectedItemId = get().selectedItemId;
    if (!selectedItemId) return;
    commit(set, (room) => ({
      ...room,
      placedItems: room.placedItems.map((item) =>
        item.id === selectedItemId
          ? { ...item, scale: Math.min(1.8, Math.max(0.45, Number((item.scale + amount).toFixed(2)))) }
          : item,
      ),
    }));
  },
  duplicateSelected: () => {
    const selectedItemId = get().selectedItemId;
    const item = get().room.placedItems.find((placed) => placed.id === selectedItemId);
    if (!item) return;
    const duplicate: PlacedItem = {
      ...item,
      id: createId("placed"),
      position: [item.position[0] + 0.28, item.position[1], item.position[2] + 0.08],
    };
    commit(set, (room) => ({
      ...room,
      placedItems: [...room.placedItems, duplicate],
    }));
    set({ selectedItemId: duplicate.id });
  },
  deleteSelected: () => {
    const selectedItemId = get().selectedItemId;
    if (!selectedItemId) return;
    commit(set, (room) => ({
      ...room,
      placedItems: room.placedItems.filter((item) => item.id !== selectedItemId),
    }));
    set({ selectedItemId: null });
  },
  resetRoom: () => {
    const nextRoom = createDefaultRoom();
    persistRoom(nextRoom);
    set((state) => ({
      room: nextRoom,
      selectedItemId: null,
      activeCustomItemId: nextRoom.customItems[0]?.id ?? null,
      history: [...state.history.slice(-39), state.room],
      future: [],
      isReadOnlyPreview: false,
      sharedRoom: null,
    }));
  },
  saveNow: () => {
    persistRoom(get().room);
  },
  undo: () =>
    set((state) => {
      const previous = state.history[state.history.length - 1];
      if (!previous || state.isReadOnlyPreview) return {};
      persistRoom(previous);
      return {
        room: previous,
        history: state.history.slice(0, -1),
        future: [state.room, ...state.future],
        selectedItemId: null,
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next || state.isReadOnlyPreview) return {};
      persistRoom(next);
      return {
        room: next,
        history: [...state.history, state.room],
        future: state.future.slice(1),
        selectedItemId: null,
      };
    }),
  editSharedCopy: () => {
    const sharedRoom = get().sharedRoom;
    if (!sharedRoom) return;
    const nextRoom = withUpdatedAt(sharedRoom);
    persistRoom(nextRoom);
    window.history.replaceState(null, "", window.location.pathname);
    set({
      room: nextRoom,
      sharedRoom: null,
      isReadOnlyPreview: false,
      activeCustomItemId: nextRoom.customItems[0]?.id ?? null,
      selectedItemId: null,
      history: [],
      future: [],
    });
  },
  dismissSharedPreview: () => {
    window.history.replaceState(null, "", window.location.pathname);
    set({ sharedRoom: null, isReadOnlyPreview: false });
  },
}));
