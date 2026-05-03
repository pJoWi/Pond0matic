# Pond0matic — Monitoring & Alerts (Phase 2, Spec 1 of 2)

**Date**: 2026-05-03
**Status**: Approved design, ready for implementation plan
**Scope**: First of two Phase 2 specs. Covers live rig health monitoring with alerts and price alerts. The second Phase 2 spec ("Tracking & PnL") will cover swap history and pondwater PnL.

**Depends on Phase 1**: real wallet (`useWallet`), live token prices (`useTokenPrices`), wallet balances (`useWalletBalances`), pond-water UI primitives (`LilyPadCard`, `WaterRipple`, etc.).

---

## 1. Goal

Give the user actionable, real-time signals from two sources without asking them to keep staring at the dashboard:

1. **Rig health monitoring** — alert when their mining rig's health drops, drifts, or starts failing swaps.
2. **Price alerts** — alert when wPOND, PNDC, SOL, ETH, PORK, or pondSOL crosses a user-defined threshold.

Both surface through the same notification mechanism (in-app toast + browser Notification) and the same configuration UI (`/alerts`).

Out of scope for this spec: swap history, pondwater PnL, multi-wallet, service workers, external webhooks (Discord/Telegram), audio cues.

---

## 2. Notification mechanism

### Channels

- **In-app toast** via existing `sonner` integration (already in dependencies).
- **Browser Notification API** for alerts when the tab is in the background. Requires one-time user permission via a button in the alerts UI.

### Permission flow

- `hooks/useNotificationPermission.ts` exposes `{ status: 'granted' | 'denied' | 'default' | 'unsupported', request: () => Promise<void> }`.
- A small `NotificationStatus` component renders a button: "Enable browser notifications" when `default`, status pill when `granted`, dismiss-able warning when `denied` (browser must be unblocked manually).
- Notifications never fire when permission is `denied` or `unsupported` — alerts still surface as toasts when the tab is active.

### Cooldown

Each alert rule has a per-rule cooldown to avoid spam. Default 5 minutes. Cooldown is per `(ruleId, alertKind)` and persisted via `lastTriggeredAt`.

---

## 3. Polling strategy

Visibility-aware in-tab polling. No service workers in this spec.

```
Tab visible (document.visibilityState === 'visible'):
  - prices refresh every 30s (existing useTokenPrices interval)
  - rig health refresh every 30s
Tab hidden:
  - prices refresh every 5min
  - rig health refresh every 5min
Tab closed:
  - no polling, no alerts
```

Implementation: `hooks/useVisibilityPolling.ts` is a generic helper that returns the current effective interval based on `document.visibilityState`. Both `useTokenPrices` and the new `useRigHealth` consume it.

The existing `useTokenPrices` is updated to use `useVisibilityPolling` instead of a hard-coded 30s interval (small refactor, no API change for callers).

---

## 4. Rig health monitoring

### Data source

Existing API route: `/api/rig/health/[wallet]` (proxy to `cary0x.com/api/health/<wallet>`). Already cached upstream for 10s.

### New hook: `hooks/useRigHealth.ts`

```ts
export interface RigHealthSnapshot {
  health: number;             // 0-100
  drifted: number;            // cumulative
  failed: number;             // cumulative
  inMempool: number;
  sent: number;
  miningSessions: number;
  fetchedAt: number;          // Date.now()
}

export function useRigHealth(publicKey: PublicKey | null): {
  current: RigHealthSnapshot | null;
  previous: RigHealthSnapshot | null; // last snapshot before current, for delta-based rules
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}
```

- Returns null current/previous when wallet disconnected.
- Polling controlled by `useVisibilityPolling`.
- Keeps last 2 snapshots in state so delta rules (drift increased, failed increased) can be evaluated cheaply.

### Alert rule types

```ts
type RigAlertRule =
  | { id: string; kind: 'health-below'; threshold: number;     enabled: boolean; cooldownMs: number; lastTriggeredAt?: number }
  | { id: string; kind: 'health-critical'; threshold: number;  enabled: boolean; cooldownMs: number; lastTriggeredAt?: number }
  | { id: string; kind: 'drifted-spike'; minDelta: number;     enabled: boolean; cooldownMs: number; lastTriggeredAt?: number }
  | { id: string; kind: 'failed-spike'; minDelta: number;      enabled: boolean; cooldownMs: number; lastTriggeredAt?: number };
```

Sensible defaults seeded on first run:
- `health-below` at 50
- `health-critical` at 25
- `drifted-spike` minDelta 1
- `failed-spike` minDelta 1
- All cooldown 5 minutes

### Evaluator: `lib/alerts/rigEvaluator.ts`

Pure function: `(current, previous, rules, now) => AlertEvent[]`. No side effects, no DOM, no localStorage. Easy to unit test.

```ts
export function evaluateRigRules(
  current: RigHealthSnapshot,
  previous: RigHealthSnapshot | null,
  rules: RigAlertRule[],
  now: number
): AlertEvent[];
```

A rule fires only when:
- `enabled === true`
- `now - (rule.lastTriggeredAt ?? 0) >= rule.cooldownMs`
- The rule condition is met against `current` (and `previous` for delta rules)

---

## 5. Price alerts

### Data source

Existing `useTokenPrices` hook. Tracks SOL, wPOND, pondSOL, ETH, PNDC, PORK.

### Alert rule types

```ts
type PriceAlertRule =
  | { id: string; symbol: TokenSymbol; kind: 'above'; threshold: number;             enabled: boolean; oneShot: boolean; cooldownMs: number; lastTriggeredAt?: number }
  | { id: string; symbol: TokenSymbol; kind: 'below'; threshold: number;             enabled: boolean; oneShot: boolean; cooldownMs: number; lastTriggeredAt?: number }
  | { id: string; symbol: TokenSymbol; kind: 'percent-change'; windowMs: number; pctThreshold: number; enabled: boolean; oneShot: boolean; cooldownMs: number; lastTriggeredAt?: number };

type TokenSymbol = 'SOL' | 'wPOND' | 'pondSOL' | 'ETH' | 'PNDC' | 'PORK';
```

- `oneShot: true` rules disable themselves after firing once.
- `percent-change`: simpler than 24h-from-CoinGecko — uses a rolling baseline snapshot stored in component memory. The baseline updates every `windowMs` (default 1h). A rule fires if `abs(currentPrice / baseline - 1) >= pctThreshold` and cooldown has elapsed.

### Evaluator: `lib/alerts/priceEvaluator.ts`

Pure function: `(prices, baselines, rules, now) => AlertEvent[]`. Same testability properties as the rig evaluator.

---

## 6. Storage

### Schema

```ts
const STORAGE_KEY = 'pond0matic.alerts.v1';

interface StoredAlertConfig {
  version: 1;
  rigRules: RigAlertRule[];
  priceRules: PriceAlertRule[];
  recentTriggers: AlertEvent[]; // capped at 50, newest first
  notificationsRequested: boolean; // so we don't pester the user
}
```

### Module: `lib/alerts/storage.ts`

- `loadConfig(): StoredAlertConfig` — falls back to seeded defaults if missing/corrupt
- `saveConfig(config: StoredAlertConfig): void` — debounced 250ms via wrapping setter
- `exportConfig(): string` — JSON string for download
- `importConfig(json: string): { ok: true; config: StoredAlertConfig } | { ok: false; error: string }` — zod-validated, rejects unknown versions

Validation uses **zod** (new dependency, ~12kB gzipped — already common in the ecosystem and the smallest validator with TS inference). If you'd rather not add zod, the alternative is hand-written narrowing — slightly more code but zero deps. Default plan: add zod.

### `recentTriggers`

Every fired alert is appended to `recentTriggers` (newest first), trimmed to 50. Used by the `RecentTriggersLog` UI and the navigation badge counter (count where `firedAt > now - 24h`).

---

## 7. Alert engine orchestration

### Hook: `hooks/useAlertEngine.ts`

The single hook that ties everything together. Mounted once at the page level (not per panel).

```ts
useAlertEngine() // no args, reads from useWallet/useTokenPrices/useRigHealth + localStorage
```

Internally:
1. On every snapshot tick (price or rig change), call the relevant evaluator with current rules.
2. For each returned `AlertEvent`:
   - Append to `recentTriggers` and persist
   - Update `rule.lastTriggeredAt` and persist
   - Disable `oneShot` rules
   - Call `notifier.fire(event)` which emits toast + Notification

### Notifier: `lib/alerts/notifier.ts`

```ts
fire(event: AlertEvent): void
```

- Emits `toast.warning(event.message)` (or `toast.error` for critical health)
- If `Notification.permission === 'granted'`, also `new Notification(title, { body, icon })`
- Logs to console in dev for debugging

### Where mounted

`useAlertEngine()` is called once in `app/page.tsx` (the homepage where users land). Mounting on `/alerts` would mean alerts only fire when the alerts page is open. Mounting in `ClientProviders` is overkill (would also fire on `/swapper`, fine but adds reactivity to that page).

Decision: mount in `app/page.tsx` only. Users keep the dashboard open as their "monitoring tab"; that's where alerts belong.

---

## 8. UI

### Routes

- New: `app/alerts/page.tsx` → `/alerts` — Alerts Center
- Updated: `components/layout/TopNavigation.tsx` — add nav link "Alerts" with optional badge count of triggers in last 24h

### Page composition: `AlertsCenter.tsx`

```
┌─────────────────────────────────────────────────────┐
│  Alerts Center                  [Enable notifs] ⚙ │  ← NotificationStatus + ExportImportConfig
├──────────────────────────┬──────────────────────────┤
│  Rig Alerts              │  Price Alerts            │
│  ─────────               │  ─────────               │
│  [+ Add rule]            │  [+ Add rule]            │
│                          │                          │
│  • Health below 50%   ⚙ │  • wPOND above $0.001 ⚙ │
│    cooldown 5m  [enabled]│    one-shot   [enabled] │
│  • Health critical 25% ⚙│  • SOL below $100     ⚙ │
│    cooldown 5m  [enabled]│    recurring  [enabled] │
│  • Drift spike +1     ⚙ │                          │
│  • Failed spike +1    ⚙ │                          │
├──────────────────────────┴──────────────────────────┤
│  Recent Triggers (last 24h: 3)                      │
│  ──────────                                         │
│  • 14:22  Rig health dropped to 47%                 │
│  • 09:15  wPOND broke above $0.001                  │
│  • 08:01  Drift spike: +2 in last cycle             │
└─────────────────────────────────────────────────────┘
```

### Components

- `AlertsCenter.tsx` — composes the page
- `RigAlertsPanel.tsx` — list + add/edit/delete for rig rules
- `PriceAlertsPanel.tsx` — list + add/edit/delete for price rules
- `AlertRuleEditor.tsx` — modal-ish form for adding/editing one rule (rig OR price, conditional fields)
- `RecentTriggersLog.tsx` — scrollable list of recent fired alerts with timestamp, color-coded by severity
- `NotificationStatus.tsx` — the permission button/pill
- `ExportImportConfig.tsx` — download JSON / upload JSON (with file picker + validation feedback)

All use existing pond-water primitives (`LilyPadCard`, `WaterRipple`, `LiveIndicator`) for visual consistency.

### Navigation badge

`TopNavigation` reads `recentTriggers` from `loadConfig()` on mount + listens for a custom `pond0matic:alerts-updated` window event (dispatched by `useAlertEngine` whenever it persists). Counts triggers where `firedAt > now - 24h`. Renders a small amber pill if count > 0.

---

## 9. File map

```
app/
  alerts/page.tsx                           # NEW

components/
  alerts/
    AlertsCenter.tsx                        # NEW
    RigAlertsPanel.tsx                      # NEW
    PriceAlertsPanel.tsx                    # NEW
    AlertRuleEditor.tsx                     # NEW
    RecentTriggersLog.tsx                   # NEW
    NotificationStatus.tsx                  # NEW
    ExportImportConfig.tsx                  # NEW
  layout/
    TopNavigation.tsx                       # MODIFIED — add /alerts link + badge

hooks/
  useNotificationPermission.ts              # NEW
  useVisibilityPolling.ts                   # NEW
  useRigHealth.ts                           # NEW
  useAlertEngine.ts                         # NEW
  useTokenPrices.ts                         # MODIFIED — use useVisibilityPolling

lib/alerts/
  types.ts                                  # NEW
  storage.ts                                # NEW
  rigEvaluator.ts                           # NEW
  priceEvaluator.ts                         # NEW
  notifier.ts                               # NEW
  defaults.ts                               # NEW — seeded default rules

tests/alerts/
  rigEvaluator.test.ts                      # NEW
  priceEvaluator.test.ts                    # NEW
  storage.test.ts                           # NEW
  cooldown.test.ts                          # NEW
```

Estimated 14 new files, 2 modified. No file > ~250 lines if the existing splitting discipline holds.

---

## 10. Testing

### Unit tests (required)

- `rigEvaluator.test.ts` — for each rule kind: fires when condition met, doesn't fire when disabled, respects cooldown, delta rules need previous snapshot
- `priceEvaluator.test.ts` — above/below threshold, percent-change with rolling baseline, oneShot disables after fire, cooldown
- `storage.test.ts` — load with empty storage returns defaults, load with corrupt JSON returns defaults, save/load round-trip, export string parses back via importConfig
- `cooldown.test.ts` — focused on the cooldown logic shared between evaluators

### Component tests (light)

- `AlertRuleEditor` — fills form, submits, calls onSave with correctly shaped rule
- `NotificationStatus` — renders correct state for each permission status

### Manual validation

1. Add a rig rule, force health below threshold (mock the API or wait for real drop) → toast + notification fire
2. Add a price rule for wPOND above current price + 1% → toast + notification fire on next poll
3. Background the tab → verify Notification still appears
4. Refresh page → rules persist, notifications-requested flag persists
5. Export config → re-import → rules unchanged
6. Disable rule → no firing
7. Delete rule → removed from UI and storage

---

## 11. Definition of Done

- [ ] `/alerts` route renders, both panels list rules, add/edit/delete works
- [ ] Browser notification permission flow works end-to-end (request → granted → fire)
- [ ] Visibility-aware polling: 30s when visible, 5min when hidden, no requests when tab dies
- [ ] Rig alerts fire and respect cooldown — verified manually + unit-tested
- [ ] Price alerts fire and respect cooldown — verified manually + unit-tested
- [ ] Export config produces valid JSON; import round-trips losslessly; bad JSON shows error
- [ ] `recentTriggers` capped at 50, navigation badge counts last 24h
- [ ] Default rules seeded on first visit
- [ ] `npm run build`, `npm run test`, `npx tsc --noEmit` all pass
- [ ] No visual regression elsewhere (dashboard, swapper still render correctly)

---

## 12. Out of scope (for the next Phase 2 spec or later)

- Swap history & spawn/swap performance tracking
- Pondwater PnL tracker
- Multi-wallet alerting
- Service workers (alerts when tab is closed)
- Discord / Telegram / SMS / email webhooks
- Audio cues
- Alert history older than 50 events
- Cross-device sync (would need backend)
