# Coastal LiDAR Time Series Viewer

## Project Overview

Interactive 3D web viewer for San Diego coastal cliff erosion monitoring using time-series LiDAR point cloud data.

**Stack:** Potree 2.0 | Vanilla JS | Python (laspy) | Cloudflare Pages + R2

---

## Development Workflow

This project uses **milestone-based development**. Each milestone produces a working, testable artifact. Complete milestones in order - each builds on the previous.

**Principles:**
- Every milestone ends with a verification step
- Mock data enables frontend development before real data processing
- Tasks within a milestone can often run in parallel
- Mark tasks `[x]` as completed

---

## MILESTONE 1: Project Scaffolding
**Goal:** Runnable project structure with all dependencies installed.
**Verification:** `poetry install` succeeds, directory structure exists.

### Tasks

- [ ] **1.1** Create `pyproject.toml` with Poetry config
  ```toml
  [tool.poetry]
  name = "sd-cliff-vis"
  version = "0.1.0"
  description = "Coastal LiDAR time series viewer"

  [tool.poetry.dependencies]
  python = "^3.10"
  laspy = "^2.5"
  numpy = "^1.24"
  tqdm = "^4.65"
  boto3 = "^1.28"
  python-dotenv = "^1.0"

  [tool.poetry.group.dev.dependencies]
  pytest = "^7.4"
  ```

- [ ] **1.2** Create `.gitignore`
  ```
  data/raw/
  data/converted/
  *.las
  *.laz
  .env
  .venv/
  __pycache__/
  .DS_Store
  node_modules/
  ```

- [ ] **1.3** Create directory structure
  ```
  scripts/
  viewer/css/
  viewer/js/
  viewer/libs/
  data/raw/
  data/converted/
  tests/fixtures/
  ```

- [ ] **1.4** Create `.env.example`
  ```
  R2_ACCOUNT_ID=
  R2_ACCESS_KEY_ID=
  R2_SECRET_ACCESS_KEY=
  R2_BUCKET_NAME=coastal-lidar-data
  R2_PUBLIC_URL=
  ```

- [ ] **1.5** Run `poetry install` and verify virtual environment created

### Verification
```bash
poetry install
ls -la scripts/ viewer/js/ viewer/css/ data/
```

---

## MILESTONE 2: Mock Data & Metadata Schema
**Goal:** Create mock point cloud data and metadata.json so frontend development can proceed independently.
**Verification:** `data/converted/metadata.json` exists with valid schema, mock epoch directories exist.

### Tasks

- [ ] **2.1** Create `data/converted/metadata.json` with mock data
  ```json
  {
    "project": "San Diego Coastal Cliff Monitoring",
    "crs": "EPSG:26911",
    "bounds": {
      "min": [476000, 3638000, -10],
      "max": [478000, 3640000, 100]
    },
    "epochs": [
      {
        "id": "2020-01-survey",
        "date": "2020-01-15",
        "label": "January 2020",
        "pointCount": 5000000,
        "path": "2020-01-survey/"
      },
      {
        "id": "2021-06-survey",
        "date": "2021-06-22",
        "label": "June 2021",
        "pointCount": 5200000,
        "path": "2021-06-survey/"
      },
      {
        "id": "2022-01-survey",
        "date": "2022-01-10",
        "label": "January 2022",
        "pointCount": 4800000,
        "path": "2022-01-survey/"
      }
    ]
  }
  ```

- [ ] **2.2** Create mock epoch directories (empty placeholders)
  ```bash
  mkdir -p data/converted/2020-01-survey
  mkdir -p data/converted/2021-06-survey
  mkdir -p data/converted/2022-01-survey
  ```

### Verification
```bash
cat data/converted/metadata.json | python -m json.tool
```

---

## MILESTONE 3: Potree Library Setup
**Goal:** Potree library downloaded and serving locally.
**Verification:** Browser loads Potree without console errors.

### Tasks

- [ ] **3.1** Download Potree 2.0 release from https://github.com/potree/potree/releases

- [ ] **3.2** Extract to `viewer/libs/potree/` with structure:
  ```
  viewer/libs/potree/
  ├── potree.js
  ├── potree.css
  ├── libs/
  │   ├── jquery/
  │   ├── three.js/
  │   └── other/
  └── resources/
  ```

- [ ] **3.3** Create minimal test HTML `viewer/potree-test.html`
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <script src="libs/potree/libs/jquery/jquery-3.1.1.min.js"></script>
    <script src="libs/potree/libs/three.js/build/three.min.js"></script>
    <script src="libs/potree/potree.js"></script>
    <link rel="stylesheet" href="libs/potree/potree.css">
  </head>
  <body>
    <div id="potree_render_area" style="width:100vw;height:100vh;"></div>
    <script>
      const viewer = new Potree.Viewer(document.getElementById("potree_render_area"));
      console.log("Potree loaded:", Potree.version);
    </script>
  </body>
  </html>
  ```

- [ ] **3.4** Serve and test
  ```bash
  cd viewer && python -m http.server 8080
  # Open http://localhost:8080/potree-test.html
  ```

### Verification
- Browser console shows "Potree loaded: X.X"
- No 404 errors for scripts/resources
- 3D canvas renders (black/empty is OK at this stage)

---

## MILESTONE 4: Basic Single-Epoch Viewer
**Goal:** Working viewer that loads and displays one point cloud.
**Verification:** Point cloud renders in browser with orbit controls.

**Requires:** Milestone 3 complete, sample Potree point cloud data (use Potree sample data or convert one test file)

### Tasks

- [ ] **4.1** Create `viewer/js/config.js`
  ```javascript
  const CONFIG = {
    dataBaseUrl: window.location.hostname === 'localhost'
      ? '../data/converted/'
      : 'https://YOUR_R2_URL/',
    metadataUrl: 'metadata.json',
    pointBudget: 2_000_000,
    fov: 60,
    edlEnabled: true
  };
  ```

- [ ] **4.2** Create `viewer/js/utils.js`
  ```javascript
  function formatNumber(num) {
    return num.toLocaleString();
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  async function fetchMetadata(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load metadata: ${response.status}`);
    return response.json();
  }
  ```

- [ ] **4.3** Create `viewer/css/style.css`
  ```css
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; overflow: hidden; font-family: system-ui, sans-serif; }

  #potree-container { position: absolute; width: 100%; height: 100%; }
  #potree-render-area { position: absolute; width: 100%; height: calc(100% - 80px); }

  #epoch-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.75);
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 1000;
  }
  #epoch-info h3 { margin-bottom: 4px; font-size: 16px; }

  #loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 18px;
    z-index: 1001;
  }
  .hidden { display: none; }
  ```

- [ ] **4.4** Create `viewer/js/app.js`
  ```javascript
  let viewer = null;
  let currentPointCloud = null;
  let metadata = null;

  async function init() {
    // Initialize Potree viewer
    viewer = new Potree.Viewer(document.getElementById("potree-render-area"));
    viewer.setEDLEnabled(CONFIG.edlEnabled);
    viewer.setPointBudget(CONFIG.pointBudget);
    viewer.setFOV(CONFIG.fov);
    viewer.setBackground("gradient");

    // Load metadata
    try {
      metadata = await fetchMetadata(CONFIG.dataBaseUrl + CONFIG.metadataUrl);
      console.log("Loaded metadata:", metadata.epochs.length, "epochs");

      // Load most recent epoch
      if (metadata.epochs.length > 0) {
        const latestEpoch = metadata.epochs[metadata.epochs.length - 1];
        await loadEpoch(latestEpoch);
      }
    } catch (error) {
      console.error("Failed to initialize:", error);
      showError("Failed to load viewer data");
    }
  }

  async function loadEpoch(epoch) {
    showLoading();

    // Remove existing point cloud
    if (currentPointCloud) {
      viewer.scene.pointclouds = [];
      currentPointCloud = null;
    }

    const url = CONFIG.dataBaseUrl + epoch.path + "metadata.json";

    try {
      const pointcloud = await Potree.loadPointCloud(url);
      viewer.scene.addPointCloud(pointcloud);
      currentPointCloud = pointcloud;

      // Fit camera to point cloud
      viewer.fitToScreen();

      updateEpochInfo(epoch);
      hideLoading();
    } catch (error) {
      console.error("Failed to load epoch:", error);
      showError("Failed to load point cloud");
      hideLoading();
    }
  }

  function updateEpochInfo(epoch) {
    document.getElementById("epoch-date").textContent = formatDate(epoch.date);
    document.getElementById("epoch-points").textContent = formatNumber(epoch.pointCount) + " points";
  }

  function showLoading() {
    document.getElementById("loading").classList.remove("hidden");
  }

  function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
  }

  function showError(msg) {
    alert(msg); // Replace with better UI later
  }

  document.addEventListener("DOMContentLoaded", init);
  ```

- [ ] **4.5** Create `viewer/index.html`
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>San Diego Coastal LiDAR Viewer</title>

    <!-- Potree dependencies -->
    <script src="libs/potree/libs/jquery/jquery-3.1.1.min.js"></script>
    <script src="libs/potree/libs/three.js/build/three.min.js"></script>
    <script src="libs/potree/libs/other/BinaryHeap.js"></script>
    <script src="libs/potree/potree.js"></script>
    <link rel="stylesheet" href="libs/potree/potree.css">

    <!-- App styles -->
    <link rel="stylesheet" href="css/style.css">
  </head>
  <body>
    <div id="potree-container">
      <div id="potree-render-area"></div>
    </div>

    <div id="epoch-info">
      <h3 id="epoch-date">Loading...</h3>
      <span id="epoch-points"></span>
    </div>

    <div id="loading">Loading point cloud...</div>

    <div id="timeline-container"></div>

    <!-- App scripts -->
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/app.js"></script>
  </body>
  </html>
  ```

- [ ] **4.6** Get sample Potree data for testing (use one of):
  - Download Potree sample data from their examples
  - Convert a small LAS file using PotreeConverter CLI
  - Place in `data/converted/2020-01-survey/`

### Verification
- `python -m http.server 8080` from `viewer/`
- Open http://localhost:8080
- Point cloud renders with orbit controls
- Epoch info shows date and point count
- No console errors

---

## MILESTONE 5: Timeline Navigation
**Goal:** Slider UI to browse between epochs.
**Verification:** User can switch epochs using slider, buttons, and keyboard.

**Requires:** Milestone 4 complete

### Tasks

- [ ] **5.1** Create `viewer/js/timeline.js`
  ```javascript
  class Timeline {
    constructor(epochs, onEpochChange) {
      this.epochs = epochs;
      this.currentIndex = epochs.length - 1; // Start at most recent
      this.onEpochChange = onEpochChange;
      this.isPlaying = false;
      this.playInterval = null;
      this.playSpeed = 2000; // ms between epochs
    }

    render(container) {
      container.innerHTML = `
        <div class="timeline-info">
          <span id="timeline-date"></span>
          <span id="timeline-counter"></span>
        </div>
        <div class="timeline-slider">
          <input type="range" id="epoch-slider"
            min="0" max="${this.epochs.length - 1}"
            value="${this.currentIndex}">
        </div>
        <div class="timeline-controls">
          <button id="btn-prev" title="Previous (←)">◀</button>
          <button id="btn-play" title="Play/Pause (Space)">▶</button>
          <button id="btn-next" title="Next (→)">▶</button>
        </div>
      `;

      this.bindEvents();
      this.updateUI();
    }

    bindEvents() {
      document.getElementById("epoch-slider").addEventListener("input", (e) => {
        this.setEpoch(parseInt(e.target.value));
      });

      document.getElementById("btn-prev").addEventListener("click", () => this.prevEpoch());
      document.getElementById("btn-next").addEventListener("click", () => this.nextEpoch());
      document.getElementById("btn-play").addEventListener("click", () => this.togglePlay());

      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") this.prevEpoch();
        if (e.key === "ArrowRight") this.nextEpoch();
        if (e.key === " ") { e.preventDefault(); this.togglePlay(); }
      });
    }

    setEpoch(index) {
      if (index < 0 || index >= this.epochs.length) return;
      this.currentIndex = index;
      this.updateUI();
      this.onEpochChange(this.epochs[index]);
    }

    nextEpoch() {
      this.setEpoch((this.currentIndex + 1) % this.epochs.length);
    }

    prevEpoch() {
      this.setEpoch((this.currentIndex - 1 + this.epochs.length) % this.epochs.length);
    }

    togglePlay() {
      this.isPlaying ? this.pause() : this.play();
    }

    play() {
      this.isPlaying = true;
      document.getElementById("btn-play").textContent = "⏸";
      this.playInterval = setInterval(() => this.nextEpoch(), this.playSpeed);
    }

    pause() {
      this.isPlaying = false;
      document.getElementById("btn-play").textContent = "▶";
      clearInterval(this.playInterval);
    }

    updateUI() {
      const epoch = this.epochs[this.currentIndex];
      document.getElementById("timeline-date").textContent = formatDate(epoch.date);
      document.getElementById("timeline-counter").textContent =
        `${this.currentIndex + 1} / ${this.epochs.length}`;
      document.getElementById("epoch-slider").value = this.currentIndex;
    }

    getCurrentEpoch() {
      return this.epochs[this.currentIndex];
    }
  }
  ```

- [ ] **5.2** Add timeline styles to `viewer/css/style.css`
  ```css
  #timeline-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    gap: 20px;
  }

  .timeline-info {
    color: white;
    min-width: 180px;
  }
  #timeline-date { display: block; font-weight: 600; font-size: 16px; }
  #timeline-counter { font-size: 13px; opacity: 0.7; }

  .timeline-slider {
    flex: 1;
    padding: 0 20px;
  }
  #epoch-slider {
    width: 100%;
    height: 8px;
    cursor: pointer;
  }

  .timeline-controls {
    display: flex;
    gap: 8px;
  }
  .timeline-controls button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: #444;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .timeline-controls button:hover { background: #666; }
  .timeline-controls button:disabled { opacity: 0.4; cursor: not-allowed; }
  ```

- [ ] **5.3** Update `viewer/index.html` - add timeline.js script
  ```html
  <script src="js/timeline.js"></script>
  ```

- [ ] **5.4** Update `viewer/js/app.js` to integrate timeline
  ```javascript
  let timeline = null;

  // In init(), after loading metadata:
  timeline = new Timeline(metadata.epochs, loadEpoch);
  timeline.render(document.getElementById("timeline-container"));

  // Initial load uses timeline's current epoch
  await loadEpoch(timeline.getCurrentEpoch());
  ```

### Verification
- Slider moves and loads different epochs
- Prev/Next buttons work
- Play button auto-advances through epochs
- Keyboard shortcuts work (← → Space)
- UI shows current date and position (e.g., "3 / 5")

---

## MILESTONE 6: Python Conversion Pipeline
**Goal:** Scripts to convert LAS/LAZ files to Potree format.
**Verification:** `scripts/convert.py` successfully converts a test LAS file.

**Note:** Can be developed in parallel with Milestones 4-5 (frontend work).

### Tasks

- [ ] **6.1** Create `scripts/__init__.py` (empty)

- [ ] **6.2** Create `scripts/convert.py`
  ```python
  #!/usr/bin/env python3
  """Convert LAS/LAZ files to Potree octree format."""

  import argparse
  import json
  import subprocess
  import sys
  from pathlib import Path

  import laspy
  import numpy as np
  from tqdm import tqdm


  def get_las_info(input_path: Path) -> dict:
      """Extract metadata from a LAS/LAZ file."""
      with laspy.open(input_path) as f:
          header = f.header

          # Read points to get actual bounds (header bounds may be wrong)
          las = f.read()

          return {
              "point_count": header.point_count,
              "bounds": {
                  "min": [float(las.x.min()), float(las.y.min()), float(las.z.min())],
                  "max": [float(las.x.max()), float(las.y.max()), float(las.z.max())]
              },
              "crs": str(header.parse_crs()) if header.parse_crs() else None,
              "has_rgb": hasattr(las, 'red'),
              "has_classification": hasattr(las, 'classification'),
              "point_format": header.point_format.id
          }


  def convert_with_potreeconverter(input_path: Path, output_dir: Path) -> bool:
      """Convert using PotreeConverter CLI."""
      # Check if PotreeConverter is available
      try:
          result = subprocess.run(
              ["PotreeConverter", "--version"],
              capture_output=True, text=True
          )
      except FileNotFoundError:
          print("ERROR: PotreeConverter not found in PATH")
          print("Download from: https://github.com/potree/PotreeConverter/releases")
          return False

      output_dir.mkdir(parents=True, exist_ok=True)

      cmd = [
          "PotreeConverter",
          str(input_path),
          "-o", str(output_dir),
          "--generate-page", "NO"
      ]

      print(f"Running: {' '.join(cmd)}")
      result = subprocess.run(cmd, capture_output=True, text=True)

      if result.returncode != 0:
          print(f"ERROR: {result.stderr}")
          return False

      return True


  def convert_to_potree(input_path: Path, output_dir: Path, name: str = None) -> dict:
      """
      Convert a LAS/LAZ file to Potree format.

      Returns metadata dict on success, raises exception on failure.
      """
      input_path = Path(input_path)
      output_dir = Path(output_dir)

      if not input_path.exists():
          raise FileNotFoundError(f"Input file not found: {input_path}")

      name = name or input_path.stem
      epoch_output_dir = output_dir / name

      print(f"Converting: {input_path}")
      print(f"Output: {epoch_output_dir}")

      # Get input file info
      info = get_las_info(input_path)
      print(f"Points: {info['point_count']:,}")
      print(f"Has RGB: {info['has_rgb']}")

      # Convert
      success = convert_with_potreeconverter(input_path, epoch_output_dir)
      if not success:
          raise RuntimeError("Conversion failed")

      # Write epoch metadata
      metadata = {
          "id": name,
          "source_file": input_path.name,
          **info
      }

      metadata_path = epoch_output_dir / "epoch_metadata.json"
      with open(metadata_path, 'w') as f:
          json.dump(metadata, f, indent=2)

      print(f"Done! Output: {epoch_output_dir}")
      return metadata


  def main():
      parser = argparse.ArgumentParser(description="Convert LAS/LAZ to Potree format")
      parser.add_argument("input", type=Path, help="Input LAS/LAZ file")
      parser.add_argument("-o", "--output", type=Path, default=Path("data/converted"),
                          help="Output directory (default: data/converted)")
      parser.add_argument("-n", "--name", type=str, help="Name for output (default: input filename)")

      args = parser.parse_args()

      try:
          metadata = convert_to_potree(args.input, args.output, args.name)
          print(json.dumps(metadata, indent=2))
      except Exception as e:
          print(f"ERROR: {e}", file=sys.stderr)
          sys.exit(1)


  if __name__ == "__main__":
      main()
  ```

- [ ] **6.3** Download and install PotreeConverter CLI
  - Download from https://github.com/potree/PotreeConverter/releases
  - Extract and add to PATH (or place in project root)
  - Test: `PotreeConverter --version`

- [ ] **6.4** Test conversion with sample LAS file
  ```bash
  poetry run python scripts/convert.py /path/to/sample.las -o data/converted
  ```

### Verification
- Script runs without errors
- Output directory contains `metadata.json`, `octree.bin`, `hierarchy.bin`
- Epoch metadata JSON is written
- Point cloud loads in viewer (Milestone 4)

---

## MILESTONE 7: Batch Conversion & Metadata Generation
**Goal:** Process multiple epochs and generate combined metadata.json.
**Verification:** All epochs converted, viewer loads all from metadata.json.

**Requires:** Milestone 6 complete

### Tasks

- [ ] **7.1** Create `scripts/batch_convert.py`
  ```python
  #!/usr/bin/env python3
  """Batch convert multiple LAS/LAZ files and generate combined metadata."""

  import argparse
  import json
  import re
  from datetime import datetime
  from pathlib import Path

  from convert import convert_to_potree, get_las_info


  def parse_date_from_filename(filename: str) -> str:
      """Extract date from filename like '2020-01-15_torrey-pines.laz'."""
      match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
      if match:
          return match.group(1)

      # Try YYYYMMDD format
      match = re.match(r'(\d{8})', filename)
      if match:
          d = match.group(1)
          return f"{d[:4]}-{d[4:6]}-{d[6:8]}"

      return None


  def make_label(date_str: str) -> str:
      """Create human-readable label from date string."""
      try:
          dt = datetime.strptime(date_str, "%Y-%m-%d")
          return dt.strftime("%B %Y")  # e.g., "January 2020"
      except:
          return date_str


  def batch_convert(input_dir: Path, output_dir: Path, force: bool = False) -> dict:
      """
      Convert all LAS/LAZ files in input_dir to Potree format.

      Returns combined metadata dict.
      """
      input_dir = Path(input_dir)
      output_dir = Path(output_dir)
      output_dir.mkdir(parents=True, exist_ok=True)

      # Find all LAS/LAZ files
      files = list(input_dir.glob("*.las")) + list(input_dir.glob("*.laz"))
      files = sorted(files)

      if not files:
          raise ValueError(f"No LAS/LAZ files found in {input_dir}")

      print(f"Found {len(files)} files to convert")

      epochs = []
      global_bounds = {"min": [float('inf')] * 3, "max": [float('-inf')] * 3}
      crs = None

      for file_path in files:
          epoch_name = file_path.stem
          epoch_output = output_dir / epoch_name

          # Skip if already converted (unless --force)
          if epoch_output.exists() and not force:
              print(f"Skipping {epoch_name} (already exists, use --force to reconvert)")
              # Load existing metadata
              meta_path = epoch_output / "epoch_metadata.json"
              if meta_path.exists():
                  with open(meta_path) as f:
                      epoch_meta = json.load(f)
              else:
                  epoch_meta = get_las_info(file_path)
                  epoch_meta["id"] = epoch_name
          else:
              epoch_meta = convert_to_potree(file_path, output_dir, epoch_name)

          # Extract date from filename
          date_str = parse_date_from_filename(file_path.name) or "unknown"

          epochs.append({
              "id": epoch_name,
              "date": date_str,
              "label": make_label(date_str),
              "pointCount": epoch_meta["point_count"],
              "bounds": epoch_meta["bounds"],
              "path": f"{epoch_name}/"
          })

          # Update global bounds
          for i in range(3):
              global_bounds["min"][i] = min(global_bounds["min"][i], epoch_meta["bounds"]["min"][i])
              global_bounds["max"][i] = max(global_bounds["max"][i], epoch_meta["bounds"]["max"][i])

          # Track CRS
          if epoch_meta.get("crs") and not crs:
              crs = epoch_meta["crs"]

      # Sort epochs by date
      epochs.sort(key=lambda e: e["date"])

      # Generate combined metadata
      metadata = {
          "project": "San Diego Coastal Cliff Monitoring",
          "crs": crs or "EPSG:26911",
          "bounds": global_bounds,
          "epochs": epochs
      }

      # Write combined metadata
      metadata_path = output_dir / "metadata.json"
      with open(metadata_path, 'w') as f:
          json.dump(metadata, f, indent=2)

      print(f"\nGenerated {metadata_path}")
      print(f"Total epochs: {len(epochs)}")
      print(f"Total points: {sum(e['pointCount'] for e in epochs):,}")

      return metadata


  def main():
      parser = argparse.ArgumentParser(description="Batch convert LAS/LAZ files to Potree")
      parser.add_argument("input_dir", type=Path, help="Directory containing LAS/LAZ files")
      parser.add_argument("-o", "--output", type=Path, default=Path("data/converted"),
                          help="Output directory (default: data/converted)")
      parser.add_argument("--force", action="store_true", help="Reconvert existing epochs")

      args = parser.parse_args()

      try:
          metadata = batch_convert(args.input_dir, args.output, args.force)
      except Exception as e:
          print(f"ERROR: {e}")
          raise


  if __name__ == "__main__":
      main()
  ```

- [ ] **7.2** Test batch conversion
  ```bash
  poetry run python scripts/batch_convert.py data/raw/ -o data/converted
  ```

- [ ] **7.3** Verify viewer loads all epochs from generated metadata.json

### Verification
- `data/converted/metadata.json` contains all epochs
- Each epoch directory has Potree files
- Viewer timeline shows all epochs
- Switching between epochs works

---

## MILESTONE 8: Comparison Mode (Split-Screen)
**Goal:** Side-by-side view of two epochs with synchronized cameras.
**Verification:** User can compare two epochs, cameras stay synced.

**Requires:** Milestone 5 complete

### Tasks

- [ ] **8.1** Create `viewer/js/comparison.js`
  ```javascript
  class ComparisonMode {
    constructor(container, epochs, loadEpochFn) {
      this.container = container;
      this.epochs = epochs;
      this.loadEpochFn = loadEpochFn;
      this.isActive = false;
      this.viewerLeft = null;
      this.viewerRight = null;
      this.leftIndex = 0;
      this.rightIndex = epochs.length - 1;
      this.syncEnabled = true;
      this.isSyncing = false;
    }

    enable() {
      this.isActive = true;
      document.getElementById("single-view-container").classList.add("hidden");
      document.getElementById("comparison-container").classList.remove("hidden");
      document.getElementById("timeline-container").classList.add("hidden");

      this.initViewers();
      this.renderControls();
      this.loadBothEpochs();
    }

    disable() {
      this.isActive = false;
      document.getElementById("comparison-container").classList.add("hidden");
      document.getElementById("single-view-container").classList.remove("hidden");
      document.getElementById("timeline-container").classList.remove("hidden");

      // Cleanup viewers
      if (this.viewerLeft) this.viewerLeft = null;
      if (this.viewerRight) this.viewerRight = null;
    }

    initViewers() {
      this.viewerLeft = new Potree.Viewer(document.getElementById("viewer-left"));
      this.viewerRight = new Potree.Viewer(document.getElementById("viewer-right"));

      [this.viewerLeft, this.viewerRight].forEach(v => {
        v.setEDLEnabled(CONFIG.edlEnabled);
        v.setPointBudget(CONFIG.pointBudget / 2); // Split budget
        v.setFOV(CONFIG.fov);
        v.setBackground("gradient");
      });

      this.setupCameraSync();
    }

    setupCameraSync() {
      const syncCamera = (source, target) => {
        if (!this.syncEnabled || this.isSyncing) return;
        this.isSyncing = true;

        target.scene.view.position.copy(source.scene.view.position);
        target.scene.view.lookAt(source.scene.view.getPivot());

        requestAnimationFrame(() => this.isSyncing = false);
      };

      // Use render loop to sync
      const originalRenderLeft = this.viewerLeft.render.bind(this.viewerLeft);
      this.viewerLeft.render = () => {
        originalRenderLeft();
        syncCamera(this.viewerLeft, this.viewerRight);
      };
    }

    async loadBothEpochs() {
      const leftEpoch = this.epochs[this.leftIndex];
      const rightEpoch = this.epochs[this.rightIndex];

      const loadIntoViewer = async (viewer, epoch) => {
        const url = CONFIG.dataBaseUrl + epoch.path + "metadata.json";
        const pc = await Potree.loadPointCloud(url);
        viewer.scene.addPointCloud(pc);
        viewer.fitToScreen();
      };

      await Promise.all([
        loadIntoViewer(this.viewerLeft, leftEpoch),
        loadIntoViewer(this.viewerRight, rightEpoch)
      ]);

      this.updateLabels();
    }

    renderControls() {
      const controlsHtml = `
        <div id="comparison-controls">
          <div class="comp-selector">
            <label>Left:</label>
            <select id="left-epoch-select">
              ${this.epochs.map((e, i) =>
                `<option value="${i}" ${i === this.leftIndex ? 'selected' : ''}>${e.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="comp-options">
            <label><input type="checkbox" id="sync-toggle" ${this.syncEnabled ? 'checked' : ''}> Sync cameras</label>
            <button id="exit-comparison">Exit Comparison</button>
          </div>
          <div class="comp-selector">
            <label>Right:</label>
            <select id="right-epoch-select">
              ${this.epochs.map((e, i) =>
                `<option value="${i}" ${i === this.rightIndex ? 'selected' : ''}>${e.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      `;

      document.getElementById("comparison-controls-container").innerHTML = controlsHtml;

      document.getElementById("left-epoch-select").addEventListener("change", (e) => {
        this.leftIndex = parseInt(e.target.value);
        this.reloadLeft();
      });

      document.getElementById("right-epoch-select").addEventListener("change", (e) => {
        this.rightIndex = parseInt(e.target.value);
        this.reloadRight();
      });

      document.getElementById("sync-toggle").addEventListener("change", (e) => {
        this.syncEnabled = e.target.checked;
      });

      document.getElementById("exit-comparison").addEventListener("click", () => this.disable());
    }

    async reloadLeft() {
      this.viewerLeft.scene.pointclouds = [];
      const epoch = this.epochs[this.leftIndex];
      const url = CONFIG.dataBaseUrl + epoch.path + "metadata.json";
      const pc = await Potree.loadPointCloud(url);
      this.viewerLeft.scene.addPointCloud(pc);
      this.updateLabels();
    }

    async reloadRight() {
      this.viewerRight.scene.pointclouds = [];
      const epoch = this.epochs[this.rightIndex];
      const url = CONFIG.dataBaseUrl + epoch.path + "metadata.json";
      const pc = await Potree.loadPointCloud(url);
      this.viewerRight.scene.addPointCloud(pc);
      this.updateLabels();
    }

    updateLabels() {
      document.getElementById("left-label").textContent = this.epochs[this.leftIndex].label;
      document.getElementById("right-label").textContent = this.epochs[this.rightIndex].label;
    }
  }
  ```

- [ ] **8.2** Update `viewer/index.html` with comparison structure
  ```html
  <!-- Replace potree-container contents with: -->
  <div id="potree-container">
    <!-- Single view (default) -->
    <div id="single-view-container">
      <div id="potree-render-area"></div>
    </div>

    <!-- Comparison view (hidden by default) -->
    <div id="comparison-container" class="hidden">
      <div id="viewer-left"></div>
      <div id="swipe-divider"></div>
      <div id="viewer-right"></div>
      <div id="left-label" class="view-label"></div>
      <div id="right-label" class="view-label right"></div>
    </div>

    <div id="comparison-controls-container"></div>
  </div>

  <!-- Add compare button to epoch-info -->
  <div id="epoch-info">
    <h3 id="epoch-date">Loading...</h3>
    <span id="epoch-points"></span>
    <button id="btn-compare">Compare Epochs</button>
  </div>
  ```

- [ ] **8.3** Add comparison styles to `viewer/css/style.css`
  ```css
  #comparison-container {
    position: absolute;
    width: 100%;
    height: calc(100% - 80px);
    display: flex;
  }
  #comparison-container.hidden { display: none; }

  #viewer-left, #viewer-right {
    flex: 1;
    height: 100%;
    position: relative;
  }

  #swipe-divider {
    width: 6px;
    background: #333;
    cursor: ew-resize;
    z-index: 100;
  }
  #swipe-divider:hover { background: #666; }

  .view-label {
    position: absolute;
    bottom: 90px;
    left: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-weight: 600;
  }
  .view-label.right { left: auto; right: 10px; }

  #comparison-controls {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    gap: 20px;
    align-items: center;
    z-index: 1000;
  }

  .comp-selector select {
    padding: 6px 10px;
    border-radius: 4px;
    border: none;
    background: #444;
    color: white;
  }

  #btn-compare {
    margin-top: 8px;
    padding: 6px 12px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  #btn-compare:hover { background: #1d4ed8; }

  #exit-comparison {
    padding: 6px 12px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  ```

- [ ] **8.4** Update `viewer/js/app.js` to integrate comparison mode
  ```javascript
  let comparison = null;

  // In init(), after timeline setup:
  comparison = new ComparisonMode(
    document.getElementById("potree-container"),
    metadata.epochs,
    loadEpoch
  );

  document.getElementById("btn-compare").addEventListener("click", () => {
    comparison.enable();
  });
  ```

- [ ] **8.5** Add comparison.js script to index.html

### Verification
- "Compare" button enters split-screen mode
- Two epochs display side-by-side
- Camera movements sync between views
- Epoch selectors change displayed data
- "Exit" button returns to single view
- Sync can be toggled on/off

---

## MILESTONE 9: R2 Upload Script
**Goal:** Script to upload converted data to Cloudflare R2.
**Verification:** Data accessible via R2 public URL.

**Requires:** Milestone 7 complete, Cloudflare R2 bucket created (manual step)

### Tasks

- [ ] **9.1** Create `scripts/upload_to_r2.py`
  ```python
  #!/usr/bin/env python3
  """Upload converted Potree data to Cloudflare R2."""

  import argparse
  import mimetypes
  import os
  from pathlib import Path

  import boto3
  from botocore.config import Config
  from dotenv import load_dotenv
  from tqdm import tqdm

  load_dotenv()


  def get_r2_client():
      """Create boto3 client configured for R2."""
      return boto3.client(
          's3',
          endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
          aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
          aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
          config=Config(signature_version='s3v4'),
          region_name='auto'
      )


  def get_content_type(path: Path) -> str:
      """Determine content type for file."""
      mime_type, _ = mimetypes.guess_type(str(path))
      if mime_type:
          return mime_type

      # Handle Potree-specific files
      suffix = path.suffix.lower()
      if suffix == '.bin':
          return 'application/octet-stream'
      if suffix == '.json':
          return 'application/json'

      return 'application/octet-stream'


  def upload_file(client, bucket: str, local_path: Path, remote_key: str, dry_run: bool = False):
      """Upload a single file to R2."""
      content_type = get_content_type(local_path)

      if dry_run:
          print(f"[DRY RUN] Would upload: {local_path} -> {remote_key}")
          return

      client.upload_file(
          str(local_path),
          bucket,
          remote_key,
          ExtraArgs={
              'ContentType': content_type,
              'CacheControl': 'public, max-age=31536000'  # 1 year cache
          }
      )


  def upload_directory(client, bucket: str, local_dir: Path, remote_prefix: str = "", dry_run: bool = False):
      """Upload all files in a directory to R2."""
      local_dir = Path(local_dir)
      files = list(local_dir.rglob("*"))
      files = [f for f in files if f.is_file()]

      print(f"Uploading {len(files)} files from {local_dir}")

      for file_path in tqdm(files, desc="Uploading"):
          relative = file_path.relative_to(local_dir)
          remote_key = f"{remote_prefix}{relative}".replace("\\", "/")
          upload_file(client, bucket, file_path, remote_key, dry_run)


  def main():
      parser = argparse.ArgumentParser(description="Upload Potree data to Cloudflare R2")
      parser.add_argument("source", type=Path, help="Directory to upload (default: data/converted)",
                          nargs='?', default=Path("data/converted"))
      parser.add_argument("--dry-run", action="store_true", help="Show what would be uploaded")

      args = parser.parse_args()

      # Validate environment
      required_vars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
      missing = [v for v in required_vars if not os.environ.get(v)]
      if missing:
          print(f"ERROR: Missing environment variables: {', '.join(missing)}")
          print("Copy .env.example to .env and fill in values")
          return 1

      client = get_r2_client()
      bucket = os.environ['R2_BUCKET_NAME']

      print(f"Uploading to bucket: {bucket}")
      upload_directory(client, bucket, args.source, dry_run=args.dry_run)

      if not args.dry_run:
          print(f"\nDone! Files available at: {os.environ.get('R2_PUBLIC_URL', 'your-r2-url')}")


  if __name__ == "__main__":
      main()
  ```

- [ ] **9.2** Fill in `.env` with R2 credentials

- [ ] **9.3** Test upload with dry-run
  ```bash
  poetry run python scripts/upload_to_r2.py --dry-run
  ```

- [ ] **9.4** Upload data
  ```bash
  poetry run python scripts/upload_to_r2.py
  ```

### Verification
- Files appear in R2 bucket (check Cloudflare dashboard)
- Files accessible via public URL
- metadata.json loads in browser at R2 URL

---

## MILESTONE 10: Production Deployment
**Goal:** Viewer deployed on Cloudflare Pages, loading data from R2.
**Verification:** Public URL works end-to-end.

**Requires:** Milestones 8 and 9 complete

### Tasks

- [ ] **10.1** Update `viewer/js/config.js` with production URL
  ```javascript
  const CONFIG = {
    dataBaseUrl: window.location.hostname === 'localhost'
      ? '../data/converted/'
      : 'https://YOUR_R2_PUBLIC_URL/',
    // ... rest of config
  };
  ```

- [ ] **10.2** Connect repo to Cloudflare Pages
  - Cloudflare Dashboard → Pages → Create Project
  - Connect GitHub repository
  - Build settings:
    - Build command: (leave empty)
    - Build output directory: `viewer`
  - Deploy

- [ ] **10.3** Configure R2 CORS for Pages domain
  ```json
  [
    {
      "AllowedOrigins": ["https://your-project.pages.dev", "http://localhost:*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"]
    }
  ]
  ```

- [ ] **10.4** Test production deployment
  - Visit Pages URL
  - Verify all features work
  - Check console for errors
  - Test on mobile

### Verification
- Public URL loads viewer
- Point clouds load from R2
- Timeline works
- Comparison mode works
- No CORS errors

---

## MILESTONE 11: Polish & Documentation
**Goal:** Production-ready with documentation.
**Verification:** README complete, no console warnings.

### Tasks

- [ ] **11.1** Add About modal to viewer
- [ ] **11.2** Add point attribute controls (color by elevation, classification)
- [ ] **11.3** Add keyboard shortcuts help panel
- [ ] **11.4** Optimize loading states and error handling
- [ ] **11.5** Write README.md with setup instructions
- [ ] **11.6** Write docs/data-preparation.md
- [ ] **11.7** Clean up console warnings
- [ ] **11.8** Test on Chrome, Firefox, Safari, mobile

### Verification
- README has quick start guide
- No console errors/warnings
- All browsers work
- Mobile is usable

---

## Quick Reference

### Local Development
```bash
# Install dependencies
poetry install

# Serve viewer locally
cd viewer && python -m http.server 8080

# Convert LAS files
poetry run python scripts/convert.py /path/to/file.las

# Batch convert
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

### Troubleshooting
- **Potree not loading:** Check browser console, verify libs/ path
- **CORS errors:** Update R2 CORS policy with your domain
- **Blank viewer:** Check metadata.json path in config.js
- **Conversion fails:** Ensure PotreeConverter is in PATH
