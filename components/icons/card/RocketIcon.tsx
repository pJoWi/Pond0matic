interface RocketIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function RocketIcon({
  className,
  size = 24,
  strokeWidth = 2
}: RocketIconProps) {
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
        d="M12 2c-3 3-5 8-5 12 0 1 1 2 2 2h6c1 0 2-1 2-2 0-4-2-9-5-12z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 16c-2 1-4 3-4 5M14 16c2 1 4 3 4 5"
      />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
