import { useState, useRef } from 'preact/hooks';
import { Modal, Field } from './LayoutComponents';
import { Btn } from './Btn';
import { Input, Textarea, Select } from './FormComponents';
import { uid, campaignPhones, palFor } from '../utils/utils';

export function ListModal({ list, onSave, onClose }) {
  const isNew = !list;
  const [name, setName] = useState(list?.name || '');
  const [desc, setDesc] = useState(list?.description || '');
  const [status, setStatus] = useState(list?.status || 'active');

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const footer = (
    <>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={() => {
        if (!name.trim()) { alert('Name required'); return; }
        onSave({
          ...(list || {}),
          id: list?.id || uid(),
          name,
          description: desc,
          status,
          createdAt: list?.createdAt || new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        });
      }}>
        {isNew ? 'Create List' : 'Save'}
      </Btn>
    </>
  );

  return (
    <Modal title={isNew ? 'New List' : 'Edit List'} onClose={onClose} footer={footer}>
      <Field label="List Name">
        <Input value={name} onInput={e => setName(e.target.value)} placeholder="e.g. Summer Event 2025" />
      </Field>
      <Field label="Description">
        <Textarea value={desc} onInput={e => setDesc(e.target.value)} placeholder="What is this list for?" />
      </Field>

      <Field label="List Status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
            style={{
              position: 'relative',
              width: '46px',
              height: '24px',
              borderRadius: '99px',
              background: status === 'active' ? '#10b981' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
              outline: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: status === 'active' ? 'translateX(24px)' : 'translateX(4px)'
              }}
            />
          </button>
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: status === 'active' ? '#10b981' : '#64748b' }}>
            {status === 'active' ? '✓ Active' : '✕ Inactive'}
          </span>
        </div>
      </Field>

      {!isNew && (
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Created At</div>
            <div style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: 500 }}>{formatDate(list?.createdAt)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Last Modified</div>
            <div style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: 500 }}>{formatDate(list?.modifiedAt)}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function renderMessageWithHighlightedTokens(message) {
  if (!message) return null;
  const parts = message.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      return (
        <span
          key={index}
          style={{
            background: '#eef2ff',
            color: '#4338ca',
            border: '1.5px solid #c7d2fe',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            display: 'inline-block',
            margin: '0 2px',
            verticalAlign: 'middle'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function CampaignModal({ campaign, lists, settings, contacts, forms = [], onSave, onDelete, onClose }) {
  const isNew = !campaign;
  const [data, setData] = useState(() => {
    const base = campaign ? JSON.parse(JSON.stringify(campaign)) : {};
    return {
      id: uid(),
      name: '',
      listIds: [],
      type: 'sms',
      formId: '',
      message: '',
      imageDataUrl: '',
      delayMin: 20,
      delayMax: 60,
      status: 'draft',
      log: [],
      createdAt: Date.now(),
      ...base
    };
  });

  // Normalize older campaign data if it was using string IDs
  const normalizedSelections = (data.listIds || []).map(entry => (typeof entry === 'string' ? { listId: entry, status: '' } : entry));

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const phones = campaignPhones(normalizedSelections, contacts);
  const fileRef = useRef();

  const handleToggleList = (listId) => {
    const isSelected = normalizedSelections.some(s => s.listId === listId);
    if (isSelected) {
      set('listIds', normalizedSelections.filter(s => s.listId !== listId));
    } else {
      set('listIds', [...normalizedSelections, { listId, status: '' }]);
    }
  };

  const handleChangeStatus = (listId, status) => {
    set('listIds', normalizedSelections.map(s => s.listId === listId ? { ...s, status } : s));
  };

  const footer = (
    <>
      {!isNew && <Btn variant="danger" onClick={() => { if (confirm('Delete this campaign?')) onDelete(data.id); }}>Delete</Btn>}
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={() => {
        if (!data.name.trim()) { alert('Name required'); return; }
        if (data.type === 'form' && !data.formId) { alert('Please select a target form'); return; }
        onSave(data);
      }}>
        {isNew ? 'Create Campaign' : 'Save Changes'}
      </Btn>
    </>
  );

  return (
    <Modal title={isNew ? 'New Campaign' : 'Edit Campaign'} onClose={onClose} footer={footer}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '4px' }}>
        <Field label="Campaign Name">
          <Input value={data.name} onInput={e => set('name', e.target.value)} placeholder="e.g. Summer Reminder" />
        </Field>

        <Field label="Campaign Type">
          <Select
            value={data.type || 'sms'}
            onChange={e => set('type', e.target.value)}
            style={{ padding: '11px 36px 11px 14px' }}
          >
            <option value="sms">💬 SMS / MMS Broadcast</option>
            <option value="form">📋 Form Synchronization</option>
          </Select>
        </Field>
      </div>

      {data.type === 'form' && (
        <Field label="Target Form">
          {forms.length === 0 ? (
            <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
              No custom forms created yet. Go to the Forms tab to create one first.
            </div>
          ) : (
            <Select
              value={data.formId}
              onChange={e => set('formId', e.target.value)}
              style={{ padding: '11px 36px 11px 14px' }}
            >
              <option value="">— Select a Custom Form —</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <Field label={<span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Message Template</span> <span style={{ fontWeight: 700, fontSize: '11px', color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: '4px' }}>{(data.message || '').length} chars</span></span>}>
        <Textarea
          id="campaign-message-textarea"
          value={data.message}
          onInput={e => set('message', e.target.value)}
          placeholder={data.type === 'form' ? 'Type the message payload to submit...' : 'Type your SMS message here...'}
          style={{ minHeight: '100px' }}
        />
        <div style={{ paddingTop: '10px', paddingBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.6px', marginRight: '2px' }}>Insert:</span>
          {[
            { token: '{{name}}', label: '👤 name' },
            { token: '{{email}}', label: '✉️ email' },
            { token: '{{phone}}', label: '📞 phone' },
            { token: '{{handle}}', label: '🔖 handle' },
            { token: '{{contactId}}', label: 'ID contactId' },
            { token: '{{status}}', label: 'Status' },
            { token: '{{leadSource}}', label: 'Lead source' },
            { token: '{{category}}', label: 'Category' },
            { token: '{{membershipLevel}}', label: 'Membership' },
          ].map(({ token, label }) => (
            <button
              key={token}
              type="button"
              onClick={() => {
                const el = document.getElementById('campaign-message-textarea');
                if (el) {
                  const start = el.selectionStart ?? (data.message || '').length;
                  const end = el.selectionEnd ?? start;
                  const msg = data.message || '';
                  set('message', msg.slice(0, start) + token + msg.slice(end));
                  setTimeout(() => { el.selectionStart = el.selectionEnd = start + token.length; el.focus(); }, 0);
                } else {
                  set('message', (data.message || '') + token);
                }
              }}
              style={{
                padding: '4px 11px', borderRadius: '99px', border: '1.5px solid #cbd5e1',
                background: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#f5f3ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#ffffff'; }}
            >{label}</button>
          ))}
        </div>

        {/* Real-time highlighted message template preview */}
        {data.message && (
          <div style={{ marginTop: '4px', padding: '12px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Live Template Preview</div>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {renderMessageWithHighlightedTokens(data.message)}
            </div>
          </div>
        )}
      </Field>

      <Field label={data.type === 'form' ? 'Payload Attachment' : 'Attach Image (MMS)'}>
        {data.imageDataUrl && <div style={{ position: 'relative', marginBottom: '8px' }}>
          <img src={data.imageDataUrl} style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', border: `1.5px solid #e2e8f0` }} />
          <button onClick={() => set('imageDataUrl', '')} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(15,23,42,.7)', color: '#fff', border: 'none', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>✕ Remove</button>
        </div>}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
          const f = e.target.files[0]; if (!f) return;
          const r = new FileReader(); r.onload = ev => set('imageDataUrl', ev.target.result); r.readAsDataURL(f);
        }} />
        <button onClick={() => fileRef.current.click()} style={{ display: 'block', width: '100%', padding: '10px', border: `1.5px dashed #cbd5e1`, borderRadius: '8px', background: "#f8fafc", color: "#64748b", fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}>📎 Choose image…</button>
      </Field>

      <Field label="Target Contacts by List & Status">
        {!lists.length
          ? <p style={{ color: "#94a3b8", fontSize: '13px' }}>No lists yet — create lists first.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {lists.filter(l => l.status !== 'inactive' || normalizedSelections.some(s => s.listId === l.id)).slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true})).map(list => {
              const selection = normalizedSelections.find(s => s.listId === list.id);
              const sel = !!selection;
              const pc = campaignPhones([selection || list.id], contacts).length;

              return (
                <div key={list.id} style={{ display: 'flex', flexDirection: 'column', border: `1.5px solid ${sel ? "#4f46e5" : "#e2e8f0"}`, borderRadius: '10px', overflow: 'hidden', background: sel ? "#f5f3ff" : '#fff', transition: 'all 0.15s ease', boxShadow: sel ? '0 2px 8px rgba(79,70,229,0.04)' : 'none' }}>
                  <div onClick={() => handleToggleList(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', cursor: 'pointer', flex: 1, boxSizing: 'border-box', width: '100%' }}>
                    <input type="checkbox" checked={sel} onChange={() => handleToggleList(list.id)} onClick={e => e.stopPropagation()} style={{ width: '18px', height: '18px', accentColor: "#4f46e5", cursor: 'pointer', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: list.status === 'inactive' ? "#64748b" : "#0f172a", lineHeight: '1.3', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {list.name}
                        {list.status === 'inactive' && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Inactive</span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: '#e0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '4px' }}>
                        {pc} contact{pc !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {sel && (
                    <div style={{ padding: '0 18px 14px 50px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '.8px' }}>Only include contacts with status:</div>
                      <Select
                        value={selection.status}
                        onChange={e => handleChangeStatus(list.id, e.target.value)}
                        style={{ padding: '8px 12px', fontSize: '12.5px', background: '#fff' }}
                      >
                        <option value="">— All Contacts in List —</option>
                        {settings.listStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        }
        <div style={{ fontSize: '12.5px', color: "#64748b", paddingTop: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>ℹ️</span>
          <span>{phones.length ? `Matches ${phones.length} unique phone number${phones.length !== 1 ? 's' : ''} for execution.` : 'No active phone numbers targeted.'}</span>
        </div>
      </Field>
    </Modal>
  );
}

export function SyncSidebarModal({ lists, settings, onSync, onClose }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggle = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const footer = (
    <>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" onClick={() => onSync(selectedIds)}>
        Import Contacts
      </Btn>
    </>
  );

  return (
    <Modal title="Sync from GV Sidebar" onClose={onClose} footer={footer}>
      <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '20px', lineHeight: '1.6' }}>
        This will scan Google Voice's sidebar for phone number contacts and import any that are not already in your CRM.
      </p>

      <Field label="Add imported contacts to lists (optional)">
        {!lists.length ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No lists yet — you can create lists in the Lists tab.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lists.filter(l => l.status !== 'inactive').slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric:true})).map(list => {
              const sel = selectedIds.includes(list.id);
              return (
                <div
                  key={list.id}
                  onClick={() => toggle(list.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    padding: '14px 16px', boxSizing: 'border-box', width: '100%',
                    border: `1.5px solid ${sel ? '#4f46e5' : '#e2e8f0'}`,
                    borderRadius: '10px', background: sel ? '#f5f3ff' : '#fafafa',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggle(list.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '17px', height: '17px', marginTop: '2px', accentColor: '#4f46e5', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', lineHeight: '1.3', wordBreak: 'break-word' }}>{list.name}</div>
                    {list.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4', wordBreak: 'break-word' }}>{list.description}</div>}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                      Initial status: <strong>{settings.listStatuses[0] || '—'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
          Leave unchecked to import contacts without any list assignment.
        </p>
      </Field>
    </Modal>
  );
}

export function DisconnectModal({ settings, onConfirm, onClose }) {
  const [downloadBackup, setDownloadBackup] = useState(true);
  const isGSheetAvailable = settings.syncMode === 'gsheet' && settings.gsheetUrl;
  const [syncToGSheet, setSyncToGSheet] = useState(isGSheetAvailable);

  const footer = (
    <>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="danger" onClick={() => onConfirm({ downloadBackup, syncToGSheet })}>
        Confirm Reset
      </Btn>
    </>
  );

  return (
    <Modal title="⚠️ Disconnect & Reset Database" onClose={onClose} footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13.5px', color: '#ef4444', fontWeight: 600, margin: '0 0 4px 0', lineHeight: '1.5' }}>
          Warning: You are about to disconnect and completely reset your CRM database.
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
          This will permanently delete all locally stored contacts, campaigns, custom forms, and reset settings to defaults.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {/* Checkbox 1: Download Local Backup */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={downloadBackup}
              onChange={e => setDownloadBackup(e.target.checked)}
              style={{ width: '17px', height: '17px', marginTop: '2px', accentColor: '#4f46e5' }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>Download Local JSON Backup</span>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0', lineHeight: '1.4' }}>
                Download a local backup of your contacts, lists, campaigns, and configuration.
              </p>
            </div>
          </label>

          {/* Checkbox 2: Create GSheet Snapshots (if available) */}
          {isGSheetAvailable ? (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={syncToGSheet}
                onChange={e => setSyncToGSheet(e.target.checked)}
                style={{ width: '17px', height: '17px', marginTop: '2px', accentColor: '#4f46e5' }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>Backup Snapshots to Google Sheets</span>
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0', lineHeight: '1.4' }}>
                  Create automatic App State & CRM Config snapshots on your Google Sheet before resetting.
                </p>
              </div>
            </label>
          ) : (
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px', opacity: 0.6 }}>
              <input type="checkbox" disabled style={{ width: '17px', height: '17px', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#94a3b8' }}>Backup Snapshots to Google Sheets (Unavailable)</span>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0 0', lineHeight: '1.4' }}>
                  Only available when connected to a Google Sheets Apps Script URL.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

