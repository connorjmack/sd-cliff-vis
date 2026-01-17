# Coastal LiDAR Time Series Viewer

Interactive 3D web viewer for San Diego coastal cliff erosion monitoring using time-series LiDAR point cloud data.

- Stack: Potree 2.0, Vanilla JS, Python (laspy), Cloudflare Pages + R2
- Detailed implementation plan: `plan.md`

## Overview

This project serves time-series point cloud epochs in a Potree-based viewer, with tools to convert LAS/LAZ data into Potree octree format and upload the results to Cloudflare R2. The long-form development checklist lives in `plan.md`.

## Repository Layout

```
sd-cliff-vis/
├── plan.md                      # Milestone plan
├── CLAUDE.md                    # Project reference
├── scripts/                     # Conversion + upload tools
├── viewer/                      # Web viewer
└── data/                        # Local-only (gitignored)
```

## Local Development

```bash
# Install dependencies
poetry install

# Serve viewer locally
cd viewer && python -m http.server 8080
```

Then open `http://localhost:8080`.

## Data Conversion

```bash
# Convert a single LAS/LAZ file
poetry run python scripts/convert.py /path/to/file.las

# Batch convert a directory of LAS/LAZ files
poetry run python scripts/batch_convert.py data/raw/
```

The conversion outputs Potree octree data and per-epoch metadata into `data/converted/`.

## Cloudflare R2 Upload

```bash
# Upload converted data to R2
poetry run python scripts/upload_to_r2.py
```

Populate `.env` (see `.env.example`) with your R2 credentials before uploading.

## Viewer Data Schema

`data/converted/metadata.json` is the index consumed by the viewer:

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

Download Potree 2.0 and extract it to `viewer/libs/potree/` with the standard Potree distribution layout. See `plan.md` for the expected directory structure.

## Troubleshooting

- Potree not loading: verify `viewer/libs/potree/` and check the browser console.
- Blank viewer: check the `metadata.json` URL in `viewer/js/config.js`.
- Conversion failures: ensure `PotreeConverter` is installed and on your PATH.
- CORS errors: confirm R2 CORS settings for your Pages domain.

## License

See `LICENSE`.
