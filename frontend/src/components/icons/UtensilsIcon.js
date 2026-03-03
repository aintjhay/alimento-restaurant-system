const UtensilsIcon = ({ size = 20, color = '#2f6f6a' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Fork - Left side */}
    <path d="M3 2v6c0 1.1.9 2 2 2h1v9"></path>
    <path d="M6 2v8"></path>
    <path d="M9 2v6c0 1.1.9 2 2 2h1v9"></path>
    
    {/* Spoon - Right side */}
    <circle cx="17" cy="8" r="3"></circle>
    <path d="M17 11v8"></path>
  </svg>
);

export default UtensilsIcon;
