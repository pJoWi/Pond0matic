"use client";
import { useActivity } from "@/contexts/ActivityContext";

export function ActivityTab() {
  const { activities, clear } = useActivity();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Activity</h2>
        <button
          type="button"
          onClick={clear}
          disabled={activities.length === 0}
          className="rounded-lg border border-edge px-3 py-1 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {activities.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-ink-muted">
          Session events show up here.
        </div>
      ) : (
        <ul className="flex max-h-[60vh] flex-col-reverse gap-1 overflow-y-auto rounded-xl border border-edge bg-surface p-3 font-num text-xs leading-relaxed text-ink-muted">
          {activities.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
