"use client";
import { useActivity } from "@/contexts/ActivityContext";

export function MiniFeed() {
  const { activities } = useActivity();
  const recent = activities.slice(-4).reverse();
  if (recent.length === 0) return null;
  return (
    <div className="border-t border-edge pt-2">
      <ul className="flex flex-col gap-0.5 text-[10px] leading-relaxed text-ink-muted">
        {recent.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`} className="truncate font-num">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
