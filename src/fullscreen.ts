/** Keep the control in sync with browser UI and Escape-key exits. */
export function setupFullscreen(): void {
  const button = document.getElementById('fullscreen') as HTMLButtonElement;
  const label = document.getElementById('fullscreen-label')!;
  const notice = document.getElementById('fullscreen-notice')!;
  let pending = false;
  const legacyDocument = document as Document & {
    webkitFullscreenElement?: Element;
    webkitFullscreenEnabled?: boolean;
    webkitExitFullscreen?: () => void;
  };
  const root = document.documentElement as HTMLElement & {webkitRequestFullscreen?: () => void};
  const activeElement = () => document.fullscreenElement || legacyDocument.webkitFullscreenElement;

  function update(): void {
    const active = Boolean(activeElement());
    const supported = document.fullscreenEnabled === true || legacyDocument.webkitFullscreenEnabled === true;
    label.textContent = active ? '縮小' : '全画面';
    button.setAttribute('aria-pressed', String(active));
    const action = active ? '全画面表示を解除する' : '全画面表示にする';
    button.setAttribute('aria-label', action);
    button.title = supported ? action : 'このブラウザでは全画面切り替えを利用できません';
    button.disabled = pending || !supported;
  }

  button.addEventListener('click', async () => {
    if (pending) return;
    pending = true;
    notice.hidden = true;
    update();
    try {
      if (activeElement()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else legacyDocument.webkitExitFullscreen?.();
      } else {
        if (root.requestFullscreen) await root.requestFullscreen();
        else root.webkitRequestFullscreen?.();
      }
    } catch {
      notice.textContent = '画面を切り替えられませんでした。もう一度お試しください。';
      notice.hidden = false;
    } finally {
      pending = false;
      update();
    }
  });
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  update();
}
