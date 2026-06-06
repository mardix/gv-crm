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

function personalizeCampaignMessage(message = '', entry = {}) {
  if (!message) return '';
  const firstName = (entry.name || '').split(' ')[0] || entry.name || '';
  const values = {
    name: firstName,
    email: entry.email || '',
    phone: entry.phone || '',
    handle: entry.handle || '',
    contactid: entry.id || entry.contactId || '',
    status: entry.status || '',
    leadsource: entry.leadSource || '',
    category: entry.category || '',
    membershiplevel: entry.membershipLevel || ''
  };

  return message.replace(/{{\s*([^}]+?)\s*}}/g, (_, expression) => resolveTokenExpression(expression, values));
}

function splitTokenExpression(expression = '') {
  const parts = [];
  let current = '';
  let quote = '';

  for (const char of String(expression)) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      current += char;
      continue;
    }
    if (char === quote) {
      quote = '';
      current += char;
      continue;
    }
    if (char === '|' && !quote) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  parts.push(current.trim());
  return parts.filter(Boolean);
}

function resolveTokenExpression(expression, values) {
  const parts = splitTokenExpression(expression);

  for (const part of parts) {
    const literal = part.match(/^(['"])(.*)\1$/);
    if (literal) return literal[2];

    const value = values[part.toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
}

function buildCampaignAttachement(imageData) {
  if (!imageData) return null;
  const match = String(imageData).match(/^data:([^;,]+)[;,]/);
  return {
    name: 'campaign-image',
    contentType: match ? match[1] : '',
    dataUrl: imageData
  };
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

    const isGVTab = sender.tab && sender.tab.url && sender.tab.url.includes('voice.google.com');

    if (isGVTab && sender.tab && sender.tab.id) {
      executeOpenChat(sender.tab.id).then(sendResponse).catch(e => sendResponse({error: e.message}));
    } else {
      const handleStandaloneOpen = async () => {
        const cleanNum = msg.number.startsWith('1') ? msg.number : '1' + msg.number;
        const targetUrl = `https://voice.google.com/u/0/messages?itemId=t.%2B${cleanNum}`;

        const tabs = await new Promise(resolve => {
          chrome.tabs.query({ url: '*://voice.google.com/*' }, resolve);
        });

        if (tabs && tabs.length > 0) {
          const gvTab = tabs[0];
          await new Promise(resolve => {
            chrome.tabs.update(gvTab.id, { active: true }, () => {
              chrome.windows.update(gvTab.windowId, { focused: true }, resolve);
            });
          });
          return executeOpenChat(gvTab.id);
        } else {
          await new Promise(resolve => {
            chrome.tabs.create({ url: targetUrl, active: true }, resolve);
          });
          return { success: true };
        }
      };

      handleStandaloneOpen().then(sendResponse).catch(e => sendResponse({error: e.message}));
    }
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

async function runCampaign(tabId, { id, type, form, phones, message, imageData, delayMin, delayMax }) {
  if (sendingCampaignId) return { error: 'Another campaign is already running' };
  sendingCampaignId = id;
  stopRequested = false;

  const isSms = !type || type === 'sms';

  if (!isSms) {
    try {
      await runFormCampaign(tabId, { id, form, phones, message, imageData });
      return { success: true };
    } finally {
      sendingCampaignId = null;
      broadcast(tabId, { type: 'campaignStatus', campaignId: id, state: 'done' });
      broadcast(tabId, { type: 'campaignDone', campaignId: id });
    }
  }

  const randomDelay = () => {
    const minMs = (delayMin || 20) * 1000;
    const maxMs = (delayMax || 60) * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  };

  if (isSms && tabId) {
    try {
      await cdpAttach(tabId);
    } catch (e) {
      console.warn("CDP Attach failed", e);
    }
  }

  for (let i = 0; i < phones.length; i++) {
    if (stopRequested) break;

    const entry = phones[i];
    const phone = entry.phone;

    if (isSms) {
      const finalMessage = personalizeCampaignMessage(message, entry);

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

  if (isSms && tabId) {
    try {
      await cdpDetach(tabId);
    } catch (e) {}
  }
  sendingCampaignId = null;
  broadcast(tabId, { type: 'campaignStatus', campaignId: id, state: 'done' });
  broadcast(tabId, { type: 'campaignDone', campaignId: id });
  return { success: true };
}

function buildFormRecipientPayload(entry, message = '') {
  const contact = {
    id: entry.id || '',
    contactId: entry.id || '',
    name: entry.name || '',
    phone: entry.phone || '',
    email: entry.email || '',
    handle: entry.handle || '',
    location: entry.location || '',
    status: entry.status || '',
    leadSource: entry.leadSource || '',
    category: entry.category || '',
    membershipLevel: entry.membershipLevel || ''
  };

  const fields = {
    crm_contact_id: contact.id,
    crm_contact_name: contact.name,
    crm_contact_phone: contact.phone,
    crm_contact_email: contact.email,
    crm_contact_handle: contact.handle,
    crm_contact_location: contact.location,
    crm_contact_status: contact.status,
    crm_contact_leadSource: contact.leadSource,
    crm_contact_category: contact.category,
    crm_contact_membershipLevel: contact.membershipLevel
  };

  return {
    contact,
    message: personalizeCampaignMessage(message, entry),
    fields
  };
}

function parseFormFields(form) {
  const parsed = {};
  if (!form || !Array.isArray(form.fields)) return parsed;

  form.fields.forEach(field => {
    const name = String(field.name || '').trim();
    if (!name) return;
    parsed[name] = field.value || '';
  });

  return parsed;
}

function readApiResponse(text) {
  try {
    const json = JSON.parse(text);
    if (json.ok === false || json.success === false) {
      return { ok: false, error: json.error || json.message || 'API rejected campaign' };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: true };
  }
}

async function runFormCampaign(tabId, { id, form, phones, message, imageData }) {
  const endpoint = form?.endpointUrl || '';
  if (!endpoint) throw new Error('Form endpoint URL is missing');

  const contentType = form?.contentType || 'json';
  const headers = { 'Content-Type': contentType === 'text' ? 'text/plain' : 'application/json' };
  const recipients = (phones || []).map(entry => buildFormRecipientPayload(entry, message));
  const campaignPayload = {
    ...parseFormFields(form),
    data: {
      campaign: {
        id,
        type: 'form',
        formId: form?.id || '',
        formName: form?.name || '',
        message: message || '',
        sentAt: new Date().toISOString(),
        totalRecipients: recipients.length
      },
      attachement: buildCampaignAttachement(imageData),
      recipients
    }
  };

  broadcast(tabId, {
    type: 'campaignStatus',
    campaignId: id,
    state: 'sending',
    current: recipients[0]?.contact || null,
    next: recipients[1]?.contact || null,
    sent: 0,
    total: recipients.length
  });

  try {
    const fetchRes = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(campaignPayload)
    });

    if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}: ${fetchRes.statusText}`);

    const responseText = await fetchRes.text();
    const apiResult = readApiResponse(responseText);
    if (!apiResult.ok) throw new Error(apiResult.error);

    broadcast(tabId, {
      type: 'campaignBulkProgress',
      campaignId: id,
      success: true,
      recipients: phones.map(entry => ({ phone: entry.phone, name: entry.name }))
    });
  } catch (e) {
    broadcast(tabId, {
      type: 'campaignBulkProgress',
      campaignId: id,
      success: false,
      error: e.message,
      recipients: phones.map(entry => ({ phone: entry.phone, name: entry.name }))
    });
  }
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
