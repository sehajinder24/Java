export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, multiline = false, hint }) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function NumberField({ label, value, onChange, min, max, step = 1, hint }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        className="num"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options, allowEmpty = false, emptyLabel = 'None' }) {
  return (
    <Field label={label}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ColorField({ label, value, onChange, children }) {
  return (
    <Field label={label}>
      <span className="color-row">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#888888'} onChange={(e) => onChange(e.target.value)} />
        <code>{value || 'team colour'}</code>
        {children}
      </span>
    </Field>
  );
}

export function RangeField({ label, value, onChange, min, max, step = 1, suffix = '' }) {
  return (
    <Field label={label}>
      <span className="range-row">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <output>
          {Math.round(value * 100) / 100}
          {suffix}
        </output>
      </span>
    </Field>
  );
}
