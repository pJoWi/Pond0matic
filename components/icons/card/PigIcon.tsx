interface PigIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function PigIcon({
  className,
  size = 24,
  strokeWidth = 2
}: PigIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      {/* Pig snout */}
      <ellipse
        cx="12"
        cy="12"
        rx="6"
        ry="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Nostrils */}
      <circle cx="10" cy="12" r="1" fill="currentColor" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
      {/* Ears */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9C5 8 4 7 4 6c0-1 1-2 2-2M18 9c1-1 2-2 2-3 0-1-1-2-2-2"
      />
    </svg>
  );
}
