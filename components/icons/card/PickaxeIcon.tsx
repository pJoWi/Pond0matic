interface PickaxeIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function PickaxeIcon({
  className,
  size = 24,
  strokeWidth = 2
}: PickaxeIconProps) {
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
        d="M14 6l4-2 2 2-2 4-4-4zM6 14l-2 4 2 2 4-2-4-4zM14 6l-8 8M18 10l-8 8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 22l4-4M22 2l-4 4"
      />
    </svg>
  );
}
