---
name: asset-allocation-assistant
description: Build and maintain a practical multi-asset allocation plan (cash, bonds, equity, gold/commodities, alternatives) with target weights, rebalance thresholds, and execution checklists. Use when the user asks for asset allocation design, portfolio drift checks, rebalance sizing, risk-budget adjustments, investment policy drafting, or periodic allocation reviews.
---

# Asset Allocation Assistant

Create clear, conservative, execution-ready allocation guidance. Prioritize risk control, diversification, liquidity, and user constraints over return chasing.

## Workflow

1. Confirm scope and constraints.
2. Classify holdings by asset bucket.
3. Set target weights and rebalance bands.
4. Compute drift and proposed trades.
5. Run risk checks.
6. Deliver action plan + caveats.

## 1) Confirm Scope and Constraints

Collect missing inputs before proposing changes:

- Base currency
- Investable assets/universe
- Account constraints (taxable/retirement, lockups, lot size)
- Risk style (conservative/balanced/aggressive)
- Liquidity needs (emergency cash, near-term spending)
- Rebalance cadence (monthly/quarterly) and max turnover
- Hard limits (single-position cap, leverage allowed or not)

If critical inputs are missing, provide a provisional plan and explicitly label assumptions.

## 2) Classify Holdings by Bucket

Normalize each position into one bucket:

- Cash & cash equivalents
- Bonds / fixed income
- Equity (split domestic/international if data exists)
- Gold / commodities
- Alternatives (REITs, crypto, other)

Use transparent mapping; when ambiguous, explain mapping choice.

## 3) Set Targets and Bands

Use one of three default profiles when user has no custom IPS:

- Conservative: 20% equity / 55% bonds / 20% cash / 5% gold
- Balanced: 45% equity / 35% bonds / 15% cash / 5% gold
- Aggressive: 70% equity / 20% bonds / 5% cash / 5% gold

Default rebalance bands:

- Major buckets: ±5%
- Sub-buckets: ±3%

If user provides custom targets, always use user targets first.

## 4) Compute Drift and Proposed Trades

For each bucket compute:

- Current weight
- Target weight
- Deviation (current - target)
- Trade amount needed to return to target (or to band edge if minimizing turnover)

Prefer this execution order:

1. Use new cash contributions first.
2. Trim overweight risk assets second.
3. Sell under-tax-friction assets before high-tax-friction assets (if tax hints exist).
4. Keep turnover under user limit.

Present trade list as: `asset/bucket | buy/sell | amount | reason`.

## 5) Risk Checks (Mandatory)

Before final recommendation, verify and flag:

- Concentration risk (single name/sector too high)
- Liquidity risk (insufficient cash buffer)
- Correlation crowding (too many highly correlated exposures)
- Drawdown tolerance mismatch vs declared risk style
- Event risk (if user explicitly mentions near-term liabilities)

If any high-risk flag exists, offer a safer alternative plan.

## 6) Output Format

Return in this structure:

1. **Allocation Snapshot** (current vs target)
2. **Rebalance Actions** (prioritized list)
3. **After-Trade Expected Weights**
4. **Risk Flags & Mitigations**
5. **Review Cadence** (next check date + trigger conditions)

Keep language practical and non-promotional.

## Guardrails

- Do not claim certainty or guaranteed returns.
- Do not fabricate prices, fees, or tax rules.
- If market/price data is unavailable, use a formula-based plan and state data dependency.
- Treat this as research/decision support, not legal/tax advice.

## References

- Use `references/allocation-template.md` when the user wants a reusable IPS/allocation template.
- Use `references/rebalance-formulas.md` when calculating trade sizing or drift math step-by-step.
