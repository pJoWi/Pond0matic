interface ChartIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function ChartIcon({
  className,
  size = 24,
  strokeWidth = 2
}: ChartIconProps) {
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
        d="M9 19V11M15 19V7M21 19V3M3 19h18v2H3v-2z"
      />
    </svg>
  );
}
