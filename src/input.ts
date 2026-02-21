import type { CandyBoxGame } from "./game";

export function wireInput(canvas: HTMLCanvasElement, game: CandyBoxGame): void {
  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  canvas.addEventListener("pointermove", (event) => {
    const { x } = toCanvasCoords(event.clientX, event.clientY);
    game.onPointerMove(x);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const { x, y } = toCanvasCoords(event.clientX, event.clientY);
    game.onPointerDown(x, y);
  });

  canvas.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const { x } = toCanvasCoords(touch.clientX, touch.clientY);
      game.onPointerMove(x);
      event.preventDefault();
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const { x, y } = toCanvasCoords(touch.clientX, touch.clientY);
      game.onPointerMove(x);
      game.onPointerDown(x, y);
      event.preventDefault();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Backspace") {
      event.preventDefault();
    }
    game.onKeyDown(event.key);
  });
}
