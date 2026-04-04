import { useState } from 'preact/hooks';

export function Input({ value, onInput, type = 'text', placeholder = '', style: s = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onInput={onInput} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        display: 'block', width: '100%', background: '#fff',
        border: `1.5px solid ${focus ? "#4f46e5" : "#e2e8f0"}`,
        boxShadow: focus ? '0 0 0 3px rgba(79,70,229,.1)' : 'none',
        borderRadius: '9px', padding: '11px 14px', color: "#0f172a",
        fontSize: '14px', outline: 'none', lineHeight: 'normal',
        WebkitAppearance: 'none', transition: 'all .15s ease', ...s,
      }}
    />
  );
}

export function Textarea({ value, onInput, placeholder = '', style: s = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value} placeholder={placeholder}
      onInput={onInput} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        display: 'block', width: '100%', background: '#fff',
        border: `1.5px solid ${focus ? "#4f46e5" : "#e2e8f0"}`,
        boxShadow: focus ? '0 0 0 3px rgba(79,70,229,.1)' : 'none',
        borderRadius: '9px', padding: '11px 14px', color: "#0f172a",
        fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '100px',
        lineHeight: 1.6, fontFamily: 'Inter,sans-serif', transition: 'all .15s ease', ...s,
      }}
    />
  );
}

export function Select({ value, onChange, children, style: s = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        display: 'block', width: '100%', background: '#fff',
        border: `1.5px solid ${focus ? "#4f46e5" : "#e2e8f0"}`,
        boxShadow: focus ? '0 0 0 3px rgba(79,70,229,.1)' : 'none',
        borderRadius: '9px', padding: '11px 36px 11px 14px', color: "#0f172a",
        fontSize: '14px', outline: 'none', cursor: 'pointer',
        WebkitAppearance: 'none', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', transition: 'all .15s ease', ...s,
      }}
    >{children}</select>
  );
}
