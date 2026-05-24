/**
 * Content script — bridge between background.js and injected.js
 * Injects injected.js into MAIN world to access window.grecaptcha
 */
if (!window.__FLOW_KIT_INJECT_REQUESTED__) {
  window.__FLOW_KIT_INJECT_REQUESTED__ = true;
  (function () {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('injected.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  })();
}

if (window.__FLOW_KIT_MESSAGE_HANDLER__) {
  chrome.runtime.onMessage.removeListener(window.__FLOW_KIT_MESSAGE_HANDLER__);
}

window.__FLOW_KIT_MESSAGE_HANDLER__ = (msg, _, reply) => {
  if (msg.type !== 'GET_CAPTCHA') return;

  const { requestId, pageAction } = msg;

  const handler = (e) => {
    if (e.detail?.requestId === requestId) {
      window.removeEventListener('CAPTCHA_RESULT', handler);
      clearTimeout(timer);
      reply({ token: e.detail.token, error: e.detail.error });
    }
  };

  const timer = setTimeout(() => {
    window.removeEventListener('CAPTCHA_RESULT', handler);
    reply({ error: 'CONTENT_TIMEOUT' });
  }, 25000);

  window.addEventListener('CAPTCHA_RESULT', handler);

  window.dispatchEvent(new CustomEvent('GET_CAPTCHA', {
    detail: { requestId, pageAction },
  }));

  return true; // keep channel open for async reply
};

chrome.runtime.onMessage.addListener(window.__FLOW_KIT_MESSAGE_HANDLER__);

// ─── TRPC Media URL Monitor ─────────────────────────────────
// Forward intercepted TRPC responses with media URLs to background.js
if (window.__FLOW_KIT_TRPC_HANDLER__) {
  window.removeEventListener('TRPC_MEDIA_URLS', window.__FLOW_KIT_TRPC_HANDLER__);
}

window.__FLOW_KIT_TRPC_HANDLER__ = (e) => {
  const { url, body } = e.detail || {};
  if (!body) return;
  chrome.runtime.sendMessage({
    type: 'TRPC_MEDIA_URLS',
    trpcUrl: url,
    body,
  }).catch(() => {});
};

window.addEventListener('TRPC_MEDIA_URLS', window.__FLOW_KIT_TRPC_HANDLER__);
