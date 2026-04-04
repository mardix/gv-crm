import { useEffect } from 'preact/hooks';

const MSG_SEL = 'textarea.message-input';
const BANNER_ID = 'vcrm-draft-banner';

// In-memory only — never persisted, never part of React state
const draftMap = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPhoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('itemId');
  if (!itemId) return null;
  return itemId.replace(/^t\.\+?/, '').replace(/\D/g, '') || null;
}

function getTextarea() {
  return document.querySelector(MSG_SEL);
}

function removeBanner() {
  document.getElementById(BANNER_ID)?.remove();
}

function restoreToInput(text) {
  const ta = getTextarea();
  if (!ta) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(ta, text); else ta.value = text;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  ta.focus();
}

function injectBanner(phone, draftText) {
  removeBanner();

  let attempts = 0;
  const tryInject = () => {
    if (document.getElementById(BANNER_ID)) return;
    const ta = getTextarea();
    if (!ta) {
      if (++attempts < 30) { setTimeout(tryInject, 200); return; }
      return;
    }

    const container = ta.closest('gv-message-input') || ta.parentElement;
    if (!container) return;

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    Object.assign(banner.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '8px', padding: '9px 14px',
      background: '#fefce8', borderTop: '1.5px solid #fde68a',
      fontSize: '13px', color: '#78350f', lineHeight: '1.4',
      fontFamily: '"Inter", "Outfit", sans-serif', fontWeight: 500,
      zIndex: '2147483640', boxSizing: 'border-box', width: '100%',
    });

    const labelWrap = document.createElement('div');
    labelWrap.style.flex = '1';
    const label = document.createElement('span');
    label.textContent = '✏️ Unsent draft for this conversation';
    const preview = document.createElement('em');
    preview.style.cssText = 'font-size:11px;color:#a16207;display:block;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:300px;';
    preview.textContent = `"${draftText.slice(0, 90)}${draftText.length > 90 ? '…' : ''}"`;
    labelWrap.appendChild(label);
    labelWrap.appendChild(preview);

    const btn = (label, bg, extra = {}) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, { border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, flexShrink: '0', background: bg, ...extra });
      return b;
    };

    const btnContinue = btn('Continue draft', '#f59e0b', { color: '#fff' });
    btnContinue.onclick = () => { restoreToInput(draftText); removeBanner(); };

    const btnClear = btn('Clear', 'none', { color: '#92400e', border: '1px solid #fcd34d', fontWeight: 600 });
    btnClear.onclick = () => { draftMap.delete(phone); removeBanner(); };

    banner.appendChild(labelWrap);
    banner.appendChild(btnContinue);
    banner.appendChild(btnClear);

    const parent = container.parentElement;
    if (parent) parent.insertBefore(banner, container);
    else container.before?.(banner);
  };

  tryInject();
}

// ── The Hook ─────────────────────────────────────────────────────────────────

export function useDraftStash() {
  useEffect(() => {
    let currentUrl = window.location.href;
    let currentPhone = getPhoneFromUrl();
    let cachedText = '';   // always up-to-date via 'input' listener
    let currentTa = null;

    // ── Real-time textarea value tracking ──
    const onInput = (e) => { cachedText = e.target.value ?? ''; };

    const attachListener = () => {
      const ta = getTextarea();
      if (ta && ta !== currentTa) {
        currentTa?.removeEventListener('input', onInput);
        ta.addEventListener('input', onInput);
        currentTa = ta;
        cachedText = ta.value ?? '';   // seed on attach
      }
    };

    // ── Save draft for current phone ──
    const stashCurrent = () => {
      const text = (currentTa?.value ?? cachedText).trim();
      if (text && currentPhone) {
        draftMap.set(currentPhone, text);
      }
    };

    // ── URL change handler ──
    const onUrlChange = () => {
      const newUrl = window.location.href;
      if (newUrl === currentUrl) return;   // exact same URL — no-op
      currentUrl = newUrl;

      // Immediately stash whatever is in the textarea
      stashCurrent();
      removeBanner();

      // Update current phone
      const newPhone = getPhoneFromUrl();
      currentPhone = newPhone;
      currentTa = null;
      cachedText = '';

      // Show banner if this phone has a saved draft
      if (newPhone && draftMap.has(newPhone)) {
        injectBanner(newPhone, draftMap.get(newPhone));
      }
    };

    // ── Tight URL observer (100ms) — catches GV internal SPA routing ──
    const urlPoll = setInterval(() => {
      attachListener();   // keep textarea listener fresh
      onUrlChange();      // check URL on every tick
    }, 100);

    // ── Also hook into browser events for immediate response ──
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('locationchange', onUrlChange);

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState    = (...a) => { origPush(...a);    onUrlChange(); };
    history.replaceState = (...a) => { origReplace(...a); onUrlChange(); };

    // ── Proactive stash on any click (fires before GV routing tears down DOM) ──
    const onDocClick = () => stashCurrent();
    document.addEventListener('click', onDocClick, true); // capture phase = first to fire

    // Save on tab close
    window.addEventListener('beforeunload', stashCurrent);

    // Initial setup
    attachListener();
    if (currentPhone && draftMap.has(currentPhone)) {
      injectBanner(currentPhone, draftMap.get(currentPhone));
    }

    return () => {
      clearInterval(urlPoll);
      currentTa?.removeEventListener('input', onInput);
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('locationchange', onUrlChange);
      window.removeEventListener('beforeunload', stashCurrent);
      document.removeEventListener('click', onDocClick, true);
      history.pushState    = origPush;
      history.replaceState = origReplace;
      removeBanner();
    };
  }, []);
}
