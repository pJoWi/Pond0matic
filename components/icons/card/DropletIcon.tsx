interface DropletIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function DropletIcon({
  className,
  size = 24,
  strokeWidth = 2
}: DropletIconProps) {
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
        d="M12 3c-3 5-5 8-5 11a5 5 0 0010 0c0-3-2-6-5-11z"
      />
    </svg>
  );
}
