export default function Logo() {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 120 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="acvLogoGrad" x1="6" y1="8" x2="110" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b9dff" />
          <stop offset="1" stopColor="#3fe0cf" />
        </linearGradient>
      </defs>
      <path d="M60 8 L10 104 L54 104 Z" fill="url(#acvLogoGrad)" />
      <path d="M64 44 L80 44 L98 104 L82 104 Z" fill="url(#acvLogoGrad)" />
    </svg>
  )
}
