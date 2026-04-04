import { render } from 'preact';
import { App } from './App';
import { STYLE } from './styles/styles';

let isSetup = false;
let togBtn = null;
let root = null;
let styleTag = null;

function setup() {
  if (isSetup || document.getElementById('vcrm-root')) return;
  isSetup = true;

  styleTag = document.createElement('style');
  styleTag.textContent = STYLE;
  document.head.appendChild(styleTag);

  togBtn = document.createElement('button');
  togBtn.id = 'vcrm-open-btn';
  const togStyles = [
    'all:unset',
    'position:fixed !important',
    'top:40% !important',
    'right:-30px !important',
    'transform:translateY(-50%) rotate(-90deg) !important',
    'z-index:2147483647 !important',
    'display:inline-flex !important',
    'align-items:center !important',
    'justify-content:center !important',
    'gap:8px !important',
    'padding:11px 22px !important',
    'background:#0f172a !important',
    'color:#fff !important',
    'border:none !important',
    'border-radius:99px !important',
    'cursor:pointer !important',
    'font-family:Inter,sans-serif !important',
    'font-size:16px !important',
    'font-weight:700 !important',
    'line-height:normal !important',
    'white-space:nowrap !important',
    'letter-spacing:.3px !important',
    'opacity:1 !important',
    'visibility:visible !important',
    'pointer-events:auto !important',
    'text-decoration:none !important',
  ];
  togBtn.setAttribute('style', togStyles.join(';'));
  togBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;flex-shrink:0;display:block"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span style="pointer-events:none;display:inline;color:#fff;font-size:13px;font-weight:700;font-family:Inter,sans-serif;letter-spacing:.3px">GV-CRM</span>';

  togBtn.addEventListener('mouseenter', () => togBtn.style.setProperty('background', '#4338ca', 'important'));
  togBtn.addEventListener('mouseleave', () => togBtn.style.setProperty('background', '#0f172a', 'important'));
  document.body.appendChild(togBtn);

  root = document.createElement('div');
  root.id = 'vcrm-root';
  root.setAttribute('style', 'position:fixed !important;top:0 !important;right:0 !important;width:0 !important;height:0 !important;overflow:visible !important;z-index:2147483644 !important;display:block !important;');
  document.body.appendChild(root);

  togBtn.addEventListener('click', () => {
    togBtn.style.setProperty('display', 'none', 'important');
    root.dispatchEvent(new CustomEvent('vcrm-open'));
  });

  render(<App togBtn={togBtn} />, root);
}

function teardown() {
  if (!isSetup) return;
  isSetup = false;

  if (root) {
    render(null, root);
    root.remove();
    root = null;
  }
  if (togBtn) {
    togBtn.remove();
    togBtn = null;
  }
  if (styleTag) {
    styleTag.remove();
    styleTag = null;
  }

  // Remove any loose DOM artifacts left over by the extension
  document.getElementById('vcrm-layout-style')?.remove();
  document.getElementById('vcrm-draft-banner')?.remove();
  document.querySelectorAll('.vcrm-widget').forEach(el => el.remove());
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggleUI') {
    if (isSetup && root) {
      // Toggle visibility based on togBtn
      if (togBtn && togBtn.style.display !== 'none') {
        togBtn.style.setProperty('display', 'none', 'important');
        root.dispatchEvent(new CustomEvent('vcrm-open'));
      } else {
        root.dispatchEvent(new CustomEvent('vcrm-close'));
        if (togBtn) togBtn.style.setProperty('display', 'inline-flex', 'important');
      }
    }
  } else if (msg.action === 'disableUI') {
    teardown();
  } else if (msg.action === 'enableUI') {
    setup();
  }
});

// Boot script
(function () {
  'use strict';
  chrome.storage.local.get(['vcrm_disabled'], (data) => {
    if (!data.vcrm_disabled) {
      setup();
    }
  });
})();
