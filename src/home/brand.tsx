/* Brand + icon primitives for the homepage. All vector, no emoji. */

export function Mark({ size = 22 }: { size?: number }) {
  // Stair of three blocks: "build" going up, with a cyan cap.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bb-mark-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="2" y="14" width="8" height="8" rx="1.5" fill="url(#bb-mark-g)" opacity="0.55" />
      <rect x="8" y="8" width="8" height="8" rx="1.5" fill="url(#bb-mark-g)" opacity="0.8" />
      <rect x="14" y="2" width="8" height="8" rx="1.5" fill="url(#bb-mark-g)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="bb-wordmark">
      <Mark />
      <span className="bb-wordmark-text">
        BIT<b>BUILD</b>
      </span>
    </span>
  );
}

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      {on ? (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <>
          <path d="M17 9l5 6" />
          <path d="M22 9l-5 6" />
        </>
      )}
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 8h16" />
          <path d="M4 16h16" />
        </>
      )}
    </svg>
  );
}

/* Pixel: a faceted hex-block mark. Byte: a terminal-bracket mark. Original art. */
export function PixelGlyph({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 6l22 13v26L32 58 10 45V19z" fill="none" stroke="#22d3ee" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M32 6v26m0 0l22-13M32 32L10 19m22 13v26" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.6" />
      <rect x="27" y="27" width="10" height="10" rx="2" fill="#22d3ee" />
    </svg>
  );
}

export function ByteGlyph({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="8" y="8" width="48" height="48" rx="8" fill="none" stroke="#a78bfa" strokeWidth="2.4" />
      <path d="M24 24l-8 8 8 8" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 24l8 8-8 8" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="38" width="4" height="4" fill="#a78bfa" />
    </svg>
  );
}
