# Coastal LiDAR Time Series Viewer

Interactive 3D web viewer for San Diego coastal cliff erosion monitoring using time-series LiDAR point cloud data.

**Stack:** Potree 2.0 | Vanilla JS | Python (laspy) | Cloudflare Pages + R2

**Detailed implementation tasks:** See [plan.md](./plan.md) for the milestone-based development checklist.

---

## Directory Structure

```
sd-cliff-vis/
├── pyproject.toml
├── CLAUDE.md                    # This file - project overview & reference
├── plan.md                      # Detailed milestone tasks
├── .env.example
├── .gitignore
│
├── scripts/
│   ├── convert.py               # Single file LAS → Potree
│   ├── batch_convert.py         # Process all epochs + generate metadata
│   └── upload_to_r2.py          # Upload to Cloudflare R2
│
├── viewer/
│   ├── index.html               # Main entry point
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js               # Potree init, epoch loading
│   │   ├── config.js            # URLs and settings
│   │   ├── timeline.js          # Time slider component
│   │   ├── comparison.js        # Split-screen comparison
│   │   └── utils.js
│   └── libs/potree/             # Potree library (downloaded)
│
├── data/                        # LOCAL ONLY - gitignored
│   ├── raw/                     # Original LAS/LAZ files
│   └── converted/               # Potree octree output + metadata.json
│
└── tests/fixtures/
```

---

## Quick Reference

### Local Development
```bash
# Install dependencies
poetry install

# Serve viewer locally
cd viewer && python -m http.server 8080

# Convert single LAS file
poetry run python scripts/convert.py /path/to/file.las

# Batch convert directory
poetry run python scripts/batch_convert.py data/raw/

# Upload to R2
poetry run python scripts/upload_to_r2.py
```

### Key Files

| File | Purpose |
|------|---------|
| `viewer/index.html` | Main entry point |
| `viewer/js/app.js` | Potree initialization, epoch loading |
| `viewer/js/timeline.js` | Timeline slider component |
| `viewer/js/comparison.js` | Split-screen comparison |
| `viewer/js/config.js` | URLs and settings |
| `scripts/convert.py` | Single file LAS→Potree |
| `scripts/batch_convert.py` | Batch conversion + metadata |
| `scripts/upload_to_r2.py` | Upload to Cloudflare R2 |
| `data/converted/metadata.json` | Epoch index for viewer |

### Metadata Schema

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

---

## Troubleshooting

- **Potree not loading:** Check browser console, verify `libs/potree/` path
- **CORS errors:** Update R2 CORS policy with your domain
- **Blank viewer:** Check `metadata.json` path in `config.js`
- **Conversion fails:** Ensure PotreeConverter is in PATH
