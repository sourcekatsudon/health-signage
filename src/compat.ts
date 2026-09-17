// Bundled locally: no CDN is needed on the signage device.
import 'core-js/es/object/entries';
import 'core-js/es/object/values';
import 'core-js/es/object/from-entries';
import ResizeObserverPolyfill from 'resize-observer-polyfill';
if (!window.ResizeObserver) window.ResizeObserver = ResizeObserverPolyfill;

export function readFileText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

if (!Element.prototype.append) {
  Element.prototype.append = function (...nodes: (Node | string)[]): void {
    for (const node of nodes) this.appendChild(typeof node === 'string' ? document.createTextNode(node) : node);
  };
}
