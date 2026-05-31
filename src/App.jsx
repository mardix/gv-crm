import { useState, useEffect } from 'preact/hooks';
import { loadData, saveData } from './utils/storage';
import { uid, campaignPhones, formatPhone } from './utils/utils';
import { ContactsView } from './views/ContactsView';
import { ListsView, CampaignsView } from './views/ListViews';
import { SettingsView, IOView } from './views/SettingsViews';
import { FormsView } from './views/FormsView';
import { ContactModal } from './components/ContactModal';
import { ListModal, CampaignModal, SyncSidebarModal } from './components/Modals';
import { useConversationSync } from './hooks/useConversationSync';
import { useDraftStash } from './hooks/useDraftStash';
import { ContextWidget } from './components/ContextWidget';
import { PresetsWidget } from './components/PresetsWidget';
export function App({ togBtn }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [forms, setForms] = useState([]);
  const [settings, setSettings] = useState({ contactStatuses: ['Lead', 'Prospect', 'Active', 'VIP', 'Inactive', 'Banned'], listStatuses: ['Prospect', 'Reached Out', 'Confirmed', 'Declined'], delayMin: 15, delayMax: 45, gsheetUrl: '', gsheetAuto: false });

  // Filters & sort
  const [activeCampaignStatus, setActiveCampaignStatus] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterListId, setFilterListId] = useState('');
  const [filterListStatus, setFilterListStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [bulkSelCollapsed, setBulkSelCollapsed] = useState(false);

  // Modals
  const [contactModal, setContactModal] = useState(null);  // null | contact obj | 'new'
  const [listModal, setListModal] = useState(null);
  const [campaignModal, setCampaignModal] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [syncModal, setSyncModal] = useState(false);

  const activeContact = useConversationSync();
  useDraftStash();

  const state = { contacts, lists, campaigns, forms, settings };

  async function sendWebhook(manual = false) {
    if (!settings.webhookUrl) {
      if (manual) alert('Please setup a valid Webhook URL in Settings.');
      return;
    }
    chrome.runtime.sendMessage({
      action: 'sendWebhook',
      url: settings.webhookUrl,
      secret: settings.webhookSecret,
      payload: state
    }, (res) => {
      if (manual) {
        if (res && res.error) alert('Webhook failed: ' + res.error);
        else if (res && res.ok) alert('Webhook successfully triggered!');
      }
    });
  }

  function sendGSheetAction(action, payload, method = 'POST') {
    if (!settings.gsheetUrl) return Promise.resolve({ ok: false, error: 'No GSheet URL' });
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'gsheetAction',
        url: settings.gsheetUrl,
        method,
        payload: { action, ...payload }
      }, (res) => resolve(res || { ok: false, error: 'No response' }));
    });
  }

  function mapContactToGSheet(c) {
    const s = (c.status || '').toLowerCase();
    let gsStatus = 'Review';
    if (s === 'active' || s === 'vip') gsStatus = 'Active';
    else if (s === 'inactive') gsStatus = 'Inactive';
    else if (s === 'banned') gsStatus = 'Banned';

    return {
      contactId: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      status: gsStatus,
      category: (s === 'vip' || c.tags?.some(t => t.toLowerCase() === 'vip')) ? 'VIP' : 'Regular',
      membershipStatus: gsStatus,
      membershipLevel: 'Basic',
      location: [c.city, c.state, c.location].filter(Boolean).join(', '),
      handle: c.handle,
      note: c.comment,
      assignedLists: (c.lists || []).map(l => ({ listId: l.listId, status: l.status || 'Prospect' }))
    };
  }

  async function gsheetSaveContacts(cs, chunkSize = 300) {
    if (!settings.gsheetUrl || !cs.length) return { ok: true };
    const mapped = cs.map(mapContactToGSheet);
    let totalSent = 0;

    for (let i = 0; i < mapped.length; i += chunkSize) {
      const chunk = mapped.slice(i, i + chunkSize);
      console.log(`Syncing chunk ${i / chunkSize + 1} (${chunk.length} contacts)...`);
      const res = await sendGSheetAction('saveContacts', { contacts: chunk });
      if (!res.ok) {
        console.error('Bulk sync failed at chunk:', i, res.error);
        return res;
      }
      totalSent += chunk.length;
    }
    return { ok: true, total: totalSent };
  }

  async function gsheetSaveContact(c) {
    return gsheetSaveContacts([c]);
  }

  async function gsheetSaveContactLists(ls, chunkSize = 100) {
    if (!settings.gsheetUrl || !ls.length) return { ok: true };
    const mapped = ls.map(l => ({
      listId: l.id,
      name: l.name,
      description: l.description || '',
      status: 'Active'
    }));

    let totalSent = 0;
    for (let i = 0; i < mapped.length; i += chunkSize) {
      const chunk = mapped.slice(i, i + chunkSize);
      const res = await sendGSheetAction('saveContactLists', { lists: chunk });
      if (!res.ok) return res;
      totalSent += chunk.length;
    }
    return { ok: true, total: totalSent };
  }

  async function gsheetSaveList(l) {
    return gsheetSaveContactLists([l]);
  }

  async function gsheetDeleteList(id) {
    if (!settings.gsheetUrl) return;
    await sendGSheetAction('deleteContactList', { listId: id });
  }

  async function handleManualGSheetSync() {
    if (!settings.gsheetUrl) return alert('Please enter an Apps Script URL in Settings first.');
    const ok = confirm('Trigger a full sync to Google Sheets? This will push all lists and all contacts. Large datasets will be synced in chunks.');
    if (!ok) return;

    try {
      // 1. Sync Lists (Bulk)
      await gsheetSaveContactLists(lists);
      // 2. Sync Contacts (Bulk with chunking)
      const res = await gsheetSaveContacts(contacts, 100);
      if (res.ok) alert(`✓ Full sync completed: Pushed ${lists.length} lists and ${contacts.length} contacts.`);
      else alert('Sync partially failed: ' + (res.error || 'Unknown error'));
    } catch (err) {
      alert('GSheet Sync Error: ' + err.message);
    }
  }

  useEffect(() => {
    loadData(d => {
      setContacts(d.contacts);
      setLists(d.lists);
      setCampaigns(d.campaigns);
      setForms(d.forms || []);
      setSettings(d.settings);
      setLoaded(true);
    });

    const rootEl = document.getElementById('vcrm-root');
    const handlerOpen = () => setOpen(true);
    const handlerClose = () => setOpen(false);
    if (rootEl) {
      rootEl.addEventListener('vcrm-open', handlerOpen);
      rootEl.addEventListener('vcrm-close', handlerClose);
    }

    const msgListener = (msg) => {
      if (msg.type === 'campaignProgress' && msg.campaignId) {
        setCampaigns(cs => cs.map(c => {
          if (c.id !== msg.campaignId) return c;
          if ((c.log || []).some(l => l.phone === msg.phone)) return c;
          return { ...c, log: [...(c.log || []), { phone: msg.phone, name: msg.name, ok: msg.success, ts: Date.now(), error: msg.error }] };
        }));
      }
      if (msg.type === 'campaignDone' && msg.campaignId) {
        setCampaigns(cs => cs.map(c => {
          if (c.id !== msg.campaignId) return c;
          if (c.status === 'paused' || c.status === 'cancelled') return c;
          const log = c.log || [];
          const hasFailures = log.some(l => !l.ok);
          const pending = c.totalRecipients ? c.totalRecipients - log.length : 0;
          const newStatus = (hasFailures || pending > 0) ? 'paused' : 'done';
          return { ...c, status: newStatus, completedAt: newStatus === 'done' ? Date.now() : c.completedAt, totalRecipients: c.totalRecipients ?? log.length };
        }));
      }
      if (msg.type === 'campaignStatus') {
        if (msg.state === 'done') setActiveCampaignStatus(null);
        else setActiveCampaignStatus(msg);
      }
      if (msg.type === 'campaignRateLimit' && msg.campaignId) {
        setCampaigns(cs => cs.map(c => {
          if (c.id !== msg.campaignId) return c;
          return { ...c, status: 'paused', error: 'Rate limit reached from Google Voice. Paused.' };
        }));
        setActiveCampaignStatus(null);
        alert('Campaign Paused: Google Voice sending limits reached or an unexpected error occurred. Please wait before resuming.');
      }
      if (msg.action === 'updateSettings' && msg.settings) {
        setSettings(s => ({ ...s, ...msg.settings }));
      }
    };
    chrome.runtime.onMessage.addListener(msgListener);

    return () => {
      if (rootEl) {
        rootEl.removeEventListener('vcrm-open', handlerOpen);
        rootEl.removeEventListener('vcrm-close', handlerClose);
      }
      chrome.runtime.onMessage.removeListener(msgListener);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      saveData(state);
      if (settings.webhookAuto) sendWebhook();
    }
  }, [contacts, lists, campaigns, forms, settings]);

  function switchView(v) {
    setView(v); setSearch(''); setFilterStatus(''); setFilterListId(''); setFilterListStatus(''); setFilterTag('');
  }

  function handleSort(col) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function handleImport(rows, onResult, selectedListIds = []) {
    let imp = 0, upd = 0;
    const newContacts = [...contacts];

    rows.forEach(row => {
      // Find the first value in the row if headers like 'phone' don't explicitly exist (for unstructured CSV/pasted lists)
      const rawPhone = String(row.phone || Object.values(row)[0] || '').trim();
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const email = String(row.email || '').trim().toLowerCase();
      let name = String(row.name || '').trim();

      if (!phoneDigits && !email) return; // Skip entirely empty rows
      if (!name) name = rawPhone;

      // Check if contact already exists
      const existingIdx = newContacts.findIndex(c =>
        (phoneDigits && c.phone && c.phone.replace(/\D/g, '') === phoneDigits) ||
        (email && c.email && c.email.toLowerCase() === email)
      );

      const targetLists = selectedListIds.map(id => ({ listId: id, status: settings.listStatuses?.[0] || '' }));

      if (existingIdx !== -1) {
        // Upsert existing contact with lists they don't already have
        const existingContact = newContacts[existingIdx];
        const existingListIds = (existingContact.lists || []).map(l => l.listId);
        const listsToAdd = targetLists.filter(tl => !existingListIds.includes(tl.listId));

        if (listsToAdd.length > 0) {
          newContacts[existingIdx] = {
            ...existingContact,
            phone: formatPhone(existingContact.phone || rawPhone), // optionally enforce formatting on existing
            lists: [...(existingContact.lists || []), ...listsToAdd]
          };
          upd++;
        }
      } else {
        // Create brand new contact
        newContacts.push({
          id: uid(),
          name,
          phone: formatPhone(rawPhone),
          email,
          handle: String(row.handle || '').trim(),
          city: String(row.city || '').trim(),
          state: String(row.state || '').trim(),
          location: String(row.location || '').trim(),
          status: String(row.status || '').trim(),
          tags: String(row.tags || '').split(/[,;]/).map(t => t.trim()).filter(Boolean),
          comment: String(row.comment || '').trim(),
          lists: targetLists
        });
        imp++;
      }
    });

    setContacts(newContacts);

    if (imp > 0 || upd > 0) {
      const msgs = [];
      if (imp > 0) msgs.push(`Imported ${imp} new contact${imp !== 1 ? 's' : ''}`);
      if (upd > 0) msgs.push(`Updated lists for ${upd} existing contact${upd !== 1 ? 's' : ''}`);
      onResult({ type: 'ok', text: `✓ ${msgs.join(' and ')}.` });
    } else {
      onResult({ type: 'warn', text: `No new contacts imported. (All rows matched existing contacts already in the selected lists).` });
    }
  }

  function handleCampaignUpdate(id, action) {
    const camp = campaigns.find(c => c.id === id); if (!camp) return;

    if (action === 'retry-failed') {
      setCampaigns(cs => cs.map(c => {
        if (c.id !== id) return c;
        const cleanLog = (c.log || []).filter(l => l.ok);
        return { ...c, log: cleanLog, status: 'ready' };
      }));
      // Auto-trigger start after state sync
      setTimeout(() => handleCampaignUpdate(id, 'start'), 50);
      return;
    }

    if (action === 'pause') { setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'paused' } : c)); chrome.runtime.sendMessage({ action: 'stopCampaign', id }); return; }
    if (action === 'cancel') { setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'cancelled' } : c)); chrome.runtime.sendMessage({ action: 'stopCampaign', id }); return; }

    if (action === 'start' || action === 'resume') {
      if (activeCampaignStatus) {
        alert('You already have a campaign running. Please pause it before starting another.');
        return;
      }
      const phones = campaignPhones(camp.listIds || [], contacts);
      const remaining = phones.filter(p => !(camp.log || []).some(l => l.phone === p.phone));
      if (remaining.length === 0) {
        setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'done', completedAt: Date.now() } : c));
        return;
      }
      setCampaigns(cs => cs.map(c => c.id === id ? {
        ...c,
        status: 'running',
        startedAt: c.startedAt || Date.now(),
        log: c.log || [],
        totalRecipients: c.totalRecipients ?? phones.length,
        // Snapshot full recipient roster once; never overwrite on resume
        recipients: c.recipients ?? phones.map(p => ({ phone: p.phone, name: p.name || '' })),
      } : c));

      chrome.runtime.sendMessage({
        action: 'startCampaign',
        id,
        phones: remaining,
        message: camp.message,
        imageData: camp.imageDataUrl || null,
        delayMin: settings.delayMin || 15,
        delayMax: settings.delayMax || 45
      }, (res) => {
        if (res && res.error) {
          alert('Campaign blocked: ' + res.error);
          setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'paused' } : c));
        }
      });
    }
  }

  function handleDuplicateCampaign(camp) {
    const fresh = {
      ...camp,
      id: uid(),
      name: `${camp.name} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      log: []
    };
    setCampaigns(cs => [fresh, ...cs]);
    setView('campaigns');
  }

  const addBtn =
    view === 'contacts' ? { label: '+ New Contact', action: () => setContactModal('new') }
      : view === 'lists' ? { label: '+ New List', action: () => setListModal('new') }
        : view === 'forms' ? { label: '+ New Form', action: () => setFormModal('new') }
          : view === 'campaigns' ? { label: '+ New Campaign', action: () => setCampaignModal('new') }
            : null;

  function handleDownloadState() {
    const payload = JSON.stringify({ contacts, lists, campaigns, forms, settings }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = `gvcrm-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleLoadState(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (!data || typeof data !== 'object') throw new Error('Invalid JSON format');
      if (data.contacts && Array.isArray(data.contacts)) setContacts(data.contacts);
      if (data.lists && Array.isArray(data.lists)) setLists(data.lists);
      if (data.campaigns && Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
      if (data.forms && Array.isArray(data.forms)) setForms(data.forms);
      if (data.settings && typeof data.settings === 'object') setSettings(s => ({ ...s, ...data.settings }));
      alert('✓ State restored successfully.');
    } catch (e) {
      alert('Failed to load state: ' + e.message);
    }
  }

  function handleAddFromContext(active) {
    setContactModal({
      id: uid(),
      name: active.contactName || active.formattedPhone || '',
      phone: formatPhone(active.formattedPhone || ''),
      status: 'Lead',
      tags: [],
      lists: [],
      comment: '',
    });
  }

  function handleSyncSidebar() {
    setSyncModal(true);
  }

  function executeSyncSidebar(selectedListIds) {
    setSyncModal(false);
    const phonePattern = /\(\d{3}\)\s\d{3}-\d{4}/;
    const items = Array.from(document.querySelectorAll('div.mat-ripple.container'));
    let count = 0;
    const newContacts = [...contacts];

    const listEntries = (selectedListIds || []).map(lid => ({ listId: lid, status: settings.listStatuses[0] || '' }));

    items.forEach(el => {
      const ann = el.querySelector('gv-annotation');
      const text = ann ? ann.textContent.trim() : '';

      if (phonePattern.test(text)) {
        const phone = text.replace(/\D/g, '');
        if (!newContacts.some(c => (c.phone || '').replace(/\D/g, '').endsWith(phone.slice(-10)))) {
          newContacts.push({
            id: uid(),
            name: text, // They are usually displayed as (XXX) XXX-XXXX in sidebar if unnamed
            phone: formatPhone(text),
            status: 'Lead',
            tags: [],
            lists: listEntries,
            comment: 'Auto-imported from sidebar',
          });
          count++;
        }
      }
    });

    if (count > 0) {
      setContacts(newContacts);
      alert(`✓ Imported ${count} new contact${count !== 1 ? 's' : ''} from the sidebar.`);
    } else {
      alert('No new contacts found in the sidebar.');
    }
  }

  function handleOpenMessage(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return;

    chrome.runtime.sendMessage({ action: 'openChat', number: digits }, (res) => {
      if (res && res.error) console.error('GV-CRM Open Chat Error:', res.error);
    });

    setOpen(false);
    if (togBtn) togBtn.style.setProperty('display', 'inline-flex', 'important');
  }

  useEffect(() => {
    let style = document.getElementById('vcrm-layout-style');
    if (settings.hideRightSidebar) {
      if (!style) {
        style = document.createElement('style');
        style.id = 'vcrm-layout-style';
        document.head.appendChild(style);
      }
      style.textContent = `gv-call-sidebar { display: none !important; }`;
    } else if (style) {
      style.textContent = '';
    }
  }, [settings.hideRightSidebar]);

  const allTagsList = [...new Set(contacts.flatMap(c => c.tags || []))].sort();
  const active = contacts.filter(c => ['Active', 'VIP'].includes(c.status)).length;

  const TABS = [['contacts', 'Contacts'], ['lists', 'Lists'], ['campaigns', '📣 Campaigns'], ['forms', '📋 Forms'], ['settings', '⚙ Settings']];

  if (!loaded) return null;

  return (
    <div>
      <div id="vcrm-panel" style={{
        position: 'fixed', top: 0, right: 0, width: '920px', height: '100vh',
        background: '#f1f5f9', borderLeft: `1px solid #e2e8f0`,
        zIndex: 2147483645, display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter,system-ui,sans-serif', fontSize: '13px', color: '#0f172a',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        pointerEvents: open ? 'auto' : 'none',
      }}>

        {/* ── Topbar ── */}
        <div style={{ flexShrink: 0, height: '60px', background: '#fff', borderBottom: `1px solid #e2e8f0`, padding: '0 16px 0 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 800 }}>GV</div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', letterSpacing: '-.2px', lineHeight: '1.2', fontFamily: 'Inter,sans-serif' }}>GV-CRM</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2', fontFamily: 'Inter,sans-serif' }}>V1.0.0</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '24px', background: "#e2e8f0", flexShrink: 0 }}></div>
          <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
            {TABS.map(([v, l]) => <button key={v} onClick={() => switchView(v)} style={{
              padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif',
              background: view === v ? '#eef2ff' : 'none',
              color: view === v ? '#4f46e5' : '#64748b',
              fontWeight: view === v ? 600 : 500,
            }}>{l}</button>)}
          </div>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setSettings(s => ({ ...s, hideRightSidebar: !s.hideRightSidebar }))}
              title={settings.hideRightSidebar ? "Show Right Sidebar" : "Hide Right Sidebar"}
              style={{ display: 'none', padding: '8px 10px', background: "#fff", color: settings.hideRightSidebar ? '#4f46e5' : '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>◫</span>
            </button>
            {view === 'contacts' && (
              <button onClick={handleSyncSidebar} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: "#fff", color: '#4f46e5', border: '1.5px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '11.5px', fontWeight: 600 }}>
                <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>⟳</span>
                Sync Sidebar
              </button>
            )}
            {addBtn && <button onClick={addBtn.action} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '12.5px', fontWeight: 600 }}>{addBtn.label}</button>}
            <button onClick={() => { setOpen(false); if (togBtn) { togBtn.style.setProperty('display', 'inline-flex', 'important'); } }}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', marginLeft: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>✕</span>
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{ flexShrink: 0, display: 'flex', background: '#fff', borderBottom: `1px solid #e2e8f0` }}>
          {[[contacts.length, 'Contacts'], [active, 'Active / VIP'], [lists.length, 'Lists'], [campaigns.length, 'Campaigns']].map(([n, l], i) => (
            <div key={i} style={{ flex: 1, padding: '12px 20px', borderRight: '1px solid #e2e8f0' }}>
              <span style={{ display: 'block', fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: '1.1', fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter,sans-serif' }}>{n}</span>
              <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '10px', fontFamily: 'Inter,sans-serif' }}>{l}</span>
            </div>))}
          <div style={{ flex: 1, padding: '12px 20px' }}>
            <span style={{ display: 'block', fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: '1.1', fontFamily: 'Inter,sans-serif' }}>{allTagsList.length}</span>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '10px', fontFamily: 'Inter,sans-serif' }}>Tags</span>
          </div>
        </div>

        {/* ── Filter bar ── */}
        {(['contacts', 'lists'].includes(view)) && (
          <div style={{ flexShrink: 0, background: '#fff', borderBottom: `1px solid #e2e8f0`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '140px', maxWidth: '260px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.3" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input value={search} onInput={e => setSearch(e.target.value)} placeholder={view === 'contacts' ? 'Search contacts…' : 'Search lists…'} style={{ display: 'block', width: '100%', padding: '6px 10px 6px 30px', background: '#f1f5f9', border: `1.5px solid #e2e8f0`, borderRadius: '7px', fontSize: '12.5px', color: "#0f172a", outline: 'none' }} />
            </div>
            {view === 'contacts' && (
              <>
                {[['All statuses', setFilterStatus, filterStatus, settings.contactStatuses],
                ['All lists', v => { setFilterListId(v); setFilterListStatus(''); }, filterListId, lists.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })).map(l => ({ id: l.id, label: l.name }))],
                ...(filterListId ? [['All states', setFilterListStatus, filterListStatus, settings.listStatuses]] : []),
                ...(allTagsList.length ? [['All tags', setFilterTag, filterTag, allTagsList]] : []),
                ].map(([placeholder, setter, val, opts], i) => (
                  <select key={i} value={val} onChange={e => setter(e.target.value)} style={{ padding: '6px 26px 6px 10px', background: `#f1f5f9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 8px center`, border: `1.5px solid #e2e8f0`, borderRadius: '7px', fontSize: '12.5px', color: "#0f172a", outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', maxWidth: '150px' }}>
                    <option value="">{placeholder}</option>
                    {opts.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.id || o} value={o.id || o}>{o.label || o}</option>)}
                  </select>
                ))}
                <span style={{ fontSize: '11.5px', color: "#94a3b8", whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {contacts.filter(c => (!filterStatus || c.status === filterStatus) && (!filterTag || c.tags?.includes(filterTag)) && (!filterListId || (c.lists || []).some(e => e.listId === filterListId))).length} of {contacts.length}
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {view === 'contacts' && <ContactsView contacts={contacts} lists={lists} settings={settings} search={search} filterStatus={filterStatus} filterListId={filterListId} filterListStatus={filterListStatus} filterTag={filterTag} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} onEdit={c => setContactModal(c)} selectedIds={selectedIds} onSelect={setSelectedIds} onOpenMessage={handleOpenMessage} />}

          {/* Bulk Actions Bar */}
          {view === 'contacts' && selectedIds.length > 0 && (
            <div style={{
              position: 'absolute', bottom: '20px', left: '20px',
              background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: '12px',
              display: 'flex', flexDirection: bulkSelCollapsed ? 'row' : 'column', alignItems: bulkSelCollapsed ? 'center' : 'flex-start', gap: '14px',
              boxShadow: '0 20px 50px rgba(15,23,42,.4)',
              zIndex: 100, border: '1px solid rgba(255,255,255,.1)',
              width: 'max-content', maxWidth: 'calc(100% - 40px)'
            }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', cursor: 'pointer' }}
                onClick={() => setBulkSelCollapsed(!bulkSelCollapsed)}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{selectedIds.length} selected</div>
                <span style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1, display: 'inline-block', transition: 'transform 0.2s', transform: bulkSelCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>

                {bulkSelCollapsed && (
                  <div style={{ marginLeft: 'auto' }}>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedIds([]); }} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: '12px', padding: '0 5px' }}>Clear</button>
                  </div>
                )}
              </div>

              {!bulkSelCollapsed && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', width: '100%' }}>
                  {/* Set Status */}
                  <select onChange={e => {
                    const s = e.target.value; if (!s) return;
                    setContacts(cs => cs.map(c => selectedIds.includes(c.id) ? { ...c, status: s } : c));
                    e.target.value = '';
                  }} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Set Status…</option>
                    {settings.contactStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Add to List */}
                  <select onChange={e => {
                    const lid = e.target.value; if (!lid) return;
                    setContacts(cs => cs.map(c => selectedIds.includes(c.id) ? { ...c, lists: [...(c.lists || []).filter(x => x.listId !== lid), { listId: lid, status: settings.listStatuses[0] || '' }] } : c));
                    e.target.value = '';
                  }} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Add to List…</option>
                    {lists.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>

                  {/* Remove from List */}
                  <select onChange={e => {
                    const lid = e.target.value; if (!lid) return;
                    setContacts(cs => cs.map(c => selectedIds.includes(c.id) ? { ...c, lists: (c.lists || []).filter(x => x.listId !== lid) } : c));
                    e.target.value = '';
                  }} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Remove from List…</option>
                    {lists.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>

                  <button onClick={() => {
                    if (confirm(`Delete ${selectedIds.length} contacts?`)) {
                      setContacts(cs => cs.filter(c => !selectedIds.includes(c.id)));
                      setSelectedIds([]);
                    }
                  }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Delete</button>

                  <div style={{ flex: 1 }}></div>
                  <button onClick={() => setSelectedIds([])} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: '12px' }}>Clear</button>
                </div>
              )}
            </div>
          )}
          {view === 'lists' && <ListsView lists={lists} contacts={contacts} settings={settings} search={search} onEdit={l => setListModal(l)} onDelete={id => {
            if (confirm('Delete list?')) {
              setLists(ls => ls.filter(l => l.id !== id));
              setContacts(cs => cs.map(c => ({ ...c, lists: (c.lists || []).filter(e => e.listId !== id) })));
              if (settings.gsheetAuto) gsheetDeleteList(id);
            }
          }} onFilter={id => { setView('contacts'); setSearch(''); setFilterStatus(''); setFilterListId(id); setFilterListStatus(''); setFilterTag(''); }} />}
          {view === 'campaigns' && (
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
              <CampaignsView campaigns={campaigns} contacts={contacts} lists={lists} activeStatus={activeCampaignStatus} onEdit={c => setCampaignModal(c)} onUpdate={handleCampaignUpdate} onDelete={id => { if (confirm('Delete campaign?')) setCampaigns(cs => cs.filter(c => c.id !== id)); }} onDuplicate={handleDuplicateCampaign} />
            </div>
          )}
          {view === 'forms' && (
            <FormsView
              forms={forms}
              editingForm={formModal}
              onEdit={f => setFormModal(f)}
              onDelete={id => { if (confirm('Delete form?')) { setForms(fs => fs.filter(f => f.id !== id)); } }}
              onSave={f => { setForms(fs => { const i = fs.findIndex(x => x.id === f.id); return i >= 0 ? fs.map((x, j) => j === i ? f : x) : [f, ...fs]; }); setFormModal(null); }}
              onClose={() => setFormModal(null)}
            />
          )}
          {view === 'settings' && <SettingsView settings={settings} onUpdate={(k, v) => setSettings(s => ({ ...s, [k]: v }))} onManualWebhook={() => sendWebhook(true)} onManualGSheetSync={handleManualGSheetSync} contacts={contacts} lists={lists} onImport={handleImport} onDownloadState={handleDownloadState} onLoadState={handleLoadState} />}
        </div>
      </div>

      {/* ── Modals ── */}
      {contactModal && <ContactModal
        contact={contactModal === 'new' ? null : contactModal}
        lists={lists} settings={settings}
        onSave={c => {
          c.phone = formatPhone(c.phone);
          setContacts(cs => { const i = cs.findIndex(x => x.id === c.id); return i >= 0 ? cs.map((x, j) => j === i ? c : x) : [c, ...cs]; });
          setContactModal(null);
          if (settings.gsheetAuto) gsheetSaveContact(c);
        }}
        onDelete={id => {
          setContacts(cs => cs.filter(c => c.id !== id));
          setContactModal(null);
          // Note: Spec doesn't have delete contact, maybe just leave it
        }}
        onClose={() => setContactModal(null)}
      />}

      {listModal && <ListModal
        list={listModal === 'new' ? null : listModal}
        onSave={l => {
          setLists(ls => { const i = ls.findIndex(x => x.id === l.id); return i >= 0 ? ls.map((x, j) => j === i ? l : x) : [l, ...ls]; });
          setListModal(null);
          if (settings.gsheetAuto) gsheetSaveList(l);
        }}
        onClose={() => setListModal(null)}
      />}
      {campaignModal && <CampaignModal
        campaign={campaignModal === 'new' ? null : campaignModal}
        lists={lists} contacts={contacts} settings={settings}
        onSave={c => { setCampaigns(cs => { const i = cs.findIndex(x => x.id === c.id); return i >= 0 ? cs.map((x, j) => j === i ? c : x) : [c, ...cs]; }); setCampaignModal(null); }}
        onDelete={id => { setCampaigns(cs => cs.filter(c => c.id !== id)); setCampaignModal(null); }}
        onClose={() => setCampaignModal(null)}
      />}

      {syncModal && <SyncSidebarModal lists={lists} settings={settings} onSync={executeSyncSidebar} onClose={() => setSyncModal(false)} />}

      {/* Context Widget (Phase 3) */}
      <ContextWidget
        activeContact={activeContact}
        contacts={contacts} lists={lists} forms={forms} settings={settings}
        onAdd={handleAddFromContext} onEdit={c => setContactModal(c)}
      />

      {!open && (
        <PresetsWidget
          activeContact={activeContact}
          settings={settings}
        />
      )}
    </div>
  );
}
