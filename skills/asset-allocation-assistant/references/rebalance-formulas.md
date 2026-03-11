# Rebalance Formulas

Use these formulas when price and position value data are available.

## Inputs

- Portfolio total value: `V`
- Bucket current value: `C_i`
- Bucket target weight: `T_i`
- Bucket current weight: `W_i = C_i / V`

## Drift

- Absolute drift: `D_i = W_i - T_i`
- In percentage points: `D_i_pp = (W_i - T_i) * 100`

## Trade to Exact Target

- Target value for bucket: `TV_i = T_i * V`
- Required trade: `Trade_i = TV_i - C_i`
  - `Trade_i > 0` => buy
  - `Trade_i < 0` => sell

## Trade to Band Edge (Turnover Minimization)

Given upper/lower bands around target:

- Upper edge: `U_i = T_i + band_i`
- Lower edge: `L_i = T_i - band_i`

If `W_i > U_i`, sell to `U_i`:

- `Trade_i = (U_i * V) - C_i` (negative)

If `W_i < L_i`, buy to `L_i`:

- `Trade_i = (L_i * V) - C_i` (positive)

If inside band, `Trade_i = 0`.

## Funding Order Heuristic

1. Sum required buys across underweight buckets.
2. Offset buys with new cash contributions first.
3. If still short, source sells from most overweight buckets first.
4. Respect min trade size and turnover constraints.

## Sanity Checks

- Sum of all `Trade_i` should be near 0 (excluding external cash flow).
- Post-trade weights should move toward targets/bands.
- No bucket should violate hard caps after trade.
