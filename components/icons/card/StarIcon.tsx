interface StarIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function StarIcon({
  className,
  size = 24,
  strokeWidth = 2
}: StarIconProps) {
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
        d="M12 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1 3-7z"
      />
    </svg>
  );
}
