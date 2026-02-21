import type { CandyBoxGame } from "./game";

export function wireInput(canvas: HTMLCanvasElement, game: CandyBoxGame): void {
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    game.onPointerMove(x);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    game.onPointerDown(x, y);
  });

  window.addEventListener("keydown", (event) => {
    game.onKeyDown(event.key);
  });
}
