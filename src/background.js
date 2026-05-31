// background.js - Service Worker for CDP interaction

let sendingCampaignId = null;
let stopRequested = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function broadcast(tabId, msg) {
  // Send to the tab (content script / App.jsx)
  if (tabId) chrome.tabs.sendMessage(tabId, msg).catch(() => {});
  // Send to runtime (popup if open)
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function cdpAttach(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function cdpDetach(tabId) {
  return new Promise(resolve => {
    chrome.debugger.detach({ tabId }, () => resolve());
  });
}

function cdpSend(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, result => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

async function cdpTypeChar(tabId, char) {
  const isDigit = /\d/.test(char);
  await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', key: char, code: isDigit ? 'Digit' + char : undefined, windowsVirtualKeyCode: char.charCodeAt(0), nativeVirtualKeyCode: char.charCodeAt(0) });
  await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'char', text: char, unmodifiedText: char });
  await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', key: char, code: isDigit ? 'Digit' + char : undefined, windowsVirtualKeyCode: char.charCodeAt(0), nativeVirtualKeyCode: char.charCodeAt(0) });
}

async function cdpTypeString(tabId, str, delayMs = 80) {
  for (const char of str) { await cdpTypeChar(tabId, char); await sleep(delayMs); }
}

async function cdpFocusElement(tabId, selector) {
  const doc = await cdpSend(tabId, 'DOM.getDocument');
  const { nodeId } = await cdpSend(tabId, 'DOM.querySelector', { nodeId: doc.root.nodeId, selector });
  if (!nodeId) throw new Error(`Element not found for focus: ${selector}`);
  await cdpSend(tabId, 'DOM.focus', { nodeId });
}

function runInTab(tabId, fn, ...args) {
  return chrome.scripting.executeScript({ target: { tabId }, func: fn, args }).then(r => r?.[0]?.result).catch(() => null);
}

function pollInTab(tabId, fn, timeout = 8000, ...args) {
  return new Promise(resolve => {
    const start = Date.now();
    const iv = setInterval(async () => {
      if (Date.now() - start > timeout) { clearInterval(iv); resolve(false); return; }
      try { const result = await runInTab(tabId, fn, ...args); if (result) { clearInterval(iv); resolve(true); } } catch (_) {}
    }, 400);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openChat') {
    const executeOpenChat = async (tid) => {
      // 1. Try SPA Routing first (The fast way)
      const fastSuccess = await runInTab(tid, async (number) => {
        const cleanNum = number.startsWith('1') ? number : '1' + number; 
        
        // Google Voice URLs are like: https://voice.google.com/u/0/messages?itemId=t.%2B1xxxxxxxxxx
        let path = window.location.pathname;
        if (!path.endsWith('/messages')) {
          // If we are on /u/0/calls, replace the last segment with /messages to preserve /u/0
          const parts = path.split('/');
          parts.pop(); 
          path = parts.join('/') + '/messages';
        }
        const targetUrl = `${path}?itemId=t.%2B${cleanNum}`;
        
        // 1. Try pushing state manually
        window.history.pushState(null, '', targetUrl);
        // Dispatch popstate so Angular router catches the URL change
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
        window.dispatchEvent(new Event('locationchange'));

        // Poll for up to 1200ms to see if the conversation thread actually rendered
        return new Promise(resolve => {
            let timer = 0;
            const intv = setInterval(() => {
                timer += 100;
                const box = document.querySelector('textarea.message-input');
                // If a textarea exists and is active, routing worked!
                if (box && !box.disabled) {
                    clearInterval(intv);
                    resolve(true); 
                }
                if (timer > 1200) {
                    clearInterval(intv);
                    resolve(false); 
                }
            }, 100);
        });
      }, msg.number);

      if (fastSuccess) return { success: true };

      // 2. Fallback to physical typing if the fast method failed
      await cdpAttach(tid);
      try {
        await executePayload(tid, msg.number, msg.text, null, false);
      } finally {
        await cdpDetach(tid);
      }
      return { success: true };
    };

    const tabId = sender.tab ? sender.tab.id : msg.tabId;
    if (!tabId) {
       chrome.tabs.query({active: true, currentWindow: true}, tabs => {
           if(tabs.length) executeOpenChat(tabs[0].id).then(sendResponse).catch(e => sendResponse({error: e.message}));
       });
       return true;
    }
    
    executeOpenChat(tabId).then(sendResponse).catch(e => sendResponse({error: e.message}));
    return true;
  }
  
  if (msg.action === 'startCampaign') {
    const tabId = sender.tab ? sender.tab.id : msg.tabId;
    if (!tabId) {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if(tabs.length) runCampaign(tabs[0].id, msg).then(sendResponse).catch(e => sendResponse({error: e.message}));
      });
      return true;
    }
    runCampaign(tabId, msg).then(sendResponse).catch(e => sendResponse({error: e.message}));
    return true;
  }
  
  if (msg.action === 'stopCampaign') {
    if (sendingCampaignId === msg.id) stopRequested = true;
    sendResponse({ stopped: true });
    return false;
  }

  if (msg.action === 'sendWebhook') {
    const { url, secret, payload } = msg;
    const headers = { 'Content-Type': 'application/json' };
    if (secret) headers['x-webhook-secret'] = secret;
    fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
      .then(res => res.ok ? { ok: true } : { error: 'Status: ' + res.status })
      .then(sendResponse)
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'gsheetAction') {
    const { url, payload, method = 'POST' } = msg;
    const options = {
      method,
      headers: { 'Content-Type': 'text/plain' }
    };
    
    let finalUrl = url;
    if (method === 'POST') {
      options.body = JSON.stringify(payload);
    } else if (method === 'GET' && payload) {
      const params = new URLSearchParams(payload).toString();
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + params;
    }

    fetch(finalUrl, options)
      .then(res => res.text().then(text => {
        try { return JSON.parse(text); }
        catch (e) { return { ok: false, error: 'Invalid JSON response from server', text }; }
      }))
      .then(json => {
        console.log('GSheet Proxy Response:', json);
        sendResponse(json);
      })
      .catch(e => {
        console.error('GSheet Proxy Error:', e);
        sendResponse({ ok: false, error: e.message });
      });
    return true;
  }

  if (msg.action === 'sendFormSubmission') {
    const { url, payload, contentType } = msg;
    const headers = { 'Content-Type': contentType === 'text' ? 'text/plain' : 'application/json' };
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
      .then(res => res.text().then(text => {
        try { return JSON.parse(text); }
        catch (e) { return { ok: false, error: 'Invalid JSON response from server', text }; }
      }))
      .then(json => sendResponse(json))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

async function runCampaign(tabId, { id, phones, message, imageData, delayMin, delayMax }) {
  if (sendingCampaignId) return { error: 'Another campaign is already running' };
  sendingCampaignId = id;
  stopRequested = false;

  const randomDelay = () => {
    const minMs = (delayMin || 20) * 1000;
    const maxMs = (delayMax || 60) * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  };

  try {
    await cdpAttach(tabId);
  } catch (e) {
    console.warn("CDP Attach failed", e);
  }

  for (let i = 0; i < phones.length; i++) {
    if (stopRequested) break;

    const entry = phones[i];
    const phone = entry.phone;
    let finalMessage = message;
    if (finalMessage) {
      const firstName = (entry.name || '').split(' ')[0] || entry.name || '';
      // Replace {{ token }} — spaces around token name are ignored
      finalMessage = finalMessage.replace(/{{\s*name\s*}}/gi, firstName);
      finalMessage = finalMessage.replace(/{{\s*email\s*}}/gi, entry.email || '');
      finalMessage = finalMessage.replace(/{{\s*phone\s*}}/gi, entry.phone || '');
      finalMessage = finalMessage.replace(/{{\s*handle\s*}}/gi, entry.handle || '');
    }

    try {
      broadcast(tabId, { type: 'campaignStatus', campaignId: id, state: 'sending', current: entry, next: phones[i + 1] || null, sent: i, total: phones.length });
      await executePayload(tabId, phone, finalMessage, imageData, true);
      broadcast(tabId, { type: 'campaignProgress', campaignId: id, phone, name: entry.name, success: true });
    } catch (e) {
      broadcast(tabId, { type: 'campaignProgress', campaignId: id, phone, name: entry.name, success: false, error: e.message });
      if (e.message === 'RATE_LIMITED') {
        stopRequested = true;
        broadcast(null, { type: 'campaignRateLimit', campaignId: id });
        break;
      }
    }
    if (i < phones.length - 1 && !stopRequested) {
      const remainingSeconds = Math.round(randomDelay() / 1000);
      for (let t = remainingSeconds; t > 0; t--) {
        if (stopRequested) break;
        broadcast(tabId, { type: 'campaignStatus', campaignId: id, state: 'waiting', delay: t, current: null, next: phones[i + 1] || null, sent: i + 1, total: phones.length });
        await sleep(1000);
      }
    }
  }

  await cdpDetach(tabId);
  sendingCampaignId = null;
  broadcast(tabId, { type: 'campaignStatus', campaignId: id, state: 'done' });
  broadcast(tabId, { type: 'campaignDone', campaignId: id });
  return { success: true };
}

async function executePayload(tabId, number, message, imageData, autoSend) {
  const recipientSel = 'input.mat-mdc-chip-input';
  const messageSel   = 'textarea.message-input';
  const sendSel      = "button[aria-label='Send message']";
  const imageSel     = "gv-message-actions input[type='file']";

  const btnClicked = await runInTab(tabId, () => {
    const btn = document.querySelector('.threads-button') || document.querySelector('div[aria-label="Send new message"]') || [...document.querySelectorAll('div[role="button"]')].find(el => el.textContent?.trim().includes('Send new message'));
    if (btn) { btn.click(); return true; }
    return false;
  });

  if (!btnClicked) throw new Error('Could not find "Send new message" button');
  await sleep(800);

  const recipientReady = await pollInTab(tabId, (sel) => !!document.querySelector(sel), 5000, recipientSel);
  if (!recipientReady) throw new Error('Recipient input did not appear');

  await runInTab(tabId, (sel) => {
    document.querySelectorAll('mat-chip-row button, mat-chip button').forEach(btn => btn.click());
    const el = document.querySelector(sel);
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, ''); else el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }, recipientSel);

  await cdpFocusElement(tabId, recipientSel);
  await sleep(300);
  await cdpTypeString(tabId, number, 80);
  await sleep(700);

  const overlayReady = await pollInTab(tabId, () => !!(document.querySelector('gv-contact-list .send-to-button') || document.querySelector('gv-contact-list div[role="button"]')), 6000);

  if (overlayReady) {
    await sleep(500); 
    const sendToClicked = await runInTab(tabId, () => {
      const btn = document.querySelector('gv-contact-list .send-to-button') || document.querySelector('gv-contact-list div[role="button"].send-to-button') || document.querySelector('gv-contact-list div[role="button"]');
      if (btn) { btn.click(); return true; } return false;
    });

    if (!sendToClicked) {
      await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
      await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp',   key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
    }
  } else {
    await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
    await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp',   key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
  }
  await sleep(600);

  const textareaReady = await pollInTab(tabId, (sel) => {
    const el = document.querySelector(sel); return !!(el && !el.disabled);
  }, 6000, messageSel);

  if (!textareaReady && message) throw new Error('Message textarea never appeared');

  if (message) {
    await cdpFocusElement(tabId, messageSel);
    await sleep(200);

    await runInTab(tabId, (sel, msg) => {
      const el = document.querySelector(sel); if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(el, msg); else el.value = msg;
      el.dispatchEvent(new Event('input',  { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    }, messageSel, message);
    await sleep(400);
  }

  if (imageData && autoSend) {
    await runInTab(tabId, (sel, data) => {
      const fileInput = document.querySelector(sel); if (!fileInput) return;
      const arr = data.split(','); const mime = arr[0].match(/:(.*?);/)[1]; const bstr = atob(arr[1]);
      const u8 = new Uint8Array(bstr.length); for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
      const file = new File([u8], 'image.jpg', { type: mime });
      const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, imageSel, imageData);
    await sleep(1200);
  }

  if (autoSend) {
    const sendReady = await pollInTab(tabId, (sel) => {
      const btn = document.querySelector(sel);
      return !!(btn && !btn.disabled && !btn.hasAttribute('disabled'));
    }, 5000, sendSel);

    if (sendReady) {
      await runInTab(tabId, (sel) => document.querySelector(sel)?.click(), sendSel);
    } else {
      await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
      await cdpSend(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp',   key: 'Enter', keyCode: 13, windowsVirtualKeyCode: 13 });
    }
    
    // Give GV a moment to process the send, then check for rate limit errors
    await sleep(1500);
    const rateLimited = await runInTab(tabId, () => {
      const text = document.body.innerText.toLowerCase();
      if (text.includes('not sent') || text.includes('failed to send') || text.includes('not delivered')) return true;
      // If the message input still has text, the send button was dead (another sign of rate limit)
      const input = document.querySelector('textarea.message-input');
      if (input && input.value.trim().length > 0) return true;
      return false;
    });

    if (rateLimited) {
      throw new Error('RATE_LIMITED');
    }

    await sleep(700);
  }
}
