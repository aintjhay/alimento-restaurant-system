const UtensilsIcon = ({ size = 20, color = '#2f6f6a', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke={color}
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {/* A balanced restaurant-place-setting fork. */}
    <path d="M11 7v11" />
    <path d="M16 7v11" />
    <path d="M21 7v11" />
    <path d="M11 18c0 4 2.1 6 5 6s5-2 5-6" />
    <path d="M16 24v17" />

    {/* Spoon with a softly tapered neck and rounded bowl. */}
    <ellipse cx="34" cy="15" rx="6" ry="8" />
    <path d="M34 23v18" />
  </svg>
);

export default UtensilsIcon;
