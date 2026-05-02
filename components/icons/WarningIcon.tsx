import React from "react";

interface WarningIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const WarningIcon: React.FC<WarningIconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L2 20h20L12 2z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 8v6M12 16h.01"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default WarningIcon;
