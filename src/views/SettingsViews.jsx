import { useState } from 'preact/hooks';
import { Btn } from '../components/Btn';
import { palFor } from '../utils/utils';

function StatusEditor({ title, desc, statusKey, settings, onUpdate }) {
  const statuses = settings[statusKey];
  const [inp, setInp] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const move = (i, dir) => {
    const arr = [...statuses];
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    onUpdate(statusKey, arr);
  };
  return (
    <div style={{ background: '#fff', border: `1.5px solid #e2e1e9`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,.03)', flexShrink: 0 }}>
      {/* ── Panel header — clicking collapses the whole section ── */}
      <div
        onClick={() => setPanelOpen(o => !o)}
        style={{ padding: '24px 28px', background: "#fdfdff", borderBottom: panelOpen ? `1.5px solid #f1f1f7` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: "#1e293b", marginBottom: '6px' }}>{title} <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>({statuses.length})</span></div>
          <div style={{ fontSize: '13px', color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
        </div>
        <span style={{ fontSize: '18px', color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: panelOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}>▾</span>
      </div>
      
      {panelOpen && (
        <>
          <div style={{ padding: '8px 0' }}>
        {statuses.map((st, i) => {
          const [bg, fg] = palFor(st, statuses);
          return (
            <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 28px', borderBottom: i < statuses.length - 1 ? `1px solid #f8f9fb` : 'none' }}>
              <span style={{ color: "#cbd5e1", cursor: 'grab', fontSize: '18px', letterSpacing: '-2px', userSelect: 'none', fontWeight: 800 }}>⋮⋮</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, background: bg, color: fg, minWidth: '100px', justifyContent: 'center', whiteSpace: 'nowrap', border: `1.5px solid ${fg}22` }}>{st}</span>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {i > 0 && <Btn variant="sm" onClick={() => move(i, -1)} style={{ padding: '7px 12px', background: '#f8fafc' }}>↑</Btn>}
                {i > 0 || <div style={{ width: '40px' }}></div>}
                {i < statuses.length - 1 && <Btn variant="sm" onClick={() => move(i, 1)} style={{ padding: '7px 12px', background: '#f8fafc' }}>↓</Btn>}
                {i < statuses.length - 1 || <div style={{ width: '40px' }}></div>}
                <Btn variant="sm" onClick={() => { if (confirm(`Remove "${st}"?`)) onUpdate(statusKey, statuses.filter((_, j) => j !== i)); }} style={{ color: "#ef4444", border: 'none', padding: '7px 12px', background: '#fff1f2' }}>✕</Btn>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '20px 28px', borderTop: `1.5px solid #f1f1f7`, background: "#fcfdff" }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input value={inp} placeholder="Add new status..." onInput={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && inp.trim()) { if (statuses.includes(inp.trim())) { alert('Already exists'); return; } onUpdate(statusKey, [...statuses, inp.trim()]); setInp(''); } }}
            style={{ flex: 1, minWidth: 0, padding: '12px 18px', border: `2px solid #eef0f5`, borderRadius: '12px', fontSize: '14px', color: "#1e293b", outline: 'none', background: '#fff', transition: 'all 0.15s' }}
            onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
            onBlur={e => { e.target.style.borderColor = "#eef0f5"; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={() => { if (!inp.trim()) return; if (statuses.includes(inp.trim())) { alert('Already exists'); return; } onUpdate(statusKey, [...statuses, inp.trim()]); setInp(''); }}
            style={{ flexShrink: 0, padding: '12px 24px', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'filter 0.2s' }}>Add</button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function PresetTextsEditor({ settings, onUpdate }) {
  // Normalize: old plain-string presets migrate to { title, text }
  const presets = (settings.presets || []).map(p => typeof p === 'string' ? { title: '', text: p } : p);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
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
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 18px', border: `2px solid #eef0f5`, borderRadius: '12px', fontSize: '14px', color: "#1e293b", outline: 'none', background: '#fff', transition: 'all 0.15s' };
  const focusStyle = e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; };
  const blurStyle = e => { e.target.style.borderColor = "#eef0f5"; e.target.style.boxShadow = 'none'; };
  return (
    <div style={{ background: '#fff', border: `1.5px solid #e2e1e9`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,.03)', flexShrink: 0 }}>
      {/* ── Panel header — clicking collapses the whole section ── */}
      <div
        onClick={() => setPanelOpen(o => !o)}
        style={{ padding: '24px 28px', background: "#fdfdff", borderBottom: panelOpen ? `1.5px solid #f1f1f7` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: "#1e293b", marginBottom: '4px' }}>
            Preset Texts <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>({presets.length})</span>
          </div>
          <div style={{ fontSize: '13px', color: "#64748b", lineHeight: 1.5 }}>Quick-insert message templates. Supports <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>{'{{name}}'}</code> tokens.</div>
        </div>
        <span style={{ fontSize: '18px', color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: panelOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}>▾</span>
      </div>

      {panelOpen && (
        <>
          {/* ── Preset rows ── */}
          {presets.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              {presets.map((pt, i) => {
                const isExpanded = expandedIdx === i;
                const isEditing = editingIdx === i;
                const label = pt.title || `Preset ${i + 1}`;
                return (
                  <div key={i} style={{ borderBottom: i < presets.length - 1 ? `1px solid #f8f9fb` : 'none' }}>
                    {/* Collapsed header — always visible */}
                    <div
                      onClick={() => { if (!isEditing) { setExpandedIdx(isExpanded ? null : i); } }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 28px', cursor: isEditing ? 'default' : 'pointer', background: isExpanded ? '#fafafe' : 'transparent', transition: 'background 0.15s' }}
                    >
                      <span style={{ color: "#cbd5e1", fontSize: '18px', letterSpacing: '-2px', userSelect: 'none', fontWeight: 800 }}>⋮⋮</span>
                      <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 700, color: pt.title ? '#4f46e5' : '#475569', minWidth: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      {!isEditing && <span style={{ fontSize: '14px', color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}>▾</span>}
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div style={{ padding: '0 28px 16px 56px', marginBottom: '10px' }}>
                        {isEditing ? (
                          /* ── Edit mode ── */
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
                          /* ── View mode ── */
                          <>
                            <br />
                            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #eef0f5', fontSize: '13.5px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '20px' }}>
                              {pt.text}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {i > 0 && <Btn variant="sm" onClick={e => move(i, -1, e)} style={{ padding: '7px 12px', background: '#f8fafc' }}>↑</Btn>}
                              {i < presets.length - 1 && <Btn variant="sm" onClick={e => move(i, 1, e)} style={{ padding: '7px 12px', background: '#f8fafc' }}>↓</Btn>}
                              <Btn variant="sm" onClick={e => { e.stopPropagation(); setEditTitle(pt.title || ''); setEditText(pt.text || ''); setEditingIdx(i); }} style={{ color: '#4f46e5', border: '1.5px solid #e0e7ff', padding: '7px 12px', background: '#f5f3ff' }}>✏️ Edit</Btn>
                              <Btn variant="sm" onClick={e => { e.stopPropagation(); if (confirm('Remove preset?')) { onUpdate('presets', presets.filter((_, j) => j !== i)); setExpandedIdx(null); } }} style={{ color: "#ef4444", border: 'none', padding: '7px 12px', background: '#fff1f2' }}>✕ Remove</Btn>
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

          {/* ── Add new preset form ── */}
          <div style={{ padding: '20px 28px', borderTop: `1.5px solid #f1f1f7`, background: "#fcfdff" }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Add New Preset</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={title} placeholder="Title (e.g. Follow Up, Introduction…)" onInput={e => setTitle(e.target.value)}
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
              />
              <textarea value={text} placeholder="Write the preset message body..." onInput={e => setText(e.target.value)}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { if (!text.trim()) return; onUpdate('presets', [...presets, { title: title.trim(), text: text.trim() }]); setTitle(''); setText(''); }}
                  style={{ padding: '12px 24px', background: "#4f46e5", color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>Add Preset</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsView({ settings, onUpdate, onManualWebhook, onManualGSheetSync, contacts, lists, onImport, onDownloadState, onLoadState }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <StatusEditor title="Contact Statuses" desc="Overall status of a contact — how active or important they are." statusKey="contactStatuses" settings={settings} onUpdate={onUpdate} />
        <StatusEditor title="List Statuses" desc="Per-list status — where a contact is in your outreach or event flow." statusKey="listStatuses" settings={settings} onUpdate={onUpdate} />
        <PresetTextsEditor settings={settings} onUpdate={onUpdate} />
        <IOCard title="Layout & UI" desc="Customize the Google Voice workspace.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: "#1e293b", marginBottom: '6px' }}>Hide GV Right Sidebar</div>
              <div style={{ fontSize: '13px', color: "#64748b", lineHeight: 1.6 }}>Removes the sidebar with dialpad and contacts for a wider workspace.</div>
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
        </IOCard>

        <IOCard title="Campaign Pacing" desc="Configure global randomized delay limits strictly applied to automated messaging to avoid spam flags.">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Minimum Delay (sec)</label>
              <input type="number" min="1" value={settings.delayMin || 15} onInput={e => onUpdate('delayMin', parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #eef0f5`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Maximum Delay (sec)</label>
              <input type="number" min="2" value={settings.delayMax || 45} onInput={e => onUpdate('delayMax', parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #eef0f5`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }} />
            </div>
          </div>
        </IOCard>
        <IOCard title="Webhook Integration" desc="Synchronize your workspace state securely to an external URL. Method is always POST.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Webhook URL</label>
              <input type="text" placeholder="https://external-api.com/webhooks/incoming..." value={settings.webhookUrl || ''} onInput={e => onUpdate('webhookUrl', e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #eef0f5`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                onBlur={e => { e.target.style.borderColor = "#eef0f5"; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Header Secret <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Authorization / x-webhook-secret)</span></label>
              <input type="password" placeholder="Enter optional secure token key" value={settings.webhookSecret || ''} onInput={e => onUpdate('webhookSecret', e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #eef0f5`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                onBlur={e => { e.target.style.borderColor = "#eef0f5"; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', padding: '12px 0 4px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: "#1e293b", marginBottom: '4px' }}>Auto-Sync State</div>
                <div style={{ fontSize: '12.5px', color: "#64748b", lineHeight: 1.5 }}>Automatically shoot the payload via POST whenever any data updates.</div>
              </div>
              <button onClick={() => onUpdate('webhookAuto', !settings.webhookAuto)} style={{
                width: '46px', height: '24px', borderRadius: '12px', background: settings.webhookAuto ? '#4f46e5' : '#e2e8f0',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px', left: settings.webhookAuto ? '25px' : '3px',
                  transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}></div>
              </button>
            </div>
            <div style={{ borderTop: '1.5px solid #f1f1f7', margin: '14px -28px -28px', padding: '24px 28px 24px' }}>
              <button onClick={onManualWebhook} style={{ width: '100%', padding: '14px 0', background: "#0f172a", color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '.3px' }}>
                🚀 Send Payload Manually
              </button>
            </div>
          </div>
        </IOCard>

        <IOCard title="Google Sheets Backend" desc="Synchronize contacts, lists, and memberships directly to a Google Sheet via Apps Script.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: "#475569", marginBottom: '6px' }}>Apps Script Web App URL</label>
              <input type="text" placeholder="https://script.google.com/macros/s/.../exec" value={settings.gsheetUrl || ''} onInput={e => onUpdate('gsheetUrl', e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: `1.5px solid #eef0f5`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}
                onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
                onBlur={e => { e.target.style.borderColor = "#eef0f5"; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: "#1e293b", marginBottom: '4px' }}>Auto-Sync Individual Updates</div>
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
            <div style={{ borderTop: '1.5px solid #f1f1f7', margin: '14px -28px -28px', padding: '24px 28px 24px' }}>
              <button onClick={onManualGSheetSync} style={{ width: '100%', padding: '14px 0', background: "#22c55e", color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '.3px' }}>
                📊 Full Sync to Google Sheets
              </button>
            </div>
          </div>
        </IOCard>
        <IOView contacts={contacts} lists={lists} onImport={onImport} onDownloadState={onDownloadState} onLoadState={onLoadState} />
      </div>
    </div>
  );
}

function IOCard({ title, desc, children }) {
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <div style={{ background: '#fff', border: `1.5px solid #e2e1e9`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,.03)', flexShrink: 0 }}>
      {/* ── Panel header — clicking collapses the whole section ── */}
      <div
        onClick={() => setPanelOpen(o => !o)}
        style={{ padding: '24px 28px', background: "#fdfdff", borderBottom: panelOpen ? `1.5px solid #f1f1f7` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: "#1e293b", marginBottom: '6px' }}>{title}</div>
          <div style={{ fontSize: '13px', color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
        </div>
        <span style={{ fontSize: '18px', color: '#94a3b8', transition: 'transform 0.2s', display: 'inline-block', transform: panelOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}>▾</span>
      </div>
      {panelOpen && (
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>{children}</div>
      )}
    </div>
  );
}

export function IOView({ contacts, lists, onImport, onDownloadState, onLoadState }) {
  const [scope, setScope] = useState('all');
  const [resMsg, setResMsg] = useState(null);
  const [rawText, setRawText] = useState('');
  const [selectedListIds, setSelectedListIds] = useState([]);

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

  const ioCard = (title, desc, children) => <IOCard title={title} desc={desc}>{children}</IOCard>;

  return (
    <>
      {ioCard('💾 State Backup & Restore', 'Download your entire workspace state (contacts, lists, campaigns, settings) as JSON, or restore from a previous backup.', (
        <>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onDownloadState}
              style={{ flex: 1, minWidth: '140px', padding: '14px 0', borderRadius: '10px', border: '1.5px solid #4f46e544', background: '#f5f3ff', color: '#4f46e5', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              ⬇ Download State JSON
            </button>
            <label style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0', borderRadius: '10px', border: '1.5px solid #9333ea44', background: '#faf5ff', color: '#9333ea', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
              ⬆ Load State JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => onLoadState && onLoadState(ev.target.result);
                reader.readAsText(file);
                e.target.value = '';
              }} />
            </label>
          </div>
          <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '13px', color: '#92400e', lineHeight: 1.6, fontWeight: 500 }}>
            ⚠️ <strong>Loading a state JSON will overwrite your current workspace data.</strong> Make sure to download a backup first.
          </div>
        </>
      ))}
      {ioCard('↑ Export Data', 'Download your contacts or a specific list as professional CSV or JSON files.', (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Select data sources</label>
            <select value={scope} onChange={e => setScope(e.target.value)} style={{ display: 'block', width: '100%', padding: '11px 36px 11px 15px', border: `1.5px solid #e2e8f0`, borderRadius: '9px', fontSize: '14px', color: "#0f172a", outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`, transition: 'all 0.15s ease' }}>
              <option value="all">All contacts ({contacts.length})</option>
              {lists.slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric: true})).map(l => <option key={l.id} value={l.id}>{l.name} ({contacts.filter(c => (c.lists || []).some(e => e.listId === l.id)).length})</option>)}
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
        </>
      ))}

      {ioCard('↓ Import Data', 'Upload or paste contacts. If a contact already exists, they will simply be added to the lists you select below.', (
        <>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #eef0f5' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: "#475569", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '12px' }}>
              1. Add to Lists (Optional)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {lists.slice().sort((a,b) => (a.name||'').localeCompare(b.name||'', undefined, {numeric: true})).map(l => {
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
              style={{ width: '100%', minHeight: '120px', padding: '16px', border: '1.5px solid #e2e1e9', borderRadius: '12px', fontSize: '13px', fontFamily: '"DM Mono",monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; }}
              onBlur={e => { e.target.style.borderColor = "#e2e1e9"; e.target.style.boxShadow = 'none'; }}
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
            <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', border: `1.5px solid #e2e8f0`, borderRadius: '12px', background: '#fff', color: "#475569", fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.15s' }}>
              Choose local file…
              <input type="file" accept=".csv,.json,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </label>
          </div>

          {resMsg && <div style={{ padding: '16px 20px', borderRadius: '12px', fontSize: '13.5px', lineHeight: 1.6, fontWeight: 500, background: resMsg.type === 'ok' ? '#ecfdf5' : resMsg.type === 'warn' ? '#fffbeb' : '#fef2f2', color: resMsg.type === 'ok' ? '#065f46' : resMsg.type === 'warn' ? '#92400e' : '#991b1b', border: `1.5px solid ${resMsg.type === 'ok' ? '#34d399' : resMsg.type === 'warn' ? '#fbbf24' : '#f87171'}` }}>{resMsg.text}</div>}
          
          <details style={{ background: '#fdfdff', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #eef0f5' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: "#475569", padding: '16px 20px', userSelect: 'none', fontSize: '13px', background: '#f8fafc' }}>Format Reference</summary>
            <div style={{ padding: '0 20px 20px', background: '#f8fafc' }}>
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>Option A: Just a list of numbers</div>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', border: '1.5px solid #e2e8f0', fontFamily: '"DM Mono",monospace', fontSize: '12px', color: "#0f172a", lineHeight: 1.5, marginBottom: '16px' }}>
                555-123-4567<br/>
                8009991111<br/>
                (415) 555-0000
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>Option B: CSV with full headers</div>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', border: '1.5px solid #e2e8f0', fontFamily: '"DM Mono",monospace', fontSize: '12px', color: "#0f172a", lineHeight: 1.8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                name,phone,email,handle,city,state,location,status,tags,comment<br/>
                John Doe,555-0100,john@example.com,,,CA,,,,
              </div>
            </div>
          </details>
        </>
      ))}
    </>
  );
}
