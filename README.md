# VeGAS Reimplementation — Proof of Concept

A small, **frontend-only** clickable demo used to align stakeholders on a parity-first
reimplementation of the legacy VeGAS Access application. It walks a sales **deal/position**
through its **status lifecycle** and shows a **price result** (AP / GP / PP) derived from a
TypeScript port of the legacy costing/pricing pipeline.

> **All data in this demo is synthetic.** No production customers, volumes, prices, secrets,
> or database connections are included. This PoC is for discussion only — it is not the
> system of record and carries no guarantee of numerical correctness.

## What it shows

- **Deal lifecycle** — status flow `30 Angelegt → 40 Angefragt → 50 Gekostet → 60 Angeboten
  → 70 Angenommen → 90 Finalisiert`, plus side states (Abgelehnt / In Änderung / Storniert).
  Actions are gated by simple validation (parity-shaped after `fkt_Pruefungen_durchfuehren`).
- **Price result** — AP (Arbeitspreis, ct/kWh), GP (Grundpreis, EUR), PP (= AP × Menge),
  verdichtet into price periods. Mirrors the legacy pipeline
  `Monate_anlegen → Costing_eintragen → ct_kWh_eintragen → Pricing_eintragen → Monate_gesamt
  → Marge_anfügen`.
- **Special products** (e.g. MoPo/Spot) are deliberately flagged as *out of PoC scope* — they
  are a targeted parity check for the MVP phase.

## Run locally

Requires Node 20+ (developed on Node 24).

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check (tsc -b) + production build into dist/
npm run preview  # serve the production build locally
npm run lint
```

## Project layout

```
src/
  domain/        # framework-free core (the part worth keeping)
    types.ts       # Contract / Position / CostingInput, status definitions
    lifecycle.ts   # status transitions & action gating (legacy "SP Aktion1..8")
    pricing.ts     # AP/GP/PP pipeline port + run-length period compression
    data.ts        # synthetic seed contracts
    format.ts      # de-DE formatting helpers
  components/     # presentational React components
  App.tsx         # in-app view state (no router — single page)
```

The `domain/` layer has no React dependency, so the pricing/lifecycle logic can later be
lifted into the .NET MVP or exercised by a golden-master comparison against the legacy system.

## Deploy to GitHub Pages

This folder is intended to be its own Git repository. The included workflow
(`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages on every push to `main`.

1. Create a **new repository** and push this `poc/` folder to it (`main` branch).
2. In the repo: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.
3. Push to `main` (or run the workflow manually). The site publishes at
   `https://<owner>.github.io/<repo>/`.

The Vite `base` path is derived automatically from the repository name in CI
(`vite.config.ts`), so no manual edit is required.

> **Governance note:** a public GitHub Pages site is world-readable. Even though the data is
> synthetic, confirm with security/governance before publishing externally, or host privately
> (e.g. GitHub Enterprise private Pages, or Azure Static Web Apps behind Entra ID).

## Scope & caveats

- Monthly volume is split evenly (annual / 12); the legacy system uses load profiles.
- Rounding parity: AP/GP rate values 4 dp, ct/kWh 5 dp.
- The commodity curve, network and margin components are illustrative constants.
- This is a throwaway demo to drive decisions, **not** production code.
