interface MoneyIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function MoneyIcon({
  className,
  size = 24,
  strokeWidth = 2
}: MoneyIconProps) {
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
        d="M12 2c-5.5 0-10 3.6-10 8 0 2.4 1.3 4.5 3.4 6l1.6 4c0.4 1 1.5 1.5 2.5 1s1.5-1.5 1-2.5l-1-2.5c1-0.3 2-0.5 3-0.5s2 0.2 3 0.5l-1 2.5c-0.4 1 0 2 1 2.5s2 0 2.5-1l1.6-4c2.1-1.5 3.4-3.6 3.4-6 0-4.4-4.5-8-10-8z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v2m0 4v2m2-5h-4m4 3h-4"
      />
    </svg>
  );
}
