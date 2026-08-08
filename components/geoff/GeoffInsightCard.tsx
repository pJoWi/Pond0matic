"use client";
import { cn } from "@/lib/utils";
import type { GeoffInsightState } from "@/hooks/useGeoffInsight";
import type { InsightStatus } from "@/lib/geoff/types";

const STATUS_BORDER: Record<InsightStatus, string> = {
  positive: "border-accent",
  warning: "border-warn",
  negative: "border-danger",
  neutral: "border-edge",
};

const STATUS_TEXT: Record<InsightStatus, string> = {
  positive: "text-accent",
  warning: "text-warn",
  negative: "text-danger",
  neutral: "text-ink",
};

export interface GeoffInsightCardProps extends GeoffInsightState {
  /** Card title, e.g. "Geoff on your rig". */
  title: string;
  /** One line shown before the first insight is generated. */
  hint: string;
  /** Disables the button when the underlying data is not loaded yet. */
  disabled?: boolean;
}

/**
 * Presentational card for a Geoff briefing. All state arrives from
 * useGeoffInsight — this component decides nothing, it only renders.
 * Hidden entirely when no GEOFF_API_KEY is configured on the server.
 */
export function GeoffInsightCard({
  title,
  hint,
  disabled = false,
  available,
  insight,
  model,
  generatedAt,
  loading,
  error,
  cooldown,
  generate,
}: GeoffInsightCardProps) {
  // Stay hidden until the availability probe resolves, so an unconfigured
  // install never flashes a card that then disappears.
  if (available !== true) return null;

  const status = insight?.status ?? "neutral";

  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-card border bg-surface p-4 transition-colors",
        STATUS_BORDER[status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {generatedAt
              ? `Generated ${new Date(generatedAt).toLocaleTimeString("en-US")}${model ? ` · ${model}` : ""}`
              : hint}
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading || cooldown || disabled}
          className={cn(
            "shrink-0 rounded-lg border border-edge px-3 py-1 text-xs font-semibold text-ink-muted transition-colors",
            "hover:border-accent hover:text-ink",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-edge"
          )}
        >
          {loading ? "Thinking…" : insight ? "Refresh" : "Ask Geoff"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      )}

      {insight && (
        <div className="mt-3 flex flex-col gap-3">
          <p className={cn("text-sm font-semibold", STATUS_TEXT[status])}>
            {insight.headline}
          </p>

          <ul className="flex flex-col gap-2">
            {insight.findings.map((f, i) => (
              <li key={`${f.label}-${i}`} className="text-xs">
                <span className="font-semibold text-ink">{f.label}</span>
                <span className="text-ink-muted"> — {f.detail}</span>
              </li>
            ))}
          </ul>

          {insight.nextAction && (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink">
              <span className="font-semibold">Next: </span>
              {insight.nextAction}
            </p>
          )}

          <p className="text-[10px] text-ink-muted">
            {insight.confidence} confidence · AI-generated from your own
            dashboard data. Not financial advice — verify before acting.
          </p>
        </div>
      )}
    </section>
  );
}
