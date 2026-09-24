export function BrandLogo({ className, size = 72 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="شعار مكتب الدوسري"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#d4b86e" />
          <stop offset="50%" stopColor="#c4a35a" />
          <stop offset="100%" stopColor="#a8893f" />
        </linearGradient>
      </defs>
      {/* Scale beam */}
      <path
        d="M18 38 H102"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M18 38 C14 34, 14 28, 20 28"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M102 38 C106 34, 106 28, 100 28"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Chains */}
      <path d="M34 38 V52" stroke="url(#goldGrad)" strokeWidth="2" />
      <path d="M86 38 V52" stroke="url(#goldGrad)" strokeWidth="2" />
      {/* Pans */}
      <path
        d="M22 52 Q34 68 46 52"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M74 52 Q86 68 98 52"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Center pillar calligraphy-inspired */}
      <path
        d="M60 28 V78"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="60" cy="88" rx="22" ry="6" fill="url(#goldGrad)" opacity="0.9" />
      <path
        d="M48 72 Q60 62 72 72 Q60 82 48 72Z"
        fill="url(#goldGrad)"
      />
      <circle cx="60" cy="28" r="4" fill="url(#goldGrad)" />
    </svg>
  )
}
