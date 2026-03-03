const TruckIcon = ({ size = 20, color = '#2f6f6a' }) => (
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
    <rect x="1" y="6" width="15" height="12"></rect>
    <path d="M16 6h2a2 2 0 0 1 2 2v8"></path>
    <circle cx="5.5" cy="20.5" r="2.5"></circle>
    <circle cx="18.5" cy="20.5" r="2.5"></circle>
  </svg>
);

export default TruckIcon;
