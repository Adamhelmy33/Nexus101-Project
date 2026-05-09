# 🪙 Nexus 101 — Pricing Config Cheatsheet

**One file. One source of truth.** Edit `nexus.config.js` at the project root and every page in the app updates automatically. You never need to touch any component file to change prices.

---

## TL;DR

```
nexus.config.js    ← edit this
       │
       ▼
src/lib/pricing.js  ← derives prices, recommended bundles, free-course targets
       │
       ▼
WalletContext      ← exposes everything to React components
       │
       ▼
Every page         ← reads via useWallet() or pointsCostFor()
```

**Never** hardcode a number. **Always** call `pointsCostFor(course)` or `recommendedBundleFor(course)`.

---

## The math

```
bundle = ceil(coursePrice × 4/3 ÷ 100) × 100
```

| Course price | Bundle | Residual | After 3 buys | Free course? |
|---:|---:|---:|---:|:---:|
| 750 NXP | 1000 NXP | 250 | 750 | ✅ |
| 850 NXP | 1200 NXP | 350 | 1050 | ✅ |
| 900 NXP | 1200 NXP | 300 | 900 | ✅ |
| 1000 NXP | 1400 NXP | 400 | 1200 | ✅ |
| 1100 NXP | 1500 NXP | 400 | 1200 | ✅ |

Numbers always work because `bundle ≥ price + (price/3)`, so 3 × residual ≥ price.

---

## Common edits

### 1. Change a university's default course price
```js
universities: {
  uh: { defaultCoursePoints: 950 },   // ← was 900
  …
}
```
Every UH course now costs 950 NXP.

### 2. Override a single course
```js
coursePrices: {
  'guc-dsa': 1200,      // ← only DSA at GUC is 1200; everything else stays
}
```

### 3. Change the loyalty math (e.g. "Buy 4, Get 1 Free" instead of 3+1)
```js
loyalty: {
  bundleMultiplier:   5 / 4,    // bundle = course × 5/4 → 4 buys → free 5th
  freeCourseAfter:    4,        // marketing copy update
}
```

### 4. Add a new shelf bundle
```js
bundles: [
  …existing,
  { id: 'mega', points: 9600, label: 'Mega Pack', description: '8 courses' },
]
```

### 5. Change the EGP exchange rate (50% off promo)
```js
exchangeRate: 0.5,     // 1 NXP now costs 0.5 EGP at checkout
```

---

## Where prices show up automatically

After changing `nexus.config.js` and saving, you'll see updated values on:

- **Store cards** — every module shows its NXP price
- **Checkout** — dynamic per-course price + recommended bundle
- **Wallet → Buy bundle** — shelf bundles list with EGP prices
- **Insufficient balance modal** — recommended size + residual + math explainer
- **Free course progress** — auto-targets the cheapest unowned course
- **Receipts** — historical purchases keep their original snapshot price (config changes don't rewrite history)

---

## Database snapshot guarantee

When a student enrolls, the **exact price they paid** is stored in two places:
1. `wallet_ledger.meta.coursePricePoints` — append-only audit trail
2. `enrollments.purchase_price_points` — first-class queryable column (added in `0005_dynamic_pricing.sql`)

Even if you raise prices tomorrow, all old enrollments remember what they were sold for.
