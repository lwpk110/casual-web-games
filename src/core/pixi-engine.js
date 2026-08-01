// Pixi.js High-DPI Retina WebGL Engine Helper
export function createHDApplication(containerEl, width = 600, height = 480) {
  const dpr = Math.max(2, window.devicePixelRatio || 2);

  const app = new PIXI.Application({
    width,
    height,
    resolution: dpr,
    autoDensity: true,
    antialias: true,
    backgroundColor: 0x06080f,
    backgroundAlpha: 1
  });

  // Apply crisp styling
  app.view.style.width = `${width}px`;
  app.view.style.height = `${height}px`;
  app.view.style.display = 'block';

  containerEl.appendChild(app.view);
  return app;
}
