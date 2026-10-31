import * as THREE from "three";
import type { IconDesign, IconFrame, IconPattern, IconSymbol } from "../types";

const textureCache = new Map<string, THREE.CanvasTexture>();

const drawSymbol = (
  ctx: CanvasRenderingContext2D,
  symbol: IconSymbol,
  x: number,
  y: number,
  size: number,
  color: string,
  initial?: string,
) => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.translate(x, y);

  if (symbol === "initial") {
    ctx.font = `800 ${size * 0.82}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((initial?.trim()[0] ?? "K").toUpperCase(), 0, size * 0.04);
  }

  if (symbol === "star" || symbol === "spark") {
    const points = symbol === "star" ? 5 : 4;
    const outer = size * 0.45;
    const inner = symbol === "star" ? size * 0.19 : size * 0.08;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outer : inner;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  if (symbol === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.35);
    ctx.bezierCurveTo(-size * 0.58, 0, -size * 0.42, -size * 0.42, 0, -size * 0.2);
    ctx.bezierCurveTo(size * 0.42, -size * 0.42, size * 0.58, 0, 0, size * 0.35);
    ctx.fill();
  }

  if (symbol === "moon") {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, Math.PI * 0.25, Math.PI * 1.75);
    ctx.arc(size * 0.2, -size * 0.02, size * 0.35, Math.PI * 1.66, Math.PI * 0.34, true);
    ctx.closePath();
    ctx.fill();
  }

  if (symbol === "crown") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, size * 0.28);
    ctx.lineTo(-size * 0.36, -size * 0.22);
    ctx.lineTo(-size * 0.08, size * 0.02);
    ctx.lineTo(0, -size * 0.32);
    ctx.lineTo(size * 0.08, size * 0.02);
    ctx.lineTo(size * 0.36, -size * 0.22);
    ctx.lineTo(size * 0.45, size * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-size * 0.4, size * 0.28, size * 0.8, size * 0.12);
  }

  ctx.restore();
};

const fillPattern = (
  ctx: CanvasRenderingContext2D,
  pattern: IconPattern,
  palette: string[],
  width: number,
  height: number,
) => {
  const [a, b, c] = palette;

  if (pattern === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, a);
    gradient.addColorStop(0.55, b);
    gradient.addColorStop(1, c);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = a;
  ctx.fillRect(0, 0, width, height);

  if (pattern === "stripe") {
    ctx.fillStyle = b;
    for (let x = -width; x < width * 1.5; x += 44) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(-0.28);
      ctx.fillRect(0, 0, 18, height * 1.5);
      ctx.restore();
    }
  }

  if (pattern === "checker") {
    const size = 48;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? b : c;
        ctx.fillRect(x, y, size, size);
      }
    }
  }
};

const drawFrame = (ctx: CanvasRenderingContext2D, frame: IconFrame, width: number, height: number, color: string) => {
  if (frame === "none") return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = frame === "sticker" ? 18 : 10;

  if (frame === "rounded" || frame === "sticker") {
    ctx.beginPath();
    ctx.roundRect(18, 18, width - 36, height - 36, 42);
    ctx.stroke();
  } else {
    ctx.strokeRect(22, 22, width - 44, height - 44);
  }

  if (frame === "sticker") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(34, 34, width - 68, height - 68, 32);
    ctx.stroke();
  }
  ctx.restore();
};

export const createIconCanvas = (design: IconDesign, size = 512) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const palette = design.palette.length >= 3 ? design.palette : ["#ff6fae", "#ffffff", "#ffd0e5"];
  fillPattern(ctx, design.pattern, palette, size, size);

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size * 0.12, size * 0.14, size * 0.14, 0, Math.PI * 2);
  ctx.arc(size * 0.86, size * 0.82, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawSymbol(ctx, design.symbol, size / 2, size * 0.43, size * 0.46, palette[1], design.text);

  if (design.text?.trim()) {
    ctx.fillStyle = palette[1];
    ctx.font = `800 ${Math.max(36, 74 - design.text.length * 2)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(design.text.trim().slice(0, 8).toUpperCase(), size / 2, size * 0.75);
  }

  drawFrame(ctx, design.frame, size, size, palette[1]);
  return canvas;
};

export const getIconTexture = (design: IconDesign) => {
  const key = JSON.stringify(design);
  const cached = textureCache.get(key);
  if (cached) return cached;

  const texture = new THREE.CanvasTexture(createIconCanvas(design));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
};
