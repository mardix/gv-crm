import { useState } from 'preact/hooks';
import { Btn } from '../components/Btn';
import { palFor } from '../utils/utils';

/* ─── Premium Settings Card Wrapper (Always Open, App-like Aesthetic) ─── */
export function SettingsCard({ title, desc, children, action }) {
  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid #e2e8f0`,
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(15,23,42,0.02)',
      flexShrink: 0
    }}>
      <div style={{
        padding: '20px 24px',
        background: '#fafbfc',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: "#0f172a", marginBottom: '4px', letterSpacing: '-0.2px' }}>{title}</div>
          <div style={{ fontSize: '12.5px', color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>
    </div>
  );
}

/* ─── Refactored Status Editor Component (Always Open) ─── */
function StatusEditor({ title, desc, statusKey, settings, onUpdate }) {
  const statuses = settings[statusKey];
  const [inp, setInp] = useState('');

  const move = (i, dir) => {
    const arr = [...statuses];
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    onUpdate(statusKey, arr);
  };

  return (
    <SettingsCard title={title} desc={desc}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {statuses.map((st, i) => {
          const [bg, fg] = palFor(st, statuses);
          return (
            <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: i < statuses.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
              <span style={{ color: "#cbd5e1", cursor: 'grab', fontSize: '18px', letterSpacing: '-2px', userSelect: 'none', fontWeight: 800 }}>⋮⋮</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 14px', borderRadius: '99px', fontSize: '12.5px', fontWeight: 700, background: bg, color: fg, minWidth: '90px', justifyContent: 'center', whiteSpace: 'nowrap', border: `1px solid ${fg}22` }}>{st}</span>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {i > 0 && <Btn variant="sm" onClick={() => move(i, -1)} style={{ padding: '6px 10px', background: '#f8fafc' }}>↑</Btn>}
                {i > 0 || <div style={{ width: '36px' }}></div>}
                {i < statuses.length - 1 && <Btn variant="sm" onClick={() => move(i, 1)} style={{ padding: '6px 10px', background: '#f8fafc' }}>↓</Btn>}
                {i < statuses.length - 1 || <div style={{ width: '36px' }}></div>}
                <Btn variant="sm" onClick={() => { if (confirm(`Remove "${st}"?`)) onUpdate(statusKey, statuses.filter((_, j) => j !== i)); }} style={{ color: "#ef4444", border: 'none', padding: '6px 10px', background: '#fff1f2' }}>✕</Btn>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '20px 0 0', borderTop: `1.5px solid #f1f5f9` }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input value={inp} placeholder="Add new status..." onInput={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && inp.trim()) { if (statuses.includes(inp.trim())) { alert('Already exists'); return; } onUpdate(statusKey, [...statuses, inp.trim()]); setInp(''); } }}
            style={{ flex: 1, minWidth: 0, padding: '10px 16px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', color: "#1e293b", outline: 'none', background: '#fff', transition: 'all 0.15s' }}
            onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
            onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={() => { if (!inp.trim()) return; if (statuses.includes(inp.trim())) { alert('Already exists'); return; } onUpdate(statusKey, [...statuses, inp.trim()]); setInp(''); }}
            style={{ flexShrink: 0, padding: '10px 20px', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Add</button>
        </div>
      </div>
    </SettingsCard>
  );
}

/* ─── Refactored Preset Texts Editor (Always Open) ─── */
function PresetTextsEditor({ settings, onUpdate }) {
  const presets = (settings.presets || []).map(p => typeof p === 'string' ? { title: '', text: p } : p);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');

  const move = (i, dir, e) => {
    e.stopPropagation();
    const arr = [...presets]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    onUpdate('presets', arr);
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', color: "#1e293b", outline: 'none', background: '#fff', transition: 'all 0.15s' };
  const focusStyle = e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; };
  const blurStyle = e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; };

  return (
    <SettingsCard title="Preset Texts" desc="Quick-insert message templates into chats. Supports {{name}} tokens.">
      {presets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {presets.map((pt, i) => {
            const isExpanded = expandedIdx === i;
            const isEditing = editingIdx === i;
            const label = pt.title || `Preset ${i + 1}`;
            return (
              <div key={i} style={{ borderBottom: i < presets.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
                <div
                  onClick={() => { if (!isEditing) { setExpandedIdx(isExpanded ? null : i); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: isEditing ? 'default' : 'pointer', background: isExpanded ? '#fafbfc' : 'transparent', transition: 'background 0.15s' }}
                >
                  <span style={{ color: "#cbd5e1", fontSize: '18px', letterSpacing: '-2px', userSelect: 'none', fontWeight: 800 }}>⋮⋮</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: pt.title ? '#4f46e5' : '#475569', minWidth: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  {!isEditing && <span style={{ fontSize: '14px', color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}>▾</span>}
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 0 16px 28px', marginBottom: '10px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                          value={editTitle}
                          placeholder="Title (e.g. Follow Up, Introduction…)"
                          onInput={e => setEditTitle(e.target.value)}
                          style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                        />
                        <textarea
                          value={editText}
                          placeholder="Message body..."
                          onInput={e => setEditText(e.target.value)}
                          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                          onFocus={focusStyle} onBlur={blurStyle}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Btn variant="sm" onClick={() => setEditingIdx(null)} style={{ background: '#f8fafc' }}>Cancel</Btn>
                          <button
                            onClick={() => {
                              if (!editText.trim()) return;
                              const updated = presets.map((p, j) => j === i ? { title: editTitle.trim(), text: editText.trim() } : p);
                              onUpdate('presets', updated);
                              setEditingIdx(null);
                            }}
                            style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                          >Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #eef0f5', fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>
                          {pt.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {i > 0 && <Btn variant="sm" onClick={e => move(i, -1, e)} style={{ padding: '6px 10px', background: '#f8fafc' }}>↑</Btn>}
                          {i < presets.length - 1 && <Btn variant="sm" onClick={e => move(i, 1, e)} style={{ padding: '6px 10px', background: '#f8fafc' }}>↓</Btn>}
                          <Btn variant="sm" onClick={e => { e.stopPropagation(); setEditTitle(pt.title || ''); setEditText(pt.text || ''); setEditingIdx(i); }} style={{ color: '#4f46e5', border: '1px solid #e0e7ff', padding: '6px 10px', background: '#f5f3ff' }}>✏️ Edit</Btn>
                          <Btn variant="sm" onClick={e => { e.stopPropagation(); if (confirm('Remove preset?')) { onUpdate('presets', presets.filter((_, j) => j !== i)); setExpandedIdx(null); } }} style={{ color: "#ef4444", border: 'none', padding: '6px 10px', background: '#fff1f2' }}>✕ Remove</Btn>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ padding: '20px 0 0', borderTop: `1.5px solid #f1f5f9` }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Add New Preset</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={title} placeholder="Title (e.g. Follow Up...)" onInput={e => setTitle(e.target.value)}
            style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          <textarea value={text} placeholder="Write the preset message body..." onInput={e => setText(e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} onFocus={focusStyle} onBlur={blurStyle} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { if (!text.trim()) return; onUpdate('presets', [...presets, { title: title.trim(), text: text.trim() }]); setTitle(''); setText(''); }}
              style={{ padding: '10px 20px', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Add Preset</button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

/* ─── Main settings View (Master-Detail tabbed layout) ─── */
export function SettingsView({ settings, onUpdate, onManualGSheetSync, onManualConfigBackup, contacts, lists, onImport, onDownloadState, onLoadState, onGSheetBackup, onGSheetRestore, onSyncSidebar, onDisconnectAndReset }) {
  const [activeTab, setActiveTab] = useState('customization');
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const MENU_ITEMS = [
    { id: 'customization', label: '🎨 Customization', desc: 'CRM Statuses & Preset Texts' },
    { id: 'integrations', label: '🔌 Storage & Sync', desc: 'Select storage mode & sync options' },
    { id: 'data', label: '💾 Data & Backup', desc: 'Cloud snapshots & bulk imports' },
    { id: 'system', label: '⚙ System Settings', desc: 'Delay pacing & layout options' }
  ];

  const sidebarBtnStyle = (isActive) => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: 'none',
    background: isActive ? '#eef2ff' : 'transparent',
    color: isActive ? '#4f46e5' : '#475569',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'Inter,sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    transition: 'all 0.2s ease',
    position: 'relative',
    paddingLeft: isActive ? '18px' : '14px',
  });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#fff', overflow: 'hidden' }}>

      {/* Sidebar navigation panel */}
      <div style={{
        width: '230px',
        flexShrink: 0,
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 14px',
        gap: '8px',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: '8px', marginBottom: '8px' }}>
          Categories
        </div>
        {MENU_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={sidebarBtnStyle(isActive)}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '4px', borderRadius: '0 4px 4px 0', background: '#4f46e5' }} />
              )}
              <span style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.2 }}>{item.label}</span>
              <span style={{ fontSize: '11px', color: isActive ? '#6366f1' : '#94a3b8', fontWeight: 500, lineHeight: 1.2 }}>{item.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Main settings content pane */}
      <div style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '32px 40px 60px',
        boxSizing: 'border-box',
        background: '#fff'
      }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {activeTab === 'customization' && (
            <>
              <StatusEditor title="Contact Statuses" desc="Overall status of a contact — how active or important they are in the CRM." statusKey="contactStatuses" settings={settings} onUpdate={onUpdate} />
              <StatusEditor title="List Statuses" desc="Per-list status — where a contact is in your outreach or event flow." statusKey="listStatuses" settings={settings} onUpdate={onUpdate} />
              <StatusEditor title="Membership Levels" desc="Configure membership tiers for your contacts." statusKey="membershipLevels" settings={settings} onUpdate={onUpdate} />
              <StatusEditor title="Lead Sources" desc="Configure the acquisition channels for your leads." statusKey="leadSources" settings={settings} onUpdate={onUpdate} />
              <StatusEditor title="Categories" desc="Configure categories for high-level grouping of contacts." statusKey="categories" settings={settings} onUpdate={onUpdate} />
              <PresetTextsEditor settings={settings} onUpdate={onUpdate} />
            </>
          )}

          {activeTab === 'integrations' && (
            <>
              <SettingsCard
                title="Data Storage Mode"
                desc="Choose where your primary CRM database is saved and how it is synchronized."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>App / Workspace Name</label>
                    <input type="text" placeholder="GV-CRM" value={settings.appName || ''} onInput={e => onUpdate('appName', e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #cbd5e1`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                      onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                      onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }} />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Option 1: Local */}
                    <div 
                      onClick={() => onUpdate('syncMode', 'local')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${settings.syncMode === 'local' ? '#4f46e5' : '#e2e8f0'}`,
                        background: settings.syncMode === 'local' ? '#f5f3ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>🔒</span>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: settings.syncMode === 'local' ? '#4f46e5' : '#1e293b' }}>Local Storage Only</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                        Save database strictly on this device. Privacy-first & offline.
                      </div>
                    </div>

                    {/* Option 2: GSheet */}
                    <div 
                      onClick={() => onUpdate('syncMode', 'gsheet')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${settings.syncMode === 'gsheet' ? '#4f46e5' : '#e2e8f0'}`,
                        background: settings.syncMode === 'gsheet' ? '#f5f3ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>🔌</span>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: settings.syncMode === 'gsheet' ? '#4f46e5' : '#1e293b' }}>Google Sheets Sync</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                        Sync with Google Sheets Web App. Cross-device and cloud backups.
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsCard>

              {settings.syncMode === 'gsheet' ? (
                <SettingsCard
                  title="GSheet CRM Sync"
                  desc="Synchronize contacts, lists, and memberships directly to a Google Sheet via Apps Script."
                  action={
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: settings.gsheetUrl ? '#dcfce7' : '#fee2e2',
                      color: settings.gsheetUrl ? '#15803d' : '#b91c1c',
                      border: `1px solid ${settings.gsheetUrl ? '#86efac' : '#fecaca'}`
                    }}>
                      {settings.gsheetUrl ? '● Connected' : '○ Unconfigured'}
                    </span>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Apps Script Web App URL</label>
                      <input type="text" placeholder="https://script.google.com/macros/s/.../exec" value={settings.gsheetUrl || ''} onInput={e => onUpdate('gsheetUrl', e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #cbd5e1`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                        onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                        onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: "#1e293b", marginBottom: '4px' }}>Auto-Sync Individual Updates</div>
                        <div style={{ fontSize: '12.5px', color: "#64748b", lineHeight: 1.5 }}>Push contacts and lists to Google Sheets the moment they are saved.</div>
                      </div>
                      <button onClick={() => onUpdate('gsheetAuto', !settings.gsheetAuto)} style={{
                        width: '46px', height: '24px', borderRadius: '12px', background: settings.gsheetAuto ? '#4f46e5' : '#e2e8f0',
                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0
                      }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: '3px', left: settings.gsheetAuto ? '25px' : '3px',
                          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }}></div>
                      </button>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '4px' }}>
                      <button onClick={onManualGSheetSync} style={{ width: '100%', padding: '14px 0', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '.3px' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                        onMouseLeave={e => e.currentTarget.style.opacity = 1}
                      >
                        🔄 Full Sync with Google Sheets
                      </button>
                    </div>
                  </div>
                </SettingsCard>
              ) : (
                <div style={{
                  padding: '28px 24px',
                  borderRadius: '16px',
                  border: '1.5px dashed #cbd5e1',
                  background: '#f8fafc',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔒</span>
                  <div style={{ fontWeight: 700, color: '#475569', marginBottom: '4px', fontSize: '14px' }}>Offline Mode Active</div>
                  <p style={{ fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>
                    Your CRM data is currently stored offline inside your local browser database. Sync features are disabled. Switch to Google Sheets mode to sync data across devices.
                  </p>
                </div>
              )}

              <SettingsCard
                title="⚠️ Danger Zone"
                desc="Completely reset your CRM. This will delete all local contacts, campaigns, custom forms, and reset settings."
              >
                <div style={{ padding: '4px 0' }}>
                  <button 
                    onClick={onDisconnectAndReset}
                    style={{
                      padding: '12px 20px',
                      background: '#fee2e2',
                      color: '#ef4444',
                      border: '1.5px solid #fca5a5',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#fecaca';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fee2e2';
                    }}
                  >
                    🗑️ Disconnect & Reset CRM Database
                  </button>
                </div>
              </SettingsCard>
            </>
          )}

          {activeTab === 'data' && (
            <IOView
              contacts={contacts}
              lists={lists}
              onImport={onImport}
              onDownloadState={onDownloadState}
              onLoadState={onLoadState}
              onGSheetBackup={onGSheetBackup}
              onGSheetRestore={onGSheetRestore}
              onManualConfigBackup={onManualConfigBackup}
              gsheetUrl={settings.gsheetUrl}
              syncMode={settings.syncMode}
            />
          )}

          {activeTab === 'system' && (
            <>
              <SettingsCard title="Layout & UI" desc="Customize the Google Voice workspace appearance.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: "#1e293b", marginBottom: '6px' }}>Hide GV Right Sidebar</div>
                      <div style={{ fontSize: '12.5px', color: "#64748b", lineHeight: 1.6 }}>Removes the default sidebar with dialpad and contacts for a wider workspace.</div>
                    </div>
                    <button onClick={() => onUpdate('hideRightSidebar', !settings.hideRightSidebar)} style={{
                      width: '52px', height: '28px', borderRadius: '14px', background: settings.hideRightSidebar ? '#4f46e5' : '#e2e8f0',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '3px', left: settings.hideRightSidebar ? '27px' : '3px',
                        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: "#1e293b", marginBottom: '6px' }}>Show Conversation Icon in Contacts</div>
                      <div style={{ fontSize: '12.5px', color: "#64748b", lineHeight: 1.6 }}>Display the quick open-conversation bubble next to contact names (only hidden when in Standalone mode).</div>
                    </div>
                    <button onClick={() => onUpdate('showConversationIcon', settings.showConversationIcon !== false ? false : true)} style={{
                      width: '52px', height: '28px', borderRadius: '14px', background: settings.showConversationIcon !== false ? '#4f46e5' : '#e2e8f0',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '3px', left: settings.showConversationIcon !== false ? '27px' : '3px',
                        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard title="Campaign Pacing" desc="Configure global randomized delay limits strictly applied to automated messaging to avoid spam flags.">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Minimum Delay (sec)</label>
                    <input type="number" min="1" value={settings.delayMin || 15} onInput={e => onUpdate('delayMin', parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #cbd5e1`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                      onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                      onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Maximum Delay (sec)</label>
                    <input type="number" min="2" value={settings.delayMax || 45} onInput={e => onUpdate('delayMax', parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #cbd5e1`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                      onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                      onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard title="Sidebar Synchronization" desc="Manually pull and sync contact details from the active Google Voice sidebar conversations roster.">
                <button
                  onClick={onSyncSidebar}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: "#4f46e5",
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                  onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                  ⟳ Sync Contacts from Sidebar
                </button>
              </SettingsCard>

              <SettingsCard title="🔒 Screen Lock & Security" desc="Add passcode protection to lock your CRM workspace screen.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {settings.passcode ? (
                    <>
                      <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛡️</span> Passcode Protection is currently enabled.
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Current Passcode</label>
                        <input type="password" placeholder="Enter current passcode" value={currentPasscode} onInput={e => setCurrentPasscode(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>New Passcode</label>
                          <input type="password" placeholder="New passcode" value={newPasscode} onInput={e => setNewPasscode(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Confirm New Passcode</label>
                          <input type="password" placeholder="Confirm new passcode" value={confirmNewPasscode} onInput={e => setConfirmNewPasscode(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {securityError && <div style={{ fontSize: '12.5px', color: '#ef4444', fontWeight: 600 }}>⚠️ {securityError}</div>}
                      {securitySuccess && <div style={{ fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>✓ {securitySuccess}</div>}

                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <button
                          onClick={() => {
                            setSecurityError('');
                            setSecuritySuccess('');
                            if (currentPasscode !== settings.passcode) {
                              setSecurityError('Current passcode is incorrect.');
                              return;
                            }
                            if (!newPasscode) {
                              setSecurityError('Please enter a new passcode.');
                              return;
                            }
                            if (newPasscode !== confirmNewPasscode) {
                              setSecurityError('New passcodes do not match.');
                              return;
                            }
                            onUpdate('passcode', newPasscode);
                            setCurrentPasscode('');
                            setNewPasscode('');
                            setConfirmNewPasscode('');
                            setSecuritySuccess('Passcode updated successfully.');
                          }}
                          style={{ flex: 1, padding: '11px 0', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Update Passcode
                        </button>
                        <button
                          onClick={() => {
                            setSecurityError('');
                            setSecuritySuccess('');
                            if (currentPasscode !== settings.passcode) {
                              setSecurityError('Current passcode is incorrect to disable.');
                              return;
                            }
                            onUpdate('passcode', '');
                            setCurrentPasscode('');
                            setNewPasscode('');
                            setConfirmNewPasscode('');
                            setSecuritySuccess('Passcode protection disabled.');
                          }}
                          style={{ padding: '11px 16px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Disable Lock
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                        CRM passcode protection is currently disabled. Configure a passcode below to enable it.
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Passcode</label>
                          <input type="password" placeholder="Enter passcode" value={newPasscode} onInput={e => setNewPasscode(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Confirm Passcode</label>
                          <input type="password" placeholder="Confirm passcode" value={confirmNewPasscode} onInput={e => setConfirmNewPasscode(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {securityError && <div style={{ fontSize: '12.5px', color: '#ef4444', fontWeight: 600 }}>⚠️ {securityError}</div>}
                      {securitySuccess && <div style={{ fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>✓ {securitySuccess}</div>}

                      <button
                        onClick={() => {
                          setSecurityError('');
                          setSecuritySuccess('');
                          if (!newPasscode) {
                            setSecurityError('Please enter a passcode.');
                            return;
                          }
                          if (newPasscode !== confirmNewPasscode) {
                            setSecurityError('Passcodes do not match.');
                            return;
                          }
                          onUpdate('passcode', newPasscode);
                          setNewPasscode('');
                          setConfirmNewPasscode('');
                          setSecuritySuccess('Passcode protection enabled successfully.');
                        }}
                        style={{ width: '100%', padding: '11px 0', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', marginTop: '4px' }}
                      >
                        Enable Passcode Protection
                      </button>
                    </>
                  )}
                </div>
              </SettingsCard>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

/* ─── IOView Panel (Import, Export, cloud state backups) ─── */
export function IOView({ contacts, lists, onImport, onDownloadState, onLoadState, onGSheetBackup, onGSheetRestore, onManualConfigBackup, gsheetUrl, syncMode }) {
  const [scope, setScope] = useState('all');
  const [resMsg, setResMsg] = useState(null);
  const [rawText, setRawText] = useState('');
  const [selectedListIds, setSelectedListIds] = useState([]);

  const [gsheetBackupId, setGsheetBackupId] = useState('');
  const [inputSnapshotId, setInputSnapshotId] = useState('');
  const [gsheetBackupLoading, setGsheetBackupLoading] = useState(false);
  const [gsheetRestoreLoading, setGsheetRestoreLoading] = useState(false);
  const [gsheetBackupError, setGsheetBackupError] = useState('');
  const [gsheetRestoreError, setGsheetRestoreError] = useState('');
  const [gsheetCopied, setGsheetCopied] = useState(false);

  const n = scope === 'all' ? contacts.length : contacts.filter(c => (c.lists || []).some(e => e.listId === scope)).length;

  function doExport(fmt) {
    const rows = scope === 'all' ? contacts : contacts.filter(c => (c.lists || []).some(e => e.listId === scope));
    if (!rows.length) { alert('No contacts to export'); return; }
    const name = scope === 'all' ? 'all-contacts' : (lists.find(l => l.id === scope)?.name || 'list').toLowerCase().replace(/\s+/g, '-');
    const fn = `voice-crm-${name}-${new Date().toISOString().slice(0, 10)}`;
    if (fmt === 'json') {
      dlFile(fn + '.json', JSON.stringify(rows.map(c => ({ ...c, lists: (c.lists || []).map(e => { const l = lists.find(l => l.id === e.listId); return l ? { list: l.name, status: e.status } : null; }).filter(Boolean) })), null, 2), 'application/json');
    } else {
      const h = ['name', 'phone', 'email', 'handle', 'city', 'state', 'location', 'status', 'tags', 'comment'];
      dlFile(fn + '.csv', [h.join(','), ...rows.map(c => h.map(k => k === 'tags' ? (c.tags || []).join(';') : c[k] || '').map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n'), 'text/csv');
    }
  }

  function dlFile(fn, content, mime) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = fn; a.click(); URL.revokeObjectURL(a.href);
  }

  function processImport(rows) {
    onImport(rows, r => setResMsg(r), selectedListIds);
  }

  function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'json', 'txt'].includes(ext)) { setResMsg({ type: 'err', text: 'Use CSV, TXT, or JSON files.' }); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = ext === 'json' ? (d => Array.isArray(d) ? d : [d])(JSON.parse(e.target.result)) : parseCSV(e.target.result);
        processImport(rows);
      } catch (err) { setResMsg({ type: 'err', text: 'Parse error: ' + err.message }); }
    };
    reader.readAsText(file);
  }

  function handleRawTextImport() {
    if (!rawText.trim()) { setResMsg({ type: 'err', text: 'Please enter contacts to import.' }); return; }
    try {
      const rows = parseCSV(rawText);
      processImport(rows);
      setRawText('');
    } catch (err) {
      setResMsg({ type: 'err', text: 'Parse error: ' + err.message });
    }
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/); if (lines.length === 0) return [];
    const firstLineFields = parseLine(lines[0]).map(l => l.trim().toLowerCase());
    const knownHeaders = ['name', 'phone', 'email', 'city', 'state', 'status']; // partial check
    const hasHeaders = firstLineFields.some(f => knownHeaders.includes(f));

    let headers;
    let dataLines;

    if (hasHeaders) {
      headers = firstLineFields;
      dataLines = lines.slice(1);
    } else {
      headers = ['phone'];
      dataLines = lines;
    }

    return dataLines.filter(l => l.trim()).map(line => {
      const vals = parseLine(line);
      const obj = {};
      if (!hasHeaders) {
        obj.phone = vals[0] ?? '';
        if (vals[1]) obj.name = vals[1];
      } else {
        headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      }
      return obj;
    });
  }

  function parseLine(line) {
    const r = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; } else if (ch === ',' && !inQ) { r.push(cur); cur = ''; } else cur += ch; }
    r.push(cur); return r;
  }

  return (
    <>
      <SettingsCard title="💾 State Backup" desc={syncMode === 'local' ? "Securely backup your database locally as a JSON file." : "Securely save your entire workspace state to Google Sheets or backup locally as a JSON file."}>
        {syncMode === 'gsheet' && (
          <>
            {!gsheetUrl ? (
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '12.5px', color: '#b91c1c', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                ⚠️ <strong>Google Sheets Integration not configured.</strong> Please set a valid Apps Script URL under the Storage & Sync tab to enable cloud backup snapshots.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 2px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Google Sheets Backup</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    disabled={gsheetBackupLoading}
                    onClick={() => {
                      setGsheetBackupLoading(true);
                      setGsheetBackupError('');
                      setGsheetBackupId('');
                      onGSheetBackup(
                        (id) => {
                          setGsheetBackupLoading(false);
                          setGsheetBackupId(id);
                        },
                        (err) => {
                          setGsheetBackupLoading(false);
                          setGsheetBackupError(err);
                        }
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: '10px',
                      border: 'none',
                      background: gsheetBackupLoading ? '#a7f3d0' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: gsheetBackupLoading ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(16,185,129,0.1)'
                    }}
                  >
                    {gsheetBackupLoading ? '☁ Saving Snapshot to Google Sheets...' : '☁ Backup Full State to Google Sheets'}
                  </button>

                  <button
                    onClick={onManualConfigBackup}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: '10px',
                      border: '1.5px solid #05966933',
                      background: '#f0fdf4',
                      color: '#059669',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(5,150,105,0.04)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e6fbf0';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f0fdf4';
                    }}
                  >
                    ☁ Backup CRM Config (Settings, Campaigns, Forms)
                  </button>

                  {gsheetBackupError && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                      ❌ Backup Failed: {gsheetBackupError}
                    </div>
                  )}

                  {gsheetBackupId && (
                    <div style={{
                      marginTop: '12px',
                      padding: '14px 16px',
                      background: '#f0fdf4',
                      borderRadius: '10px',
                      border: '1.5px dashed #86efac',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '13px', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✅</span> GSheet Backup Successful!
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Snapshot ID:</span>
                        <code style={{ fontSize: '12.5px', color: '#15803d', fontWeight: 700, fontFamily: '"DM Mono",monospace', flex: 1 }}>{gsheetBackupId}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(gsheetBackupId);
                            setGsheetCopied(true);
                            setTimeout(() => setGsheetCopied(false), 2000);
                          }}
                          style={{
                            padding: '4px 10px',
                            background: gsheetCopied ? '#15803d' : '#f0fdf4',
                            color: gsheetCopied ? '#fff' : '#15803d',
                            border: '1px solid #86efac',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {gsheetCopied ? 'Copied! ✓' : 'Copy'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534', opacity: 0.8, lineHeight: 1.4 }}>
                        Write down or copy this ID. You can enter this ID below on any device to restore this exact workspace snapshot.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 10px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Backup</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
          </>
        )}

        <button
          onClick={onDownloadState}
          style={{ width: '100%', padding: '14px 0', borderRadius: '10px', border: '1.5px solid #4f46e544', background: '#f5f3ff', color: '#4f46e5', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          ⬇ Download State JSON
        </button>
      </SettingsCard>

      <SettingsCard title="🔄 State Restore" desc={syncMode === 'local' ? "Restore your workspace state from a local JSON file." : "Restore your workspace state from a Google Sheets snapshot or a local JSON file."}>
        <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '13px', color: '#92400e', lineHeight: 1.6, fontWeight: 500, marginBottom: '16px' }}>
          ⚠️ <strong>Warning: Loading or restoring a state backup will completely overwrite your current local data (contacts, lists, campaigns, forms, settings).</strong> Make sure to download or create a backup first.
        </div>

        {syncMode === 'gsheet' && (
          <>
            {!gsheetUrl ? (
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '12.5px', color: '#b91c1c', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                ⚠️ <strong>Google Sheets Integration not configured.</strong> Please set a valid Apps Script URL under the Storage & Sync tab to enable cloud snapshot restores.
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px' }}>
                  Restore from Google Sheets Snapshot
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Paste Snapshot ID (e.g. APPSTATE-2026-05-31)"
                    value={inputSnapshotId}
                    onInput={e => setInputSnapshotId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: '"DM Mono",monospace',
                      background: '#fff',
                      color: '#0f172a'
                    }}
                    onFocus={e => { e.target.style.borderColor = "#4f46e5"; }}
                    onBlur={e => { e.target.style.borderColor = "#cbd5e1"; }}
                  />
                  <button
                    disabled={gsheetRestoreLoading || !inputSnapshotId.trim()}
                    onClick={() => {
                      setGsheetRestoreLoading(true);
                      setGsheetRestoreError('');
                      onGSheetRestore(
                        inputSnapshotId,
                        () => {
                          setGsheetRestoreLoading(false);
                          setInputSnapshotId('');
                        },
                        (err) => {
                          setGsheetRestoreLoading(false);
                          setGsheetRestoreError(err);
                        }
                      );
                    }}
                    style={{
                      padding: '0 16px',
                      background: (!inputSnapshotId.trim() || gsheetRestoreLoading) ? '#cbd5e1' : '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: (!inputSnapshotId.trim() || gsheetRestoreLoading) ? 'default' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {gsheetRestoreLoading ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
                {gsheetRestoreError && (
                  <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                    ❌ Restore Failed: {gsheetRestoreError}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 10px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Restore</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Restore</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0', borderRadius: '10px', border: '1.5px solid #9333ea44', background: '#faf5ff', color: '#9333ea', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
          ⬆ Load State JSON
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => onLoadState && onLoadState(ev.target.result);
            reader.readAsText(file);
            e.target.value = '';
          }} />
        </label>
      </SettingsCard>

      <SettingsCard title="↑ Export Data" desc="Download your contacts or a specific list as professional CSV or JSON files.">
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Select Data Source</label>
          <select value={scope} onChange={e => setScope(e.target.value)} style={{ display: 'block', width: '100%', padding: '11px 36px 11px 15px', border: `1.5px solid #cbd5e1`, borderRadius: '8px', fontSize: '13.5px', color: "#0f172a", outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`, transition: 'all 0.15s ease' }}>
            <option value="all">All contacts ({contacts.length})</option>
            {lists.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })).map(l => <option key={l.id} value={l.id}>{l.name}{l.status === 'inactive' ? ' (Inactive)' : ''} ({contacts.filter(c => (c.lists || []).some(e => e.listId === l.id)).length})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[['CSV', '#059669', '#ecfdf5'], ['JSON', '#4f46e5', '#f5f3ff']].map(([lbl, fg, bg]) => (
            <button key={lbl} onClick={() => doExport(lbl.toLowerCase())} style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: `1.5px solid ${fg}44`, background: bg, color: fg, fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter,sans-serif' }}>Download {lbl}</button>
          ))}
        </div>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '12.5px', color: "#64748b", margin: 0, fontWeight: 500 }}>{n ? `You are exporting ${n} contact${n !== 1 ? 's' : ''}.` : 'Select a list with contacts to export.'}</p>
        </div>
      </SettingsCard>

      <SettingsCard title="↓ Import Data" desc="Upload or paste contacts. If a contact already exists, they will simply be added to the lists you select below.">
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #eef0f5' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '12px' }}>
            1. Add to Lists (Optional)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lists.filter(l => l.status !== 'inactive').slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })).map(l => {
              const sel = selectedListIds.includes(l.id);
              return (
                <button key={l.id} onClick={() => setSelectedListIds(p => sel ? p.filter(x => x !== l.id) : [...p, l.id])}
                  style={{ padding: '8px 12px', background: sel ? '#4f46e5' : '#fff', color: sel ? '#fff' : '#475569', border: `1px solid ${sel ? '#4f46e5' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  {sel && '✓'} {l.name}
                </button>
              )
            })}
            {lists.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No lists available. Create one in the Lists tab first if you want to assign imported contacts.</span>}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '12px' }}>
            2. Paste Numbers or CSV Data
          </label>
          <textarea
            value={rawText}
            onInput={e => setRawText(e.target.value)}
            placeholder="Paste numbers (one per line) OR full CSV content (phone, name, email, etc) here..."
            style={{ width: '100%', minHeight: '120px', padding: '16px', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '13px', fontFamily: '"DM Mono",monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
            onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={handleRawTextImport} style={{ marginTop: '12px', width: '100%', padding: '14px 0', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            Import Pasted Data
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</div>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed #cbd5e1`, borderRadius: '16px', padding: '48px 32px', textAlign: 'center', background: "#f8fafc", transition: 'all 0.25s ease' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.background = "#f5f3ff"; }}
          onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; handleFile(e.dataTransfer.files[0]); }}>
          <div style={{ fontSize: '48px', lineHeight: 1, opacity: .7, marginBottom: '16px' }}>📂</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: "#1e293b", lineHeight: 1.5, marginBottom: '4px' }}>Drop your file here</div>
          <div style={{ fontSize: '13.5px', color: "#64748b", lineHeight: 1.5, marginBottom: '24px' }}>Supports direct CSV and JSON uploads</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', border: `1.5px solid #cbd5e1`, borderRadius: '12px', background: '#fff', color: "#475569", fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.15s' }}>
            Choose local file…
            <input type="file" accept=".csv,.json,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </label>
        </div>

        {resMsg && <div style={{ padding: '16px 20px', borderRadius: '12px', fontSize: '13.5px', lineHeight: 1.6, fontWeight: 500, background: resMsg.type === 'ok' ? '#ecfdf5' : resMsg.type === 'warn' ? '#fffbeb' : '#fef2f2', color: resMsg.type === 'ok' ? '#065f46' : resMsg.type === 'warn' ? '#92400e' : '#991b1b', border: `1.5px solid ${resMsg.type === 'ok' ? '#34d399' : resMsg.type === 'warn' ? '#fbbf24' : '#f87171'}` }}>{resMsg.text}</div>}

        <details style={{ background: '#fdfdff', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: "#475569", padding: '16px 20px', userSelect: 'none', fontSize: '13px', background: '#f8fafc' }}>Format Reference</summary>
          <div style={{ padding: '0 20px 20px', background: '#f8fafc' }}>
            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>Option A: Just a list of numbers</div>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', border: '1.5px solid #cbd5e1', fontFamily: '"DM Mono",monospace', fontSize: '12px', color: "#0f172a", lineHeight: 1.5, marginBottom: '16px' }}>
              555-123-4567<br />
              8009991111<br />
              (415) 555-0000
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>Option B: CSV with full headers</div>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', border: '1.5px solid #cbd5e1', fontFamily: '"DM Mono",monospace', fontSize: '12px', color: "#0f172a", lineHeight: 1.8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
              name,phone,email,handle,city,state,location,status,tags,comment<br />
              John Doe,555-0100,john@example.com,,,CA,,,,
            </div>
          </div>
        </details>
      </SettingsCard>
    </>
  );
}
