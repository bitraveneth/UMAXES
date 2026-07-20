/** Geometric statement orbs — each icon a unique color */

type IconProps = { className?: string };

const COLORS = [
  "#F5C518", // gold
  "#2ECC71", // mint
  "#FF5B04", // brand orange
  "#00B4D8", // cyan
  "#FDF6E3", // cream
  "#3D1605", // ink
  "#E05A6A", // berry
  "#3B6FD9", // blue
  "#A3E635", // lime
  "#2F8F7B", // teal
  "#7A3DB8", // grape
  "#FF6B9D", // pink
] as const;

export function IconStarYellow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[0]} />
      <path
        d="M40 18 L44.2 35.8 L62 40 L44.2 44.2 L40 62 L35.8 44.2 L18 40 L35.8 35.8 Z"
        fill="#fff"
      />
    </svg>
  );
}

export function IconAsteriskGreen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[1]} />
      <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
        <path d="M40 20 V60" />
        <path d="M22.7 30 L57.3 50" />
        <path d="M22.7 50 L57.3 30" />
      </g>
    </svg>
  );
}

export function IconRingOrange({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[2]} />
      <circle cx="40" cy="40" r="14" fill="none" stroke="#fff" strokeWidth="7" />
    </svg>
  );
}

export function IconBoltCyan({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[3]} />
      <path d="M44 16 L28 42 H40 L36 64 L54 36 H40 Z" fill="#fff" />
    </svg>
  );
}

export function IconDropletCream({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[4]} />
      <path
        d="M40 18 C40 18 54 36 54 46 A14 14 0 1 1 26 46 C26 36 40 18 40 18 Z"
        fill="#FF5B04"
      />
    </svg>
  );
}

export function IconHexInk({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[5]} />
      <path
        d="M40 18 L56 28 V48 L40 58 L24 48 V28 Z"
        fill="none"
        stroke="#FF5B04"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlusBerry({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[6]} />
      <path
        d="M40 22 V58 M22 40 H58"
        stroke="#fff"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDiamondBlue({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[7]} />
      <path d="M40 20 L58 40 L40 60 L22 40 Z" fill="#fff" />
    </svg>
  );
}

export function IconFlameLime({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[8]} />
      <path
        d="M40 18 C46 28 54 32 54 44 A14 14 0 1 1 26 44 C26 36 32 30 36 26 C34 34 40 34 40 18 Z"
        fill="#fff"
      />
    </svg>
  );
}

export function IconTargetTeal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[9]} />
      <circle cx="40" cy="40" r="18" fill="none" stroke="#fff" strokeWidth="4" />
      <circle cx="40" cy="40" r="7" fill="#fff" />
    </svg>
  );
}

export function IconSparkGrape({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[10]} />
      <path
        d="M40 16 L42.5 34 L60 32 L44 42 L54 58 L40 46 L26 58 L36 42 L20 32 L37.5 34 Z"
        fill="#fff"
      />
    </svg>
  );
}

export function IconLeafPink({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <circle cx="40" cy="40" r="40" fill={COLORS[11]} />
      <path
        d="M28 52 C28 34 44 22 58 22 C58 40 46 54 28 52 Z"
        fill="#fff"
      />
      <path
        d="M34 48 C40 40 48 32 56 26"
        fill="none"
        stroke={COLORS[11]}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Unique icons + unique colors — never share a fill */
export const statementIcons = [
  IconStarYellow,
  IconAsteriskGreen,
  IconRingOrange,
  IconBoltCyan,
  IconDropletCream,
  IconHexInk,
  IconPlusBerry,
  IconDiamondBlue,
  IconFlameLime,
  IconTargetTeal,
  IconSparkGrape,
  IconLeafPink,
] as const;
