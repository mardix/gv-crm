import { useState, useEffect } from 'preact/hooks';
import { Btn } from '../components/Btn';
import { uid } from '../utils/utils';

/* ─── Shared design tokens matching the rest of the app ─── */
const F = 'Inter,system-ui,sans-serif';
const LABEL = { display: 'block', fontFamily: F, fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', paddingBottom: '12px', paddingTop: '8px' };
const INPUT_BASE = { width: '100%', boxSizing: 'border-box', fontFamily: F, fontSize: '13px', color: '#0f172a', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', outline: 'none', transition: 'border-color .15s, box-shadow .15s' };
const onFocus = e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.1)'; };
const onBlur = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };

/* ─── Forms list ─── */
export function FormsView({ forms, editingForm, onEdit, onDelete, onSave, onClose }) {
  if (editingForm) {
    return <FormEditor form={editingForm === 'new' ? null : editingForm} onSave={onSave} onClose={onClose} />;
  }

  if (forms.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '14px' }}>📋</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>No forms yet</div>
        <div style={{ fontSize: '13px', maxWidth: '280px', lineHeight: 1.6, marginBottom: '20px', color: '#64748b' }}>
          Create custom forms to capture lead data and POST it to any webhook or API.
        </div>
        <button onClick={() => onEdit('new')} style={{ padding: '9px 22px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
          + Create First Form
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', fontFamily: F }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {forms.map(f => (
          <div key={f.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{f.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontFamily: '"DM Mono",monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.endpointUrl || '—'}
            </div>
            <div>
              <span style={{ padding: '3px 9px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                {(f.fields || []).length} field{(f.fields || []).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => onEdit(f)} style={{ flex: 1, padding: '8px', background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                Edit
              </button>
              <button onClick={() => onDelete(f.id)} style={{ padding: '8px 12px', background: '#fff', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '8px', fontSize: '12.5px', cursor: 'pointer', fontFamily: F }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Form editor (inline, not a modal) ─── */
function FormEditor({ form, onSave, onClose }) {
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [contentType, setContentType] = useState('json');
  const [fields, setFields] = useState([]);

  useEffect(() => {
    setName(form?.name || '');
    setEndpointUrl(form?.endpointUrl || '');
    setContentType(form?.contentType || 'json');
    setFields(form?.fields || []);
  }, [form?.id]);

  function handleSave() {
    if (!name.trim()) return alert('Form Name is required.');
    if (!endpointUrl.trim()) return alert('Endpoint URL is required.');

    const cleanFields = fields
      .filter(f => String(f.name || '').trim() && String(f.label || '').trim())
      .map(f => ({
        ...f,
        name: String(f.name).trim(),   // keep as entered, only trim spaces
        label: String(f.label).trim()
      }));

    if (cleanFields.length === 0) {
      return alert('Add at least one valid field.');
    }

    onSave({
      id: form?.id || uid(),
      name: name.trim(),
      endpointUrl: endpointUrl.trim(),
      contentType,
      fields: cleanFields
    });
  }

  function addField() {
    setFields(prev => [...prev, { id: uid(), name: '', label: '', type: 'text', value: '', options: '', required: false, autofill: '' }]);
  }

  function updateField(i, k, v) {
    setFields(prev => prev.map((f, j) => j === i ? { ...f, [k]: v } : f));
  }

  function removeField(i) {
    setFields(prev => prev.filter((_, j) => j !== i));
  }

  function moveField(i, dir) {
    setFields(prev => {
      const arr = [...prev];
      const ni = i + dir;
      if (ni < 0 || ni >= arr.length) return arr;
      [arr[i], arr[ni]] = [arr[ni], arr[i]];
      return arr;
    });
  }

  /* Shared styles for field-card inputs */
  const inp = { ...INPUT_BASE };
  const monoInp = { ...INPUT_BASE, fontFamily: '"DM Mono",monospace', color: '#4f46e5' };
  const ARROW_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
  const sel = { ...INPUT_BASE, cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', backgroundImage: ARROW_SVG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '30px' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, fontFamily: F, background: '#f8fafc' }}>

      {/* ── Sub-header: matches app width/height and padding ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '48px',
        background: '#fff', borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px', lineHeight: 1, padding: '4px', display: 'flex', alignItems: 'center' }}>‹</button>
          <div>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              {form ? `Editing: ${form.name}` : 'New Form'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: '7px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Save Form
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' }}>

          {/* Form settings card */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Form Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={LABEL}>Form Name</label>
                <input value={name} onInput={e => setName(e.target.value)} placeholder="E.g. Discovery Call Intake" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={LABEL}>Endpoint URL <span style={{ color: '#94a3b8', fontWeight: 500, textTransform: 'none', fontSize: '10px' }}>(POST)</span></label>
                <input value={endpointUrl} onInput={e => setEndpointUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={LABEL}>Submission Content-Type</label>
                <select value={contentType} onChange={e => setContentType(e.target.value)} style={sel} onFocus={onFocus} onBlur={onBlur}>
                  <option value="json">JSON (application/json)</option>
                  <option value="text">Text (text/plain)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fields card */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>Form Fields</div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>Each field becomes a key in the JSON payload.</div>
              </div>
              <button onClick={addField} style={{ flexShrink: 0, padding: '7px 14px', background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>
                + Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div style={{ padding: '28px 20px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', paddingTop: '20px', paddingBottom: '20px' }}>No fields yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "+ Add Field" to start.</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fields.map((f, i) => (
                <div key={f.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Row 1: Label + Payload Key */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={LABEL}>Display Label</label>
                      <input value={f.label} onInput={e => updateField(i, 'label', e.target.value)} placeholder="E.g. Budget" style={inp} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                      <label style={LABEL}>Payload Key</label>
                      <input value={f.name} onInput={e => updateField(i, 'name', e.target.value)} placeholder="budget" style={monoInp} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>

                  {/* Row 2: Type + Options (if select) + controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '140px' }}>
                      <label style={LABEL}>Type</label>
                      <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} style={sel} onFocus={onFocus} onBlur={onBlur}>
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown</option>
                        <option value="hidden">Hidden Input</option>
                      </select>
                    </div>

                    {f.type === 'hidden' && (
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={LABEL}>Static Value</label>
                        <input value={f.value || ''} onInput={e => updateField(i, 'value', e.target.value)} placeholder="Constant value to send" style={inp} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    )}

                    {f.type === 'select' && (
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={LABEL}>Options <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(comma-separated)</span></label>
                        <input value={f.options || ''} onInput={e => updateField(i, 'options', e.target.value)} placeholder="Option A, Option B" style={inp} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    )}

                    {/* Auto-fill from contact */}
                    <div style={{ minWidth: '160px' }}>
                      <label style={LABEL}>Auto-fill from Contact</label>
                      <select value={f.autofill || ''} onChange={e => updateField(i, 'autofill', e.target.value)} style={sel} onFocus={onFocus} onBlur={onBlur}>
                        <option value="">— None —</option>
                        <option value="name">Contact Name</option>
                        <option value="phone">Phone Number</option>
                        <option value="email">Email</option>
                        <option value="handle">Handle / Username</option>
                        <option value="location">Location</option>
                        <option value="id">Contact ID</option>
                      </select>
                    </div>

                    {/* Spacer so controls go right */}
                    {f.type !== 'select' && f.type !== 'hidden' && <div style={{ flex: 1 }} />}

                    {/* Required + reorder + delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, alignSelf: 'flex-end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                        <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} style={{ width: '13px', height: '13px', accentColor: '#4f46e5', cursor: 'pointer' }} />
                        Required
                      </label>

                      <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[[-1, '↑', i === 0], [1, '↓', i === fields.length - 1]].map(([dir, lbl, dis]) => (
                          <button key={lbl} disabled={dis} onClick={() => moveField(i, dir)} style={{ width: '26px', height: '26px', border: '1px solid #e2e8f0', background: dis ? '#f8fafc' : '#fff', borderRadius: '5px', cursor: dis ? 'default' : 'pointer', color: dis ? '#cbd5e1' : '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            {lbl}
                          </button>
                        ))}
                        <button onClick={() => removeField(i)} style={{ width: '26px', height: '26px', border: 'none', background: '#fee2e2', borderRadius: '5px', cursor: 'pointer', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
