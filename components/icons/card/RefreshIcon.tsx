interface RefreshIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function RefreshIcon({
  className,
  size = 24,
  strokeWidth = 2
}: RefreshIconProps) {
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
        d="M4 4v6h6M20 20v-6h-6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10c1-4 4.5-7 9-7 5 0 9 4 9 9M20 14c-1 4-4.5 7-9 7-5 0-9-4-9-9"
      />
    </svg>
  );
}
