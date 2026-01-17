# Coastal LiDAR Time Series Viewer

Interactive 3D web viewer for San Diego coastal cliff erosion monitoring using time-series LiDAR point cloud data.

- Stack: Potree 1.8.x (vendored), Vanilla JS, Python (laspy), Cloudflare Pages + R2 (planned)
- Detailed implementation plan: `plan.md`

## Overview

This project serves time-series point cloud epochs in a Potree-based viewer, with tools to convert LAS/LAZ data into Potree octree format and upload the results to Cloudflare R2. The long-form development checklist lives in `plan.md`.

## Current Status

- Potree 1.8.x distribution is checked in under `viewer/libs/potree/`.
- Viewer scaffolding lives in `viewer/js/` and `viewer/css/`.
- Smoke test page lives at `viewer/potree-test.html`.
- Conversion and upload scripts are planned but not implemented yet (see `plan.md`).

## Repository Layout

```
sd-cliff-vis/
├── pyproject.toml               # Poetry config
├── poetry.lock                  # Locked Python deps
├── plan.md                      # Milestone plan
├── CLAUDE.md                    # Project reference
├── scripts/                     # Conversion + upload tools (planned)
├── viewer/                      # Web viewer + Potree vendor drop
├── data/                        # Local-only (gitignored)
└── tests/fixtures/              # Test fixtures (empty)
```

## Local Development

```bash
# Install dependencies
poetry install

# Serve viewer locally
cd viewer && python -m http.server 8080
```

Then open `http://localhost:8080/potree-test.html` for the Potree sanity check.

## Data Conversion

Planned scripts will live under `scripts/` (see `plan.md` for the exact CLI).

## Cloudflare R2 Upload

Planned script will live under `scripts/` and use `.env` (see `.env.example`).

## Viewer Data Schema

Planned schema for `data/converted/metadata.json`:

```json
{
  "project": "San Diego Coastal Cliff Monitoring",
  "crs": "EPSG:26911",
  "bounds": { "min": [x, y, z], "max": [x, y, z] },
  "epochs": [
    {
      "id": "2020-01-survey",
      "date": "2020-01-15",
      "label": "January 2020",
      "pointCount": 5000000,
      "path": "2020-01-survey/"
    }
  ]
}
```

## Potree Setup

Potree is already extracted in `viewer/libs/potree/`. To upgrade, replace that directory with a newer Potree distribution and update any paths in `viewer/potree-test.html` or future viewer pages.

## Troubleshooting

- Potree not loading: verify `viewer/libs/potree/` and check the browser console.
- Blank viewer: check the `metadata.json` URL in `viewer/js/config.js`.
- Conversion failures: ensure `PotreeConverter` is installed and on your PATH.
- CORS errors: confirm R2 CORS settings for your Pages domain.

## License

See `LICENSE`.
