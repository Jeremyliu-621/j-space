import { OUTLINE_COLOR, FURNITURE_TINT, ACCENT } from './palette';

/**
 * SVG office element icons — voxel-style, drawn in the same black-outline-
 * on-flat-color aesthetic as the cursor agent. Designed to scatter along
 * the left, right, and top edges of the intro station.
 *
 * Each icon is a self-contained SVG, sized via the `size` prop.
 */
const stroke = OUTLINE_COLOR;
const sw = 1.4;

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Desk with chair tucked under it. */
export function DeskIcon({ size = 90, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} className={className} style={style}>
      {/* Chair (drawn first, partially behind desk) */}
      <rect x="38" y="48" width="20" height="4" fill={FURNITURE_TINT.chair} stroke={stroke} strokeWidth={sw} />
      <rect x="38" y="52" width="3" height="22" fill={FURNITURE_TINT.chair} stroke={stroke} strokeWidth={sw} />
      <rect x="55" y="52" width="3" height="22" fill={FURNITURE_TINT.chair} stroke={stroke} strokeWidth={sw} />
      <rect x="36" y="36" width="4" height="14" fill={FURNITURE_TINT.chair} stroke={stroke} strokeWidth={sw} />
      {/* Desk top */}
      <rect x="10" y="30" width="80" height="6" fill={FURNITURE_TINT.desk} stroke={stroke} strokeWidth={sw} />
      {/* Desk legs */}
      <rect x="14" y="36" width="4" height="38" fill={FURNITURE_TINT.desk} stroke={stroke} strokeWidth={sw} />
      <rect x="82" y="36" width="4" height="38" fill={FURNITURE_TINT.desk} stroke={stroke} strokeWidth={sw} />
      {/* Monitor on desk */}
      <rect x="22" y="14" width="22" height="14" fill={FURNITURE_TINT.computer} stroke={stroke} strokeWidth={sw} />
      <rect x="30" y="28" width="6" height="2" fill={FURNITURE_TINT.computer} stroke={stroke} strokeWidth={sw} />
      {/* Mug on desk */}
      <rect x="60" y="22" width="8" height="8" fill={ACCENT.rose} stroke={stroke} strokeWidth={sw} />
      <rect x="68" y="24" width="3" height="4" fill={ACCENT.rose} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

/** Standalone computer monitor on a stand. */
export function MonitorIcon({ size = 70, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} style={style}>
      {/* Screen */}
      <rect x="10" y="10" width="60" height="40" fill={FURNITURE_TINT.computer} stroke={stroke} strokeWidth={sw} />
      {/* Screen content (faint pastel block) */}
      <rect x="14" y="14" width="52" height="32" fill={ACCENT.blue} />
      {/* Stand */}
      <rect x="36" y="50" width="8" height="14" fill={FURNITURE_TINT.computer} stroke={stroke} strokeWidth={sw} />
      <rect x="22" y="64" width="36" height="6" fill={FURNITURE_TINT.computer} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

/** Potted plant — leafy, decorative. */
export function PlantIcon({ size = 64, className, style }: IconProps) {
  const leaf = '#6b7d52'; // muted green that reads on our blue-grey panel
  return (
    <svg viewBox="0 0 60 90" width={size * 0.66} height={size} className={className} style={style}>
      {/* Pot */}
      <path
        d="M 16 60 L 18 84 L 42 84 L 44 60 Z"
        fill="#9c7c5e"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Pot rim */}
      <rect x="14" y="58" width="32" height="4" fill="#9c7c5e" stroke={stroke} strokeWidth={sw} />
      {/* Leaves — overlapping rounded shapes */}
      <ellipse cx="30" cy="22" rx="10" ry="14" fill={leaf} stroke={stroke} strokeWidth={sw} />
      <ellipse cx="20" cy="32" rx="9" ry="12" fill={leaf} stroke={stroke} strokeWidth={sw} />
      <ellipse cx="40" cy="32" rx="9" ry="12" fill={leaf} stroke={stroke} strokeWidth={sw} />
      <ellipse cx="30" cy="42" rx="10" ry="13" fill={leaf} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

/** Floor lamp. */
export function LampIcon({ size = 60, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 50 100" width={size * 0.5} height={size} className={className} style={style}>
      {/* Shade — trapezoid */}
      <path
        d="M 12 6 L 38 6 L 32 22 L 18 22 Z"
        fill={FURNITURE_TINT.lamp ?? '#b8a07c'}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Bulb (faint glow patch) */}
      <rect x="22" y="22" width="6" height="3" fill="#fef3c7" />
      {/* Stem */}
      <rect x="24" y="22" width="2" height="62" fill={stroke} />
      {/* Base */}
      <rect x="14" y="84" width="22" height="4" fill={FURNITURE_TINT.lamp ?? '#b8a07c'} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

/** Bookshelf — vertical, narrow. */
export function BookshelfIcon({ size = 90, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 50 110" width={size * 0.45} height={size} className={className} style={style}>
      {/* Frame */}
      <rect x="4" y="4" width="42" height="100" fill={FURNITURE_TINT.bookshelf} stroke={stroke} strokeWidth={sw} />
      {/* Shelves */}
      <rect x="4" y="32" width="42" height="2" fill={stroke} />
      <rect x="4" y="60" width="42" height="2" fill={stroke} />
      <rect x="4" y="88" width="42" height="2" fill={stroke} />
      {/* Books — colorful upright rectangles */}
      <rect x="8" y="10" width="4" height="22" fill={ACCENT.blue} stroke={stroke} strokeWidth="0.8" />
      <rect x="13" y="10" width="3" height="22" fill={ACCENT.taupe} stroke={stroke} strokeWidth="0.8" />
      <rect x="17" y="14" width="4" height="18" fill={ACCENT.rose} stroke={stroke} strokeWidth="0.8" />
      <rect x="22" y="10" width="3" height="22" fill={ACCENT.sage} stroke={stroke} strokeWidth="0.8" />
      <rect x="26" y="12" width="3" height="20" fill={ACCENT.blue} stroke={stroke} strokeWidth="0.8" />
      <rect x="30" y="10" width="4" height="22" fill={ACCENT.taupe} stroke={stroke} strokeWidth="0.8" />
      <rect x="35" y="14" width="3" height="18" fill={ACCENT.rose} stroke={stroke} strokeWidth="0.8" />
      {/* Second shelf books */}
      <rect x="8" y="38" width="4" height="22" fill={ACCENT.sage} stroke={stroke} strokeWidth="0.8" />
      <rect x="13" y="38" width="3" height="22" fill={ACCENT.blue} stroke={stroke} strokeWidth="0.8" />
      <rect x="17" y="42" width="4" height="18" fill={ACCENT.taupe} stroke={stroke} strokeWidth="0.8" />
      <rect x="22" y="38" width="3" height="22" fill={ACCENT.rose} stroke={stroke} strokeWidth="0.8" />
      <rect x="26" y="40" width="4" height="20" fill={ACCENT.sage} stroke={stroke} strokeWidth="0.8" />
      <rect x="31" y="38" width="3" height="22" fill={ACCENT.blue} stroke={stroke} strokeWidth="0.8" />
      {/* Third shelf — a small object (like a globe) */}
      <circle cx="20" cy="78" r="6" fill={ACCENT.blue} stroke={stroke} strokeWidth={sw} />
      <rect x="30" y="68" width="10" height="18" fill={ACCENT.taupe} stroke={stroke} strokeWidth="0.8" />
    </svg>
  );
}

/** Coffee mug + saucer. */
export function CoffeeIcon({ size = 50, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * 0.83} className={className} style={style}>
      {/* Saucer */}
      <ellipse cx="30" cy="42" rx="22" ry="4" fill="#fff" stroke={stroke} strokeWidth={sw} />
      {/* Mug */}
      <rect x="16" y="14" width="22" height="26" fill="#fff" stroke={stroke} strokeWidth={sw} />
      {/* Handle */}
      <path
        d="M 38 18 Q 50 18, 50 26 Q 50 34, 38 34"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Coffee surface */}
      <ellipse cx="27" cy="14" rx="11" ry="2.5" fill="#5d3a24" stroke={stroke} strokeWidth={sw} />
      {/* Steam wisps */}
      <path d="M 22 8 Q 24 4, 22 0" fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
      <path d="M 28 8 Q 30 4, 28 0" fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
      <path d="M 34 8 Q 36 4, 34 0" fill="none" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
    </svg>
  );
}

/**
 * Composite — scatters all the office icons around the page edges.
 * Positioning is absolute relative to the parent station, so this
 * decorates the gutters around the central intro panel.
 */
export default function OfficeElements() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* TOP-LEFT: lamp */}
      <div style={{ position: 'absolute', top: 28, left: 56 }}>
        <LampIcon size={68} />
      </div>

      {/* TOP-CENTER (just above panel): coffee mug */}
      <div style={{ position: 'absolute', top: 42, left: '50%', transform: 'translateX(-180px)' }}>
        <CoffeeIcon size={42} />
      </div>

      {/* TOP-RIGHT: monitor */}
      <div style={{ position: 'absolute', top: 36, right: 80 }}>
        <MonitorIcon size={66} />
      </div>

      {/* LEFT: desk with chair (mid) */}
      <div style={{ position: 'absolute', top: '40%', left: 30 }}>
        <DeskIcon size={120} />
      </div>

      {/* LEFT-BOTTOM: plant */}
      <div style={{ position: 'absolute', bottom: 36, left: 70 }}>
        <PlantIcon size={70} />
      </div>

      {/* RIGHT: bookshelf */}
      <div style={{ position: 'absolute', top: '32%', right: 36 }}>
        <BookshelfIcon size={110} />
      </div>

      {/* RIGHT-BOTTOM: another small plant */}
      <div style={{ position: 'absolute', bottom: 32, right: 90 }}>
        <PlantIcon size={56} />
      </div>
    </div>
  );
}
