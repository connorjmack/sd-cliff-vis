# Coastal LiDAR Time Series Viewer - Implementation Plan

## Project Overview

**Goal:** Build a free, public-facing web application that allows users to interactively explore and compare time series LiDAR point cloud data of coastal environments (specifically San Diego County cliff erosion monitoring).

**Key Features:**
- Interactive 3D point cloud visualization using Potree
- Time series navigation (slider/timeline to browse survey epochs)
- Side-by-side comparison mode with synchronized cameras
- Swipe/overlay tool for before/after comparison
- Responsive design for desktop and tablet use
- Minimal hosting costs (targeting free tier for prototyping)

**Target Users:** General public, researchers, coastal managers, students

---

## Technology Stack

### Core Technologies

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Point Cloud Viewer | Potree 2.0 | Industry standard, handles GB-scale data, streams octree chunks |
| Data Conversion | py4potree + laspy | Python-native workflow, integrates with existing processing scripts |
| Frontend | Vanilla JS + HTML5 | No build step, simple deployment, Potree works best without frameworks |
| CSS Framework | None (custom minimal CSS) | Keep it lightweight, Potree has its own UI patterns |
| Static Hosting | Cloudflare Pages | Free, fast global CDN, easy GitHub integration |
| Data Storage | Cloudflare R2 | Free egress, S3-compatible, 10GB free tier |
| Dev Environment | Poetry (Python 3.10+) | Dependency management, reproducible builds |

### Python Dependencies

```toml
[tool.poetry.dependencies]
python = "^3.10"
laspy = "^2.5"           # LAS/LAZ reading
numpy = "^1.24"          # Array operations
py4potree = "^0.1"       # Potree conversion (if available/working)
tqdm = "^4.65"           # Progress bars
boto3 = "^1.28"          # S3/R2 uploads
python-dotenv = "^1.0"   # Environment variables

[tool.poetry.group.dev.dependencies]
pytest = "^7.4"
black = "^23.0"
ruff = "^0.1"
```

### Fallback: PotreeConverter CLI

If py4potree proves unreliable, fall back to the official PotreeConverter 2.1 CLI:
- Download from: https://github.com/potree/PotreeConverter/releases
- Wrap CLI calls in Python subprocess
- More battle-tested but requires binary installation

---

## Directory Structure

```
coastal-lidar-viewer/
├── pyproject.toml
├── poetry.lock
├── README.md
├── plan.md                      # This file
├── .env.example                 # Template for environment variables
├── .gitignore
│
├── scripts/
│   ├── __init__.py
│   ├── convert.py               # Single file LAS → Potree conversion
│   ├── batch_convert.py         # Process all epochs in a directory
│   ├── upload_to_r2.py          # Upload converted data to Cloudflare R2
│   ├── validate.py              # QC checks on input data
│   └── generate_metadata.py     # Extract epoch metadata for timeline
│
├── viewer/
│   ├── index.html               # Main application entry point
│   ├── css/
│   │   └── style.css            # Custom styles for timeline, panels
│   ├── js/
│   │   ├── app.js               # Main application initialization
│   │   ├── config.js            # Data URLs, epoch list, settings
│   │   ├── timeline.js          # Time series slider component
│   │   ├── comparison.js        # Split-screen and swipe comparison
│   │   ├── ui.js                # Panel controls, buttons, info display
│   │   └── utils.js             # Helper functions
│   └── libs/
│       └── potree/              # Potree library (downloaded, not npm)
│           ├── potree.js
│           ├── potree.css
│           └── resources/       # Potree shaders, icons, etc.
│
├── data/                        # LOCAL ONLY - gitignored
│   ├── raw/                     # Original LAS/LAZ files
│   │   ├── 2020-01-survey/
│   │   ├── 2021-06-survey/
│   │   └── ...
│   ├── converted/               # Potree octree output
│   │   ├── 2020-01/
│   │   ├── 2021-06/
│   │   └── ...
│   └── metadata.json            # Generated epoch metadata
│
├── tests/
│   ├── test_convert.py
│   ├── test_validate.py
│   └── fixtures/                # Small test point clouds
│
└── docs/
    ├── deployment.md            # Hosting setup instructions
    ├── data-preparation.md      # How to add new epochs
    └── architecture.md          # Technical decisions explained
```

---

## Implementation Phases

### Phase 1: Project Setup & Data Pipeline

**Goal:** Set up the development environment and create the data conversion pipeline.

#### Step 1.1: Initialize Project

```bash
# Create project directory
mkdir coastal-lidar-viewer && cd coastal-lidar-viewer

# Initialize Poetry
poetry init --name coastal-lidar-viewer --python "^3.10"

# Add dependencies
poetry add laspy numpy tqdm boto3 python-dotenv
poetry add --group dev pytest black ruff

# Create directory structure
mkdir -p scripts viewer/{css,js,libs/potree} data/{raw,converted} tests/fixtures docs
```

#### Step 1.2: Create .gitignore

```gitignore
# Data files (too large for git)
data/raw/
data/converted/
*.las
*.laz

# Environment
.env
.venv/

# Python
__pycache__/
*.pyc
.pytest_cache/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

#### Step 1.3: Implement Conversion Script

**File: `scripts/convert.py`**

This script should:
1. Accept input LAS/LAZ file path and output directory
2. Read the point cloud using laspy
3. Convert to Potree octree format
4. Generate metadata (bounds, point count, CRS)

**Key considerations:**
- Handle both LAS and LAZ (compressed) files
- Preserve classification if present (ground, vegetation, etc.)
- Preserve RGB color if present
- Output coordinate reference system info

**Pseudocode:**
```python
def convert_to_potree(input_path: Path, output_dir: Path, name: str = None):
    """
    Convert a LAS/LAZ file to Potree octree format.
    
    Args:
        input_path: Path to input LAS/LAZ file
        output_dir: Directory for Potree output
        name: Optional name for the point cloud (defaults to filename)
    
    Returns:
        dict with metadata (bounds, point_count, crs, etc.)
    """
    # 1. Read input file with laspy
    # 2. Extract points, colors, classification
    # 3. Use py4potree OR call PotreeConverter CLI
    # 4. Write metadata.json
    # 5. Return metadata dict
```

#### Step 1.4: Implement Batch Conversion

**File: `scripts/batch_convert.py`**

This script should:
1. Scan a directory for LAS/LAZ files (or subdirectories representing epochs)
2. Convert each file/epoch
3. Generate a combined `metadata.json` with all epochs
4. Support incremental updates (skip already converted)

**Expected input structure:**
```
data/raw/
├── 2020-01-15_torrey-pines.laz
├── 2020-06-22_torrey-pines.laz
├── 2021-01-10_torrey-pines.laz
└── ...
```

**Expected output structure:**
```
data/converted/
├── 2020-01-15_torrey-pines/
│   ├── metadata.json
│   ├── octree.bin
│   └── hierarchy.bin
├── 2020-06-22_torrey-pines/
│   └── ...
└── metadata.json  # Combined metadata for all epochs
```

**Combined metadata.json format:**
```json
{
  "project": "Torrey Pines Coastal Monitoring",
  "crs": "EPSG:26911",
  "epochs": [
    {
      "id": "2020-01-15_torrey-pines",
      "date": "2020-01-15",
      "label": "January 2020",
      "pointCount": 45000000,
      "bounds": {
        "min": [476000, 3638000, -10],
        "max": [478000, 3640000, 100]
      },
      "path": "2020-01-15_torrey-pines/"
    }
  ]
}
```

#### Step 1.5: Implement Validation Script

**File: `scripts/validate.py`**

Checks to implement:
- File is readable and not corrupted
- Point count is reasonable (not empty, not suspiciously small)
- Bounds are within expected geographic area
- CRS is consistent across epochs
- Z values are reasonable (no extreme outliers)

---

### Phase 2: Potree Viewer Setup

**Goal:** Create a working single-epoch Potree viewer.

#### Step 2.1: Download Potree Library

Download Potree 2.0 release and extract to `viewer/libs/potree/`:
- Source: https://github.com/potree/potree/releases
- Need: potree.js, potree.css, and resources/ folder

#### Step 2.2: Create Basic Viewer HTML

**File: `viewer/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coastal LiDAR Time Series Viewer</title>
    
    <!-- Potree dependencies -->
    <script src="libs/potree/libs/jquery/jquery-3.1.1.min.js"></script>
    <script src="libs/potree/libs/three.js/build/three.min.js"></script>
    <script src="libs/potree/libs/other/BinaryHeap.js"></script>
    <script src="libs/potree/potree.js"></script>
    <link rel="stylesheet" href="libs/potree/potree.css">
    
    <!-- Application styles -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="potree-container">
        <div id="potree-render-area"></div>
        <div id="potree-sidebar"></div>
    </div>
    
    <!-- Timeline UI (Phase 3) -->
    <div id="timeline-container"></div>
    
    <!-- Application scripts -->
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

#### Step 2.3: Create Application JavaScript

**File: `viewer/js/config.js`**

```javascript
const CONFIG = {
    // Base URL for point cloud data (local dev vs production)
    dataBaseUrl: window.location.hostname === 'localhost' 
        ? '/data/converted/' 
        : 'https://your-r2-bucket.r2.cloudflarestorage.com/',
    
    // Will be populated from metadata.json
    epochs: [],
    
    // Default viewer settings
    pointBudget: 2_000_000,
    fov: 60,
    
    // Map settings
    initialPosition: {
        x: 477000,  // Easting (UTM)
        y: 3639000, // Northing (UTM)
        z: 500      // Height for initial camera
    }
};
```

**File: `viewer/js/app.js`**

```javascript
// Main application initialization pseudocode
async function init() {
    // 1. Initialize Potree viewer
    // 2. Load metadata.json to get epoch list
    // 3. Load the most recent epoch by default
    // 4. Set up camera position
    // 5. Initialize timeline UI (Phase 3)
    // 6. Add event listeners
}

async function loadEpoch(epochId) {
    // 1. Remove current point cloud if any
    // 2. Load new point cloud from CONFIG.dataBaseUrl + epochId
    // 3. Update UI to show current epoch info
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', init);
```

#### Step 2.4: Create Basic Styles

**File: `viewer/css/style.css`**

```css
/* Reset and base */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; font-family: system-ui, sans-serif; }

/* Potree container */
#potree-container { 
    position: absolute; 
    width: 100%; 
    height: 100%; 
}

#potree-render-area { 
    position: absolute;
    width: 100%;
    height: calc(100% - 80px); /* Leave room for timeline */
}

/* Timeline container (Phase 3) */
#timeline-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px 20px;
}

/* Epoch info overlay */
#epoch-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 100;
}
```

---

### Phase 3: Time Series Navigation

**Goal:** Add timeline slider and epoch switching.

#### Step 3.1: Timeline Component

**File: `viewer/js/timeline.js`**

Features to implement:
1. **Slider** - Drag to select epoch
2. **Tick marks** - Show all available epochs
3. **Date labels** - Display date of current epoch
4. **Play button** - Auto-advance through epochs
5. **Keyboard shortcuts** - Left/right arrows to step through

**HTML structure to add:**
```html
<div id="timeline-container">
    <div id="timeline-info">
        <span id="current-date">January 2020</span>
        <span id="epoch-counter">1 / 12</span>
    </div>
    <div id="timeline-slider">
        <input type="range" id="epoch-slider" min="0" max="11" value="0">
        <div id="timeline-ticks"></div>
    </div>
    <div id="timeline-controls">
        <button id="btn-prev" title="Previous epoch">◀</button>
        <button id="btn-play" title="Play/pause">▶</button>
        <button id="btn-next" title="Next epoch">▶</button>
    </div>
</div>
```

**Key functions:**
```javascript
class Timeline {
    constructor(epochs, onEpochChange) { }
    
    setEpoch(index) { }        // Jump to specific epoch
    nextEpoch() { }            // Go to next
    prevEpoch() { }            // Go to previous
    play() { }                 // Start auto-advance
    pause() { }                // Stop auto-advance
    render() { }               // Update UI
}
```

#### Step 3.2: Loading States

Handle the time it takes to load large point clouds:
- Show loading spinner when switching epochs
- Preload next/previous epochs in background (optional optimization)
- Show progress if Potree provides it

---

### Phase 4: Comparison Mode

**Goal:** Allow side-by-side or overlay comparison of two epochs.

#### Step 4.1: Split-Screen Mode

**File: `viewer/js/comparison.js`**

Features:
1. **Split view** - Two Potree viewers side by side
2. **Synchronized cameras** - Moving one moves the other
3. **Independent epoch selection** - Each side can show different epoch
4. **Swipe divider** - Draggable divider between views

**Implementation approach:**
- Create two Potree viewer instances
- Sync camera position/orientation on 'camera-changed' event
- Use CSS to split the viewport

#### Step 4.2: Overlay/Swipe Mode

Alternative comparison:
- Single viewer with two point clouds loaded
- Vertical swipe bar to reveal before/after
- Use point cloud clipping or shader-based masking

**Recommendation:** Start with split-screen (simpler), add swipe later if needed.

---

### Phase 5: Cloud Deployment

**Goal:** Deploy for public access with minimal cost.

#### Step 5.1: Cloudflare R2 Setup

1. Create Cloudflare account (free)
2. Create R2 bucket named `coastal-lidar-data`
3. Enable public access (or use Cloudflare Worker for access control)
4. Configure CORS for your domain:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.pages.dev", "http://localhost:*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

#### Step 5.2: Upload Script

**File: `scripts/upload_to_r2.py`**

```python
def upload_epoch(epoch_dir: Path, bucket_name: str):
    """
    Upload a converted epoch directory to R2.
    
    Uses boto3 with R2-compatible endpoint.
    Uploads all files maintaining directory structure.
    """
    # Implementation using boto3 with R2 endpoint
```

**Environment variables (.env):**
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=coastal-lidar-data
```

#### Step 5.3: Cloudflare Pages Deployment

1. Connect GitHub repo to Cloudflare Pages
2. Set build settings:
   - Build command: (none, static site)
   - Output directory: `viewer`
3. Deploy automatically on push to main

#### Step 5.4: Update Config for Production

**File: `viewer/js/config.js`** should detect environment:

```javascript
const CONFIG = {
    dataBaseUrl: window.location.hostname.includes('localhost')
        ? '/data/converted/'
        : 'https://pub-XXXXX.r2.dev/',  // R2 public URL
    // ...
};
```

---

### Phase 6: Polish & Documentation

#### Step 6.1: UI Improvements

- Add loading spinner/progress bar
- Add "About" modal with methodology
- Add point cloud attribute toggles (color by elevation, classification, RGB)
- Add measurement tools (distance, area)
- Mobile-friendly controls (touch gestures)

#### Step 6.2: Performance Optimization

- Tune point budget based on device capability
- Add Level of Detail (LOD) controls
- Implement epoch preloading

#### Step 6.3: Documentation

- README with quick start
- docs/deployment.md with full hosting instructions
- docs/data-preparation.md for adding new survey data
- Inline code comments

---

## Testing Strategy

### Unit Tests
- `test_convert.py`: Test conversion with small fixture point cloud
- `test_validate.py`: Test validation catches bad data
- `test_metadata.py`: Test metadata generation

### Integration Tests
- Convert real small subset of data
- Verify Potree can load the output

### Manual Testing Checklist
- [ ] Viewer loads without errors
- [ ] Point cloud displays correctly
- [ ] Timeline slider works
- [ ] Epoch switching works
- [ ] Comparison mode works
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on tablet (iPad)
- [ ] Performance acceptable with full dataset

---

## Potential Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| py4potree unreliable/unmaintained | Fall back to PotreeConverter CLI wrapped in Python subprocess |
| R2 free tier insufficient | Compress aggressively, or budget ~$5-10/month for storage |
| Large point clouds slow to load | Tune octree depth, reduce point density, use aggressive LOD |
| Browser memory limits | Limit point budget, warn users on mobile |
| CRS/projection issues | Standardize all data to UTM Zone 11N, document clearly |

---

## Success Criteria

1. **Functional:** User can load viewer, see point cloud, switch between epochs
2. **Performant:** Initial load < 10 seconds, epoch switch < 5 seconds
3. **Accessible:** Works on modern desktop browsers, usable on tablet
4. **Maintainable:** Clear code structure, documented, easy to add new epochs
5. **Affordable:** Hosting costs < $10/month for prototype, < $50/month at scale

---

## Next Steps (For Implementation)

1. Initialize Poetry project and install dependencies
2. Attempt py4potree conversion on test data; if it fails, set up PotreeConverter CLI
3. Build basic viewer that loads single epoch
4. Add timeline navigation
5. Add comparison mode
6. Set up R2 bucket and upload
7. Deploy to Cloudflare Pages
8. Test with real data
9. Iterate on UI/UX based on feedback
