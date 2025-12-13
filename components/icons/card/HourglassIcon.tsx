interface HourglassIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function HourglassIcon({
  className,
  size = 24,
  strokeWidth = 2
}: HourglassIconProps) {
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
        d="M6 2h12v6l-6 4 6 4v6H6v-6l6-4-6-4V2z"
      />
    </svg>
  );
}
