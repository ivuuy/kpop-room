import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Camera,
  Copy,
  DownloadSimple,
  FloppyDisk,
  LinkSimple,
  Minus,
  Plus,
  Sparkle,
  Trash,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type React from "react";
import { THEME_TOKENS, ZONE_OPTIONS } from "./constants";
import { RoomScene } from "./scene/RoomScene";
import {
  defaultPositionForZone,
  defaultRotationForPlacement,
  defaultScaleForType,
  defaultZoneForType,
  validZonesForType,
} from "./scene/zoneMath";
import { useRoomStore } from "./store/roomStore";
import { createIconCanvas } from "./texture/iconTexture";
import type { CustomItem, IconDesign, IconFrame, IconPattern, IconSymbol, ItemType, RoomTheme, ZoneId } from "./types";
import { exportCanvasImage } from "./utils/exportImage";
import { createId } from "./utils/id";
import { roomToShareUrl } from "./utils/share";

const ITEM_TYPES: Array<{ id: ItemType; label: string }> = [
  { id: "album", label: "专辑" },
  { id: "lightstick", label: "应援棒" },
  { id: "poster", label: "海报" },
  { id: "chair", label: "椅子" },
  { id: "bed", label: "床" },
  { id: "blanket", label: "被子" },
];

const SYMBOLS: IconSymbol[] = ["star", "heart", "crown", "moon", "spark", "initial"];
const PATTERNS: IconPattern[] = ["solid", "stripe", "checker", "gradient"];
const FRAMES: IconFrame[] = ["none", "thin", "rounded", "sticker"];
const SYMBOL_LABELS: Record<IconSymbol, string> = {
  star: "星星",
  heart: "爱心",
  crown: "皇冠",
  moon: "月亮",
  spark: "闪光",
  initial: "首字母",
};
const PATTERN_LABELS: Record<IconPattern, string> = {
  solid: "纯色",
  stripe: "条纹",
  checker: "棋盘",
  gradient: "渐变",
};
const FRAME_LABELS: Record<IconFrame, string> = {
  none: "无边框",
  thin: "细边框",
  rounded: "圆角框",
  sticker: "贴纸框",
};
const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  album: "专辑",
  lightstick: "应援棒",
  poster: "海报",
  chair: "椅子",
  bed: "床",
  blanket: "被子",
};
const ZONE_DISPLAY: Record<ZoneId, string> = {
  "back-wall": "海报墙",
  "side-wall": "侧墙",
  floor: "地板",
  shelf: "置物架",
  desk: "书桌",
};
const CAMERA_LABELS = {
  "angle-left": "左侧视角",
  front: "正面视角",
  "angle-right": "右侧视角",
} as const;
const PALETTES = [
  ["#ff6fae", "#ffffff", "#ffd0e5"],
  ["#92f5ff", "#ffffff", "#4b48d6"],
  ["#18b899", "#ffffff", "#ffcf5c"],
  ["#26233d", "#f8f2ff", "#caa7ff"],
  ["#ff7a59", "#fff7d6", "#6d3a9c"],
];

const emptyDesign: IconDesign = {
  palette: PALETTES[0],
  symbol: "star",
  text: "爱豆",
  pattern: "gradient",
  frame: "rounded",
};

export const App = () => {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyState, setCopyState] = useState("复制链接");

  const room = useRoomStore((state) => (state.isReadOnlyPreview && state.sharedRoom ? state.sharedRoom : state.room));
  const sharedRoom = useRoomStore((state) => state.sharedRoom);
  const isReadOnlyPreview = useRoomStore((state) => state.isReadOnlyPreview);
  const selectedItemId = useRoomStore((state) => state.selectedItemId);
  const activeCustomItemId = useRoomStore((state) => state.activeCustomItemId);
  const setTheme = useRoomStore((state) => state.setTheme);
  const setCameraPreset = useRoomStore((state) => state.setCameraPreset);
  const setActiveCustomItem = useRoomStore((state) => state.setActiveCustomItem);
  const setDraftPlacement = useRoomStore((state) => state.setDraftPlacement);
  const placeItem = useRoomStore((state) => state.placeItem);
  const rotateSelected = useRoomStore((state) => state.rotateSelected);
  const scaleSelected = useRoomStore((state) => state.scaleSelected);
  const duplicateSelected = useRoomStore((state) => state.duplicateSelected);
  const deleteSelected = useRoomStore((state) => state.deleteSelected);
  const resetRoom = useRoomStore((state) => state.resetRoom);
  const saveNow = useRoomStore((state) => state.saveNow);
  const undo = useRoomStore((state) => state.undo);
  const redo = useRoomStore((state) => state.redo);
  const editSharedCopy = useRoomStore((state) => state.editSharedCopy);
  const dismissSharedPreview = useRoomStore((state) => state.dismissSharedPreview);
  const history = useRoomStore((state) => state.history);
  const future = useRoomStore((state) => state.future);

  const selectedItem = room.placedItems.find((item) => item.id === selectedItemId);
  const activeCustomItem = room.customItems.find((item) => item.id === activeCustomItemId) ?? room.customItems[0];
  const tokens = THEME_TOKENS[room.roomTheme];
  const shareUrl = useMemo(() => roomToShareUrl(room), [room]);

  const handleInventoryDragStart = (item: CustomItem) => {
    setActiveCustomItem(item.id);
    setDraftPlacement({ customItemId: item.id, zone: defaultZoneForType(item.type) });
  };

  const handleDropOnStage = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isReadOnlyPreview || !activeCustomItem) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const zone = inferDropZone(activeCustomItem.type, x, y);
    const count = room.placedItems.filter((item) => item.zone === zone).length;
    placeItem(
      activeCustomItem.id,
      zone,
      defaultPositionForZone(zone, count),
      defaultRotationForPlacement(activeCustomItem.type, zone),
      defaultScaleForType(activeCustomItem.type),
    );
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopyState("已复制");
    window.setTimeout(() => setCopyState("复制链接"), 1400);
  };

  return (
    <main className="app-shell" style={{ "--accent": tokens.accent, "--accent-deep": tokens.accentDeep } as React.CSSProperties}>
      <section className="topbar" aria-label="房间控制">
        <div className="brand-lockup">
          <span className="brand-mark">房</span>
          <div>
            <h1>追星房间</h1>
            <p>用自制图标布置你的 3D 追星小房间。</p>
          </div>
        </div>

        <div className="topbar-actions">
          <IconButton label="撤销" onClick={undo} disabled={history.length === 0 || isReadOnlyPreview}>
            <ArrowCounterClockwise size={19} weight="bold" />
          </IconButton>
          <IconButton label="重做" onClick={redo} disabled={future.length === 0 || isReadOnlyPreview}>
            <ArrowClockwise size={19} weight="bold" />
          </IconButton>
          <IconButton label="保存" onClick={saveNow} disabled={isReadOnlyPreview}>
            <FloppyDisk size={19} weight="bold" />
          </IconButton>
          <button className="text-button" onClick={() => setShareOpen(true)}>
            <LinkSimple size={18} weight="bold" />
            分享
          </button>
        </div>
      </section>

      {isReadOnlyPreview && sharedRoom && (
        <motion.div
          className="share-preview-banner"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>你正在查看别人分享的房间。</span>
          <button onClick={editSharedCopy}>编辑副本</button>
          <button className="ghost-link" onClick={dismissSharedPreview}>保留我的房间</button>
        </motion.div>
      )}

      <section className="workspace">
        <aside className="side-panel left-panel" aria-label="物品栏">
          <div className="panel-heading">
            <div>
              <h2>物品栏</h2>
              <p>{room.customItems.length} 个自定义物品</p>
            </div>
            <button className="icon-text-button" onClick={() => setEditorOpen(true)} disabled={isReadOnlyPreview}>
              <Plus size={17} weight="bold" />
              新建
            </button>
          </div>

          <div className="inventory-list">
            {room.customItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                active={item.id === activeCustomItemId}
                disabled={isReadOnlyPreview}
                onSelect={() => {
                  setActiveCustomItem(item.id);
                  setDraftPlacement({ customItemId: item.id, zone: defaultZoneForType(item.type) });
                }}
                onDragStart={() => handleInventoryDragStart(item)}
              />
            ))}
          </div>
        </aside>

        <section
          className="stage-wrap"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropOnStage}
          aria-label="3D 房间编辑器"
        >
          <RoomScene canvasRef={(canvas) => (canvasRef.current = canvas)} />
          <div className="stage-hint">
            {isReadOnlyPreview
              ? "分享预览模式"
              : activeCustomItem
                ? `点击房间表面，放置「${activeCustomItem.name}」。`
                : "先选择一个物品开始布置。"}
          </div>
        </section>

        <aside className="side-panel right-panel" aria-label="房间设置">
          <div className="panel-heading">
            <div>
              <h2>房间</h2>
              <p>主题、视角和已选物品</p>
            </div>
          </div>

          <ControlGroup label="主题">
            <div className="segmented themes">
              {(Object.keys(THEME_TOKENS) as RoomTheme[]).map((theme) => (
                <button
                  key={theme}
                  className={room.roomTheme === theme ? "active" : ""}
                  onClick={() => setTheme(theme)}
                  disabled={isReadOnlyPreview}
                >
                  <span style={{ background: THEME_TOKENS[theme].accent }} />
                  {THEME_TOKENS[theme].name}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="视角">
            <div className="segmented compact">
              {(["angle-left", "front", "angle-right"] as const).map((preset) => (
                <button
                  key={preset}
                  className={room.cameraPreset === preset ? "active" : ""}
                  onClick={() => setCameraPreset(preset)}
                >
                  <Camera size={16} weight="bold" />
                  {CAMERA_LABELS[preset]}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="可放置区域">
            <div className="zone-grid">
              {ZONE_OPTIONS.map((zone) => (
                <button
                  key={zone}
                  onClick={() => activeCustomItem && setDraftPlacement({ customItemId: activeCustomItem.id, zone })}
                  disabled={!activeCustomItem || isReadOnlyPreview || !validZonesForType(activeCustomItem.type).includes(zone)}
                >
                  {ZONE_DISPLAY[zone]}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="已选物品">
            <div className="selected-panel">
              {selectedItem ? (
                <>
                  <div className="selected-meta">
                    <strong>{ZONE_DISPLAY[selectedItem.zone]}</strong>
                    <span>缩放 {selectedItem.scale.toFixed(2)}</span>
                  </div>
                  <div className="control-row">
                    <IconButton label="向左旋转" onClick={() => rotateSelected(-0.22)} disabled={isReadOnlyPreview}>
                      <ArrowCounterClockwise size={18} weight="bold" />
                    </IconButton>
                    <IconButton label="向右旋转" onClick={() => rotateSelected(0.22)} disabled={isReadOnlyPreview}>
                      <ArrowClockwise size={18} weight="bold" />
                    </IconButton>
                    <IconButton label="缩小" onClick={() => scaleSelected(-0.08)} disabled={isReadOnlyPreview}>
                      <Minus size={18} weight="bold" />
                    </IconButton>
                    <IconButton label="放大" onClick={() => scaleSelected(0.08)} disabled={isReadOnlyPreview}>
                      <Plus size={18} weight="bold" />
                    </IconButton>
                  </div>
                  <div className="control-row">
                    <button className="icon-text-button" onClick={duplicateSelected} disabled={isReadOnlyPreview}>
                      <Copy size={17} weight="bold" />
                      复制
                    </button>
                    <button className="danger-button" onClick={deleteSelected} disabled={isReadOnlyPreview}>
                      <Trash size={17} weight="bold" />
                      删除
                    </button>
                  </div>
                </>
              ) : (
                <p className="quiet-copy">选择已摆放的物品后，可以旋转、缩放、复制或删除。</p>
              )}
            </div>
          </ControlGroup>

          <div className="panel-footer">
            <button className="icon-text-button" onClick={() => exportCanvasImage(canvasRef.current)}>
              <DownloadSimple size={17} weight="bold" />
              导出图片
            </button>
            <button className="danger-button" onClick={resetRoom} disabled={isReadOnlyPreview}>
              重置
            </button>
          </div>
        </aside>
      </section>

      <AnimatePresence>
        {editorOpen && <IconEditorModal onClose={() => setEditorOpen(false)} />}
        {shareOpen && (
          <ShareModal
            onClose={() => setShareOpen(false)}
            onExport={() => exportCanvasImage(canvasRef.current)}
            onCopyLink={handleCopyLink}
            shareUrl={shareUrl}
            copyState={copyState}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

const inferDropZone = (type: ItemType, x: number, y: number): ZoneId => {
  const validZones = validZonesForType(type);
  if (type === "poster") return x > 0.7 ? "side-wall" : "back-wall";
  if (y < 0.42 && validZones.includes("shelf")) return "shelf";
  if (x < 0.42 && y < 0.68 && validZones.includes("desk")) return "desk";
  return validZones.includes("floor") ? "floor" : validZones[0];
};

const IconButton = ({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button className="icon-button" type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
    {children}
  </button>
);

const ControlGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="control-group">
    <h3>{label}</h3>
    {children}
  </div>
);

const InventoryCard = ({
  item,
  active,
  disabled,
  onSelect,
  onDragStart,
}: {
  item: CustomItem;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  onDragStart: () => void;
}) => (
  <button
    className={`inventory-card ${active ? "active" : ""}`}
    type="button"
    onClick={onSelect}
    draggable={!disabled}
    onDragStart={onDragStart}
    disabled={disabled}
  >
    <IconPreview design={item.design} />
    <span>
      <strong>{item.name}</strong>
      <small>{ITEM_TYPE_LABELS[item.type]}</small>
    </span>
  </button>
);

const IconPreview = ({ design }: { design: IconDesign }) => {
  const src = useMemo(() => createIconCanvas(design, 180).toDataURL("image/png"), [design]);
  return <img src={src} alt="" />;
};

const IconEditorModal = ({ onClose }: { onClose: () => void }) => {
  const addCustomItem = useRoomStore((state) => state.addCustomItem);
  const setActiveCustomItem = useRoomStore((state) => state.setActiveCustomItem);
  const setDraftPlacement = useRoomStore((state) => state.setDraftPlacement);
  const [name, setName] = useState("新物品");
  const [type, setType] = useState<ItemType>("album");
  const [design, setDesign] = useState<IconDesign>(emptyDesign);

  const createItem = () => {
    const item: CustomItem = {
      id: createId("custom"),
      type,
      name: name.trim() || "新物品",
      design,
    };
    addCustomItem(item);
    setActiveCustomItem(item.id);
    setDraftPlacement({ customItemId: item.id, zone: defaultZoneForType(item.type) });
    onClose();
  };

  return (
    <Modal title="创建自定义图标" onClose={onClose}>
      <div className="editor-grid">
        <div className="editor-preview">
          <IconPreview design={design} />
          <p>不需要真实照片。房间会使用生成的追星图标。</p>
        </div>
        <div className="editor-fields">
          <label>
            名称
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={18} />
          </label>

          <ControlGroup label="类型">
            <div className="segmented compact">
              {ITEM_TYPES.map((itemType) => (
                <button
                  key={itemType.id}
                  className={type === itemType.id ? "active" : ""}
                  onClick={() => setType(itemType.id)}
                >
                  {itemType.label}
                </button>
              ))}
            </div>
          </ControlGroup>

          <label>
            短文字
            <input
              value={design.text ?? ""}
              onChange={(event) => setDesign({ ...design, text: event.target.value.slice(0, 8) })}
              maxLength={8}
            />
          </label>

          <ControlGroup label="配色">
            <div className="palette-grid">
              {PALETTES.map((palette) => (
                <button
                  key={palette.join("-")}
                  className={palette.join("") === design.palette.join("") ? "active" : ""}
                  onClick={() => setDesign({ ...design, palette })}
                  aria-label={`配色 ${palette.join(" ")}`}
                >
                  {palette.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="符号">
            <div className="chip-grid">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  className={design.symbol === symbol ? "active" : ""}
                  onClick={() => setDesign({ ...design, symbol })}
                >
                  {SYMBOL_LABELS[symbol]}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="图案">
            <div className="chip-grid">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern}
                  className={design.pattern === pattern ? "active" : ""}
                  onClick={() => setDesign({ ...design, pattern })}
                >
                  {PATTERN_LABELS[pattern]}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="边框">
            <div className="chip-grid">
              {FRAMES.map((frame) => (
                <button
                  key={frame}
                  className={design.frame === frame ? "active" : ""}
                  onClick={() => setDesign({ ...design, frame })}
                >
                  {FRAME_LABELS[frame]}
                </button>
              ))}
            </div>
          </ControlGroup>
        </div>
      </div>
      <div className="modal-actions">
        <button className="ghost-button" onClick={onClose}>取消</button>
        <button className="primary-button" onClick={createItem}>
          <Sparkle size={18} weight="bold" />
          创建
        </button>
      </div>
    </Modal>
  );
};

const ShareModal = ({
  onClose,
  onExport,
  onCopyLink,
  shareUrl,
  copyState,
}: {
  onClose: () => void;
  onExport: () => void;
  onCopyLink: () => void;
  shareUrl: string;
  copyState: string;
}) => (
  <Modal title="分享房间" onClose={onClose}>
    <div className="share-grid">
      <button className="share-card" onClick={onExport}>
        <DownloadSimple size={24} weight="bold" />
        <strong>导出图片</strong>
        <span>把当前视角保存成 PNG 图片。</span>
      </button>
      <button className="share-card" onClick={onCopyLink}>
        <LinkSimple size={24} weight="bold" />
        <strong>{copyState}</strong>
        <span>复制一个可以打开当前房间的链接。</span>
      </button>
    </div>
    <label className="share-url">
      分享链接
      <textarea readOnly value={shareUrl} />
    </label>
  </Modal>
);

const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="modal-backdrop"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <IconButton label="关闭" onClick={onClose}>
            <X size={18} weight="bold" />
          </IconButton>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};
