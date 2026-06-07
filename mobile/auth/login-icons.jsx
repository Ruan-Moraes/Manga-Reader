// login-icons.jsx — Lucide-style outline icons (2px, currentColor) + brand glyphs
// Exports to window: MRIcon

function MRIcon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style = {} }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  };
  switch (name) {
    case 'mail':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M2 7l10 6 10-6"></path>
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2"></rect>
          <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      );
    case 'eye-off':
      return (
        <svg {...common}>
          <path d="M10.7 6.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7"></path>
          <path d="M6.1 6.1C3.4 7.8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9"></path>
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
          <path d="M3 3l18 18"></path>
        </svg>
      );
    case 'face-id':
      return (
        <svg {...common}>
          <path d="M4 8V6a2 2 0 0 1 2-2h2"></path>
          <path d="M16 4h2a2 2 0 0 1 2 2v2"></path>
          <path d="M20 16v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M8 20H6a2 2 0 0 1-2-2v-2"></path>
          <path d="M9 9v1"></path>
          <path d="M15 9v1"></path>
          <path d="M12 9v3l-1 1"></path>
          <path d="M9 15a3.5 3.5 0 0 0 6 0"></path>
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5"></path>
          <path d="m12 19-7-7 7-7"></path>
        </svg>
      );
    case 'send':
      return (
        <svg {...common}>
          <path d="M22 2 11 13"></path>
          <path d="M22 2 15 22l-4-9-9-4 20-7Z"></path>
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14"></path>
          <path d="m13 5 7 7-7 7"></path>
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
      );
    case 'google':
      // brand glyph — keeps its own colors (ignores `color`)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" fill="#4285F4"></path>
          <path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853"></path>
          <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" fill="#FBBC05"></path>
          <path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 6.1 12 6.1Z" fill="#EA4335"></path>
        </svg>
      );
    case 'apple':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
          <path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8Z"></path>
          <path d="M14.2 5.9c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.3Z"></path>
        </svg>
      );
    default:
      return null;
  }
}

window.MRIcon = MRIcon;
