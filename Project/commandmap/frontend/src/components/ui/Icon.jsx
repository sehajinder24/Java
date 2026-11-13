const PATHS = {
  cursor: <path d="M6 3l12 7-5.5 1.8L10 18z" />,
  unit: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="1" />
      <path d="M3 7l18 10M3 17L21 7" />
    </>
  ),
  polygon: <path d="M12 3l8 6-3 11H7L4 9z" />,
  circle: <circle cx="12" cy="12" r="8" strokeDasharray="3.5 2.5" />,
  line: (
    <>
      <path d="M5 19L19 5" />
      <circle cx="5" cy="19" r="1.5" />
      <circle cx="19" cy="5" r="1.5" />
    </>
  ),
  arrow: <path d="M5 19L19 5M9 5h10v10" />,
  text: <path d="M5 6h14M12 6v13M9 19h6" />,
  eraser: <path d="M4 16l9-9 6 6-5 5H8zM12 20h8" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-4" />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />,
  load: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  newfile: <path d="M6 3h8l4 4v14H6zM14 3v4h4M12 11v6M9 14h6" />,
  export: <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  trash: <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12l5 5 9-10" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </>
  ),
  folder: <path d="M3 7h6l2 2h10v10H3z" />,
  edit: <path d="M4 20l4-1 11-11-3-3L5 16z" />,
  map: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
