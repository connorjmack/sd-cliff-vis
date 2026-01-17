# San Diego Coastal LiDAR Viewer - Project Context

## Project Overview
This project is an interactive 3D web viewer for monitoring erosion of San Diego coastal cliffs using time-series LiDAR point cloud data. It allows users to visualize and compare different "epochs" (points in time) of LiDAR scans.

**Primary Goal:** Deliver a performant, browser-based viewer for massive point cloud datasets, enabling side-by-side comparison of coastal changes over time.

## Tech Stack & Architecture

*   **Frontend (Viewer):**
    *   **Core:** [Potree 2.0](https://github.com/potree/potree) (WebGL point cloud renderer).
    *   **Framework:** Vanilla JavaScript (ES6+), CSS3.
    *   **Dependencies:** jQuery, Three.js (vendored within Potree).
*   **Backend / Data Processing:**
    *   **Language:** Python 3.10+.
    *   **Key Libraries:** `laspy` (LiDAR manipulation), `numpy`.
    *   **Tooling:** `PotreeConverter` (CLI tool for creating octrees).
*   **Infrastructure (Planned):**
    *   **Hosting:** Cloudflare Pages (Frontend).
    *   **Storage:** Cloudflare R2 (Point cloud data & metadata).

## Directory Structure

*   **`viewer/`**: The web application.
    *   `index.html`: Main entry point.
    *   `js/`: Application logic (`app.js`, `config.js`, `utils.js`).
    *   `libs/potree/`: Vendored Potree library distribution.
*   **`scripts/`**: Python utilities for data processing (converting LAS -> Potree) and uploading to R2. (See `plan.md` for implementation details).
*   **`data/`**: Local data storage (Git-ignored).
    *   `raw/`: Input LAS/LAZ files.
    *   `converted/`: Processed Potree octrees and `metadata.json`.
*   **`tools/`**: Helper tools (PotreeConverter).

## Development Workflow

### Prerequisites
*   Python 3.10+
*   Poetry (Python dependency management)
*   `PotreeConverter` binary (needs to be in PATH or configured)

### Setup & Running
1.  **Install Python Dependencies:**
    ```bash
    poetry install
    ```
2.  **Start Local Viewer:**
    ```bash
    cd viewer && python -m http.server 8080
    # Open http://localhost:8080/potree-test.html (smoke test)
    # Open http://localhost:8080/index.html (main app)
    ```

### Data Pipeline (Planned)
The workflow involves converting raw LAS files into a format Potree can stream (Octree) and updating a central metadata registry.

1.  **Convert:** `python scripts/convert.py input.las -o data/converted`
2.  **Batch & Metadata:** `python scripts/batch_convert.py data/raw`
3.  **Upload:** `python scripts/upload_to_r2.py`

## Configuration
*   **`viewer/js/config.js`**: Controls the data source URL. Switches between local (`../data/converted/`) and production (R2 URL) based on hostname.
*   **`pyproject.toml`**: Python project configuration and dependencies.
*   **`.env`**: (Git-ignored) Stores R2 credentials.

## Roadmap & Status
The project follows a strict milestone-based plan documented in **`plan.md`**.

*   **Current Status:** Scaffolding complete. Basic viewer implementation in progress. Mock data setup.
*   **Next Steps:** Implement the Python conversion scripts (`scripts/convert.py`, etc.) and the Timeline UI.
*   **Reference:** See `CLAUDE.md` for a quick command reference and `plan.md` for the detailed task list.
