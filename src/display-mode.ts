export function displayGeometry(width: number, height: number, portrait: boolean, legacy: boolean) {
  const rotated = portrait && width > height;
  const logicalWidth = portrait ? 640 : legacy ? 1920 : width;
  const logicalHeight = portrait ? 1920 : legacy ? 640 : height;
  const scale = Math.min(width / (rotated ? logicalHeight : logicalWidth), height / (rotated ? logicalWidth : logicalHeight));
  const left = (width - (rotated ? logicalHeight : logicalWidth) * scale) / 2;
  const top = (height - (rotated ? logicalWidth : logicalHeight) * scale) / 2 + (rotated ? logicalWidth * scale : 0);
  return {width: logicalWidth, height: logicalHeight, left, top, transform: `rotate(${rotated ? -90 : 0}deg) scale(${scale})`};
}

export function setupDisplayMode(onLayout: () => void = () => {}): void {
  const key = 'health-signage-display-mode';
  const landscape = document.getElementById('mode-landscape')!;
  const portrait = document.getElementById('mode-portrait')!;
  const app = document.querySelector<HTMLElement>('.app')!;
  const signage = document.querySelector<HTMLElement>('.signage')!;
  const inputPanel = document.querySelector<HTMLElement>('.input-panel')!;
  const mainChart = document.querySelector<HTMLElement>('.main-chart')!;
  // Flex gap cannot be reliably detected with CSS.supports('gap', ...).
  const probe = document.createElement('div');
  probe.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  probe.appendChild(document.createElement('div'));
  probe.appendChild(document.createElement('div'));
  document.body.appendChild(probe);
  const legacy = probe.scrollHeight !== 1 || !CSS.supports('display', 'grid');
  probe.parentNode!.removeChild(probe);
  if (legacy) document.documentElement.classList.add('legacy-layout');
  let mode: 'landscape' | 'portrait' = 'landscape';
  function resize(): void {
    const geometry = displayGeometry(window.innerWidth, window.innerHeight, mode === 'portrait', legacy);
    app.style.position = 'absolute';
    app.style.width = geometry.width + 'px';
    app.style.height = geometry.height + 'px';
    app.style.left = geometry.left + 'px';
    app.style.top = geometry.top + 'px';
    app.style.transformOrigin = 'top left';
    app.style.transform = geometry.transform;
    requestAnimationFrame(onLayout);
  }
  function apply(value: 'landscape' | 'portrait'): void {
    mode = value;
    document.documentElement.dataset.displayMode = mode;
    // Move the real controls; CSS order alone leaves legacy WebViews and focus order behind.
    if (mode === 'portrait') signage.insertBefore(inputPanel, mainChart);
    else app.appendChild(inputPanel);
    landscape.setAttribute('aria-pressed', String(mode === 'landscape'));
    portrait.setAttribute('aria-pressed', String(mode === 'portrait'));
    resize();
  }
  function select(value: 'landscape' | 'portrait'): void {
    apply(value);
    try { localStorage.setItem(key, value); } catch { /* Session-only preference. */ }
  }
  try { if (localStorage.getItem(key) === 'portrait') mode = 'portrait'; } catch { /* Default. */ }
  apply(mode);
  landscape.addEventListener('click', () => select('landscape'));
  portrait.addEventListener('click', () => select('portrait'));
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => { resize(); setTimeout(resize, 250); });
  document.addEventListener('fullscreenchange', resize);
  document.addEventListener('webkitfullscreenchange', resize);
}
