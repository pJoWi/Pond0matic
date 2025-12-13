interface DiamondIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function DiamondIcon({
  className,
  size = 24,
  strokeWidth = 2
}: DiamondIconProps) {
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
        d="M5 9l7 12 7-12M5 9l2-6h10l2 6M5 9h14"
      />
    </svg>
  );
}
