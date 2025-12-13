interface SolanaIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function SolanaIcon({
  className,
  size = 24,
  strokeWidth = 2
}: SolanaIconProps) {
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
      {/* Solana-inspired gradient circle */}
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10l4-2 4 2M8 14l4 2 4-2"
      />
    </svg>
  );
}
