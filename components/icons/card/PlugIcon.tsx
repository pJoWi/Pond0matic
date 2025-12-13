interface PlugIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function PlugIcon({
  className,
  size = 24,
  strokeWidth = 2
}: PlugIconProps) {
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
        d="M8 3v4M16 3v4M7 10h10c1.1 0 2 .9 2 2v3c0 2.8-2.2 5-5 5h-2c-2.8 0-5-2.2-5-5v-3c0-1.1.9-2 2-2zM12 20v2"
      />
    </svg>
  );
}
