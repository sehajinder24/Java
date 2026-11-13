import { useEffect, useRef, useState } from 'react';

/** Button that opens a menu. `trigger` and `children` receive {open, close}. */
export default function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const api = { open, close: () => setOpen(false) };
  return (
    <div className="dropdown" ref={ref}>
      <span onClick={() => setOpen((o) => !o)}>{trigger(api)}</span>
      {open && <div className={`dropdown-menu ${align}`}>{children(api)}</div>}
    </div>
  );
}
