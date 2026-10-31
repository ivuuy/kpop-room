export const exportCanvasImage = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `k-pop-room-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};
