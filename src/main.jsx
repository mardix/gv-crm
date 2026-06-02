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
    'top:30% !important',
    'right:0 !important',
    'transform:translateY(-50%) !important',
    'z-index:2147483647 !important',
    'display:flex !important',
    'align-items:center !important',
    'justify-content:center !important',
    'width:38px !important',
    'height:94px !important',
    'background:linear-gradient(135deg, #1e1b4b, #090514) !important',
    'border:1px solid rgba(139, 92, 246, 0.3) !important',
    'border-right:none !important',
    'border-radius:20px 0 0 20px !important',
    'cursor:pointer !important',
    'box-shadow:-4px 0 16px rgba(9, 5, 20, 0.45) !important',
    'transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important',
    'opacity:1 !important',
    'visibility:visible !important',
    'pointer-events:auto !important',
  ];
  togBtn.setAttribute('style', togStyles.join(';'));
  togBtn.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;color:#fff;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <div style="font-size:9px;font-weight:900;color:#fff;font-family:'Outfit','Inter',sans-serif;letter-spacing:0.8px;text-align:center;line-height:1.2;text-transform:uppercase;">
        C<br/>R<br/>M
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin-top:2px;">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </div>
  `;

  togBtn.addEventListener('mouseenter', () => {
    togBtn.style.setProperty('width', '44px', 'important');
    togBtn.style.setProperty('border-color', 'rgba(139, 92, 246, 0.5)', 'important');
    togBtn.style.setProperty('box-shadow', '-6px 0 20px rgba(9, 5, 20, 0.6)', 'important');
  });
  togBtn.addEventListener('mouseleave', () => {
    togBtn.style.setProperty('width', '38px', 'important');
    togBtn.style.setProperty('border-color', 'rgba(139, 92, 246, 0.3)', 'important');
    togBtn.style.setProperty('box-shadow', '-4px 0 16px rgba(9, 5, 20, 0.45)', 'important');
  });
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
        if (togBtn) togBtn.style.setProperty('display', 'flex', 'important');
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
