interface ScrollIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function ScrollIcon({
  className,
  size = 24,
  strokeWidth = 2
}: ScrollIconProps) {
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
        d="M7 3h10c1 0 2 1 2 2v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V5c0-1 1-2 2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8h6M9 12h6M9 16h4"
      />
    </svg>
  );
}
