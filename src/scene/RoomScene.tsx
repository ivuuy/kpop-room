import { ContactShadows, Environment, Html, OrbitControls, OrthographicCamera, RoundedBox } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { THEME_TOKENS, ZONE_LABELS, ZONE_OPTIONS } from "../constants";
import { useRoomStore } from "../store/roomStore";
import { getIconTexture } from "../texture/iconTexture";
import type { CustomItem, PlacedItem, RoomState, ThemeTokens, Vec3, ZoneId } from "../types";
import {
  clampPositionToZone,
  defaultPositionForZone,
  defaultRotationForPlacement,
  defaultScaleForType,
  validZonesForType,
} from "./zoneMath";

type RoomSceneProps = {
  canvasRef: (canvas: HTMLCanvasElement | null) => void;
};

const CAMERA_POSITIONS = {
  front: [0, 2.2, 6.8] as Vec3,
  "angle-left": [4.6, 3.4, 5.8] as Vec3,
  "angle-right": [-4.6, 3.4, 5.8] as Vec3,
};

const SceneRoot = () => {
  const room = useRoomStore((state) => (state.isReadOnlyPreview && state.sharedRoom ? state.sharedRoom : state.room));
  const isReadOnlyPreview = useRoomStore((state) => state.isReadOnlyPreview);
  const tokens = THEME_TOKENS[room.roomTheme];
  const customItemMap = useMemo(
    () => new Map(room.customItems.map((item) => [item.id, item])),
    [room.customItems],
  );

  return (
    <>
      <color attach="background" args={[tokens.surface]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.5} castShadow />
      <OrthographicCamera
        makeDefault
        position={CAMERA_POSITIONS[room.cameraPreset]}
        zoom={92}
        near={0.1}
        far={100}
      />
      <OrbitControls
        enablePan={false}
        enableDamping
        minZoom={68}
        maxZoom={120}
        minPolarAngle={Math.PI / 4.2}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1.35, -1.15]}
      />
      <Environment preset="city" />
      <RoomShell room={room} tokens={tokens} readOnly={isReadOnlyPreview} />
      {room.placedItems.map((placed) => {
        const customItem = customItemMap.get(placed.customItemId);
        if (!customItem) return null;
        return <PlacedRoomItem key={placed.id} placed={placed} customItem={customItem} readOnly={isReadOnlyPreview} />;
      })}
      <ContactShadows position={[0, -0.01, 0]} opacity={0.18} scale={7} blur={2.5} />
    </>
  );
};

export const RoomScene = ({ canvasRef }: RoomSceneProps) => {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => canvasRef(gl.domElement)}
    >
      <Suspense fallback={null}>
        <SceneRoot />
      </Suspense>
    </Canvas>
  );
};

const RoomShell = ({ room, tokens, readOnly }: { room: RoomState; tokens: ThemeTokens; readOnly: boolean }) => {
  const draftPlacement = useRoomStore((state) => state.draftPlacement);
  const setDraftPlacement = useRoomStore((state) => state.setDraftPlacement);
  const placeItem = useRoomStore((state) => state.placeItem);
  const activeCustomItemId = useRoomStore((state) => state.activeCustomItemId);
  const customItem = room.customItems.find((item) => item.id === activeCustomItemId);

  const handleZoneClick = (zone: ZoneId, event: ThreeEvent<MouseEvent>) => {
    if (readOnly || !customItem) return;
    const validZones = validZonesForType(customItem.type);
    if (!validZones.includes(zone)) {
      setDraftPlacement({ customItemId: customItem.id, zone: validZones[0] });
      return;
    }

    const point = event.point;
    const position = clampPositionToZone(zone, [point.x, point.y, point.z]);
    placeItem(customItem.id, zone, position, defaultRotationForPlacement(customItem.type, zone), defaultScaleForType(customItem.type));
  };

  const zoneIsActive = (zone: ZoneId) => draftPlacement?.zone === zone;

  return (
    <group>
      <mesh position={[0, 1.9, -3]} receiveShadow onClick={(event) => handleZoneClick("back-wall", event)}>
        <boxGeometry args={[6, 3.8, 0.08]} />
        <meshStandardMaterial color={tokens.wall} roughness={0.75} />
      </mesh>
      <mesh position={[3, 1.9, -0.9]} rotation={[0, Math.PI / 2, 0]} receiveShadow onClick={(event) => handleZoneClick("side-wall", event)}>
        <boxGeometry args={[4.2, 3.8, 0.08]} />
        <meshStandardMaterial color={tokens.wallSide} roughness={0.76} />
      </mesh>
      <mesh position={[0, 0, -0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={(event) => handleZoneClick("floor", event)}>
        <boxGeometry args={[6, 4.2, 0.08]} />
        <meshStandardMaterial color={tokens.floor} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.035, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.18, 64]} />
        <meshStandardMaterial color={tokens.rug} roughness={0.9} />
      </mesh>
      <Shelf tokens={tokens} onClick={(event) => handleZoneClick("shelf", event)} active={zoneIsActive("shelf")} />
      <Desk tokens={tokens} onClick={(event) => handleZoneClick("desk", event)} active={zoneIsActive("desk")} />
      {ZONE_OPTIONS.map((zone) => (
        <ZoneLabel key={zone} zone={zone} tokens={tokens} visible={zoneIsActive(zone)} />
      ))}
    </group>
  );
};

const Shelf = ({
  tokens,
  onClick,
  active,
}: {
  tokens: ThemeTokens;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  active: boolean;
}) => (
  <group>
    <RoundedBox args={[2.6, 0.16, 0.44]} radius={0.06} position={[1, 1.2, -2.72]} onClick={onClick}>
      <meshStandardMaterial color={active ? tokens.accent : tokens.shelf} roughness={0.62} />
    </RoundedBox>
    <RoundedBox args={[0.14, 1.05, 0.16]} radius={0.04} position={[-0.2, 0.72, -2.72]}>
      <meshStandardMaterial color={tokens.shelf} roughness={0.65} />
    </RoundedBox>
    <RoundedBox args={[0.14, 1.05, 0.16]} radius={0.04} position={[2.18, 0.72, -2.72]}>
      <meshStandardMaterial color={tokens.shelf} roughness={0.65} />
    </RoundedBox>
  </group>
);

const Desk = ({
  tokens,
  onClick,
  active,
}: {
  tokens: ThemeTokens;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  active: boolean;
}) => (
  <group>
    <RoundedBox args={[1.9, 0.16, 0.78]} radius={0.08} position={[-1.05, 0.64, -1.9]} onClick={onClick}>
      <meshStandardMaterial color={active ? tokens.accent : "#ffffff"} roughness={0.6} />
    </RoundedBox>
    {[
      [-1.85, 0.32, -2.22],
      [-0.25, 0.32, -2.22],
      [-1.85, 0.32, -1.58],
      [-0.25, 0.32, -1.58],
    ].map((position) => (
      <RoundedBox key={position.join("-")} args={[0.12, 0.64, 0.12]} radius={0.03} position={position as Vec3}>
        <meshStandardMaterial color={tokens.accentDeep} roughness={0.72} />
      </RoundedBox>
    ))}
  </group>
);

const ZoneLabel = ({ zone, tokens, visible }: { zone: ZoneId; tokens: ThemeTokens; visible: boolean }) => {
  if (!visible) return null;
  const position = defaultPositionForZone(zone);
  return (
    <Html position={[position[0], position[1] + 0.3, position[2]]} center>
      <div className="zone-label" style={{ color: tokens.text, borderColor: tokens.accent }}>
        {ZONE_LABELS[zone]}
      </div>
    </Html>
  );
};

const PlacedRoomItem = ({
  placed,
  customItem,
  readOnly,
}: {
  placed: PlacedItem;
  customItem: CustomItem;
  readOnly: boolean;
}) => {
  const selectedItemId = useRoomStore((state) => state.selectedItemId);
  const setSelectedItem = useRoomStore((state) => state.setSelectedItem);
  const moveItem = useRoomStore((state) => state.moveItem);
  const selected = selectedItemId === placed.id;
  const texture = useMemo(() => getIconTexture(customItem.design), [customItem.design]);
  const dragPlane = useRef(new THREE.Plane());
  const select = (event: Pick<ThreeEvent<MouseEvent | PointerEvent>, "stopPropagation">) => {
    event.stopPropagation();
    if (!readOnly) setSelectedItem(placed.id);
  };

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (readOnly) return;
    select(event);
    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId);
    }
    if (placed.zone === "back-wall") dragPlane.current.set(new THREE.Vector3(0, 0, 1), 2.96);
    else if (placed.zone === "side-wall") dragPlane.current.set(new THREE.Vector3(1, 0, 0), -2.96);
    else dragPlane.current.set(new THREE.Vector3(0, 1, 0), -placed.position[1]);
  };

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (readOnly || !selected || !event.buttons) return;
    event.stopPropagation();
    const point = new THREE.Vector3();
    event.ray.intersectPlane(dragPlane.current, point);
    const next = clampPositionToZone(placed.zone, [point.x, point.y, point.z]);
    moveItem(placed.id, next);
  };

  const commonProps = {
    position: placed.position,
    rotation: placed.rotation,
    scale: placed.scale,
    onClick: select,
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      if (!readOnly && event.target instanceof Element) {
        event.target.releasePointerCapture(event.pointerId);
      }
    },
  };

  return (
    <group {...commonProps}>
      {customItem.type === "poster" && <PosterItem texture={texture} selected={selected} />}
      {customItem.type === "album" && <AlbumItem texture={texture} selected={selected} />}
      {customItem.type === "lightstick" && <LightstickItem customItem={customItem} selected={selected} />}
      {customItem.type === "chair" && <ChairItem customItem={customItem} selected={selected} />}
      {customItem.type === "bed" && <BedItem customItem={customItem} selected={selected} />}
      {customItem.type === "blanket" && <BlanketItem customItem={customItem} selected={selected} />}
    </group>
  );
};

const SelectionRing = ({ visible, args }: { visible: boolean; args: [number, number, number] }) => {
  if (!visible) return null;
  return (
    <mesh position={[0, 0, 0.014]}>
      <boxGeometry args={args} />
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.9} />
    </mesh>
  );
};

const PosterItem = ({ texture, selected }: { texture: THREE.Texture; selected: boolean }) => (
  <group>
    <RoundedBox args={[0.92, 1.24, 0.045]} radius={0.04}>
      <meshStandardMaterial color="#ffffff" map={texture} roughness={0.5} />
    </RoundedBox>
    <SelectionRing visible={selected} args={[1.02, 1.34, 0.055]} />
  </group>
);

const AlbumItem = ({ texture, selected }: { texture: THREE.Texture; selected: boolean }) => (
  <group>
    <RoundedBox args={[0.54, 0.72, 0.13]} radius={0.045} castShadow>
      <meshStandardMaterial color="#ffffff" map={texture} roughness={0.48} />
    </RoundedBox>
    <mesh position={[0.31, 0, -0.01]}>
      <boxGeometry args={[0.04, 0.7, 0.12]} />
      <meshStandardMaterial color="#ffffff" roughness={0.35} />
    </mesh>
    <SelectionRing visible={selected} args={[0.64, 0.82, 0.16]} />
  </group>
);

const LightstickItem = ({
  customItem,
  selected,
}: {
  customItem: CustomItem;
  selected: boolean;
}) => {
  const [accent, glow, deep] = customItem.design.palette;
  return (
    <group rotation={[0, 0, -0.12]}>
      <RoundedBox args={[0.12, 0.64, 0.12]} radius={0.045} position={[0, -0.28, 0]} castShadow>
        <meshStandardMaterial color={deep ?? "#5f43ca"} roughness={0.36} />
      </RoundedBox>
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial color={glow ?? "#ffffff"} emissive={accent ?? "#ff6fae"} emissiveIntensity={0.45} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.1, 0.22]}>
        <circleGeometry args={[0.09, 24]} />
        <meshStandardMaterial color={accent ?? "#ff6fae"} roughness={0.5} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
};

const ChairItem = ({ customItem, selected }: { customItem: CustomItem; selected: boolean }) => {
  const [seat = "#ffd0e5", cushion = "#ffffff", legs = "#ff6fae"] = customItem.design.palette;
  return (
    <group>
      <RoundedBox args={[0.62, 0.16, 0.58]} radius={0.08} position={[0, 0.42, 0]} castShadow>
        <meshStandardMaterial color={seat} roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.82, 0.14]} radius={0.08} position={[0, 0.86, -0.26]} castShadow>
        <meshStandardMaterial color={cushion} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.08, 0.4]} radius={0.04} position={[0, 0.53, 0.02]} castShadow>
        <meshStandardMaterial color={cushion} roughness={0.68} />
      </RoundedBox>
      {[
        [-0.24, 0.2, -0.18],
        [0.24, 0.2, -0.18],
        [-0.24, 0.2, 0.22],
        [0.24, 0.2, 0.22],
      ].map((position) => (
        <RoundedBox key={position.join("-")} args={[0.08, 0.42, 0.08]} radius={0.025} position={position as Vec3} castShadow>
          <meshStandardMaterial color={legs} roughness={0.56} />
        </RoundedBox>
      ))}
      {selected && (
        <mesh position={[0, 0.56, 0]}>
          <boxGeometry args={[0.86, 1.2, 0.82]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
};

const BedItem = ({ customItem, selected }: { customItem: CustomItem; selected: boolean }) => {
  const [frame = "#f7d8b6", sheet = "#ffffff", blanket = "#ff8db9"] = customItem.design.palette;
  return (
    <group>
      <RoundedBox args={[1.62, 0.28, 1.12]} radius={0.09} position={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial color={frame} roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[1.46, 0.18, 0.96]} radius={0.1} position={[0, 0.38, 0]} castShadow>
        <meshStandardMaterial color={sheet} roughness={0.74} />
      </RoundedBox>
      <RoundedBox args={[1.46, 0.16, 0.58]} radius={0.12} position={[0, 0.5, 0.18]} castShadow>
        <meshStandardMaterial color={blanket} roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.16, 0.24]} radius={0.09} position={[-0.42, 0.55, -0.34]} castShadow>
        <meshStandardMaterial color={sheet} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.16, 0.24]} radius={0.09} position={[0.42, 0.55, -0.34]} castShadow>
        <meshStandardMaterial color={sheet} roughness={0.7} />
      </RoundedBox>
      {selected && (
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.78, 0.78, 1.28]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
};

const BlanketItem = ({ customItem, selected }: { customItem: CustomItem; selected: boolean }) => {
  const [base = "#caa7ff", stripe = "#f8f2ff", edge = "#92f5ff"] = customItem.design.palette;
  return (
    <group>
      <RoundedBox args={[1.18, 0.14, 0.86]} radius={0.12} position={[0, 0.12, 0]} castShadow>
        <meshStandardMaterial color={base} roughness={0.82} />
      </RoundedBox>
      {[-0.32, 0, 0.32].map((x) => (
        <RoundedBox key={x} args={[0.08, 0.035, 0.82]} radius={0.025} position={[x, 0.21, 0]} castShadow>
          <meshStandardMaterial color={stripe} roughness={0.8} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.22, 0.04, 0.12]} radius={0.03} position={[0, 0.22, -0.38]} castShadow>
        <meshStandardMaterial color={edge} roughness={0.75} />
      </RoundedBox>
      {selected && (
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[1.34, 0.34, 1]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
};
