interface WaterIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function WaterIcon({
  className,
  size = 24,
  strokeWidth = 2
}: WaterIconProps) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9c0-3 3-6 6-6s6 3 6 6c0 5-6 11-6 11S6 14 6 9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 13c1 1 2 1 3 1s2 0 3-1"
      />
    </svg>
  );
}
