# Vault-Fee Spike — v2 route ruled out, v1 fee floor

**Date:** 2026-08-07
**Task:** Plan Task 1 (spike)

## v2 vault route — ruled out

`GET https://api.jup.ag/swap/v2/order` with `referralAccount` = the pond0x USDC
vault `6NqvoPpSYCPEtLEukQaSNs7mS3yK6k285saH9o3vgC96` returned **HTTP 400**. This
is consistent with the codebase's documented behavior (`lib/swap/orders.ts`:
"the legacy per-mint affiliate vault ATAs are NOT valid referral accounts here;
passing one makes Jupiter reject the entire order with 400"). **No v2-native way
to route the fee to the vault → use the Jupiter v1 `feeAccount` path.**

## v1 fee floor

`GET https://lite-api.jup.ag/swap/v1/quote` with descending `platformFeeBps`
all returned **HTTP 200** with a real `platformFee.amount`:

| platformFeeBps | http | platformFee.amount (on 1 USDC → SOL) |
|---|---|---|
| 5  | 200 | 6,774 |
| 10 | 200 | 13,549 |
| 25 | 200 | 33,872 |
| 50 | 200 | 67,745 |
| 100 | 200 | 135,490 |

Jupiter v1 accepts a platform fee at least as low as **5 bps (0.05%)**.

**Decision:** `JUPITER_MIN_FEE_BPS = 5` (slider floor). Step 5 bps, ceiling 255.

## Critical caveat — "accepted" ≠ "counted"

Jupiter accepting a fee only means the fee is charged to the vault. Whether
cary0x's `proSwapsSol` filter (documented minimum amount + swap pairs) actually
**counts** a swap at a given fee level is opaque and can only be verified by real
swaps over time. The only fee value **confirmed to count** is **100 bps** — the
old version's default that produced the +88 result on 2026-08-07. Therefore the
slider **floor** is 5 bps (Jupiter's minimum, lowest cost to experiment) but the
**default** `platformFeeBps` stays **100 bps** so the feature counts out of the
box. The slider hint warns that only ≥1.00% is confirmed to count.
