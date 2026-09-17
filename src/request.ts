/** Chrome/WebView 53 has fetch but no AbortController or AbortSignal.timeout. */
export function fetchWithTimeout(url: string, options: RequestInit, timeout = 20000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = setTimeout(() => {
      if (controller) controller.abort();
      reject(new Error('Request timed out'));
    }, timeout);
    fetch(url, controller ? {...options, signal: controller.signal} : options).then(
      response => { clearTimeout(timer); resolve(response); },
      error => { clearTimeout(timer); reject(error); }
    );
  });
}
