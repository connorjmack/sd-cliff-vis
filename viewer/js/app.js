let viewer = null;
let currentPointCloud = null;
let metadata = null;
let hudRenderHooked = false;
let timeline = null;

async function init() {
  // Initialize Potree viewer
  viewer = new Potree.Viewer(document.getElementById("potree-render-area"));
  viewer.setEDLEnabled(CONFIG.edlEnabled);
  viewer.setPointBudget(CONFIG.pointBudget);
  viewer.setFOV(CONFIG.fov);
  viewer.setBackground("gradient");

  if (CONFIG.testPointCloudUrl) {
    await tryLoadTestPointCloud();
    return;
  }

  try {
    await loadFromMetadata();
  } catch (error) {
    console.error("Failed to initialize:", error);
    showError("Failed to load viewer data");
  }
}

async function tryLoadTestPointCloud() {
  const testEpoch = CONFIG.testEpoch || {
    id: "test",
    date: "Test LAS",
    label: "Test LAS",
    pointCount: null
  };

  const loaded = await loadPointCloud(CONFIG.testPointCloudUrl, testEpoch, { silent: false });
  if (!loaded) {
    showError("Test point cloud not found. Convert data/raw/test.las and try again.");
  }
  return loaded;
}

async function loadFromMetadata() {
  metadata = await fetchMetadata(CONFIG.dataBaseUrl + CONFIG.metadataUrl);
  console.log("Loaded metadata:", metadata.epochs.length, "epochs");

  if (metadata.epochs.length === 0) {
    throw new Error("No epochs found in metadata");
  }

  // Create timeline
  timeline = new Timeline(metadata.epochs, loadEpoch);
  timeline.render(document.getElementById("timeline-container"));

  // Load first epoch
  await loadEpoch(timeline.getCurrentEpoch());
}

async function loadEpoch(epoch) {
  const url = CONFIG.dataBaseUrl + epoch.path + "pointclouds/metadata.json";
  return loadPointCloud(url, epoch, { silent: false });
}

function loadPointCloud(url, epoch, options = {}) {
  const { silent } = options;
  showLoading();

  // Remove existing point cloud
  if (currentPointCloud) {
    stopHudUpdates();
    viewer.scene.pointclouds = [];
    currentPointCloud = null;
  }

  return new Promise((resolve, reject) => {
    Potree.loadPointCloud(url, epoch.id || "pointcloud", e => {
      try {
        const pointcloud = e.pointcloud;

        // Configure point cloud material
        let material = pointcloud.material;
        material.size = 1;
        material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
        material.shape = Potree.PointShape.SQUARE;

        viewer.scene.addPointCloud(pointcloud);
        currentPointCloud = pointcloud;

        // Fit camera to point cloud
        viewer.fitToScreen();
        startHudUpdates();

        updateEpochInfo(epoch);
        hideLoading();
        resolve(true);
      } catch (error) {
        console.error("Failed to load point cloud:", error);
        if (!silent) {
          showError("Failed to load point cloud: " + error.message);
        }
        hideLoading();
        reject(error);
      }
    });
  });
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

function updateHud() {
  updateScaleBar();
  updateNorthArrow();
}

function worldDistanceToPixels(start, end) {
  if (!viewer) return null;
  const camera = viewer.scene.getActiveCamera();
  if (!camera || !viewer.renderer) return null;
  const size = viewer.renderer.getSize(new THREE.Vector2());
  const startNDC = start.clone().project(camera);
  const endNDC = end.clone().project(camera);
  const dx = (endNDC.x - startNDC.x) * 0.5 * size.x;
  const dy = (endNDC.y - startNDC.y) * 0.5 * size.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateScaleBar() {
  if (!viewer || !currentPointCloud) return;
  const bar = document.getElementById("scale-bar-bar");
  const label = document.getElementById("scale-bar-label");
  if (!bar || !label) return;

  const bb = currentPointCloud.boundingBox.clone().applyMatrix4(currentPointCloud.matrixWorld);
  const center = bb.getCenter(new THREE.Vector3());
  const base = new THREE.Vector3(center.x, bb.min.y, bb.min.z);

  const targetPx = 120;
  const candidates = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  let bestLen = candidates[0];
  let bestPx = 0;
  let bestDiff = Infinity;

  for (const len of candidates) {
    const end = base.clone().add(new THREE.Vector3(len, 0, 0));
    const px = worldDistanceToPixels(base, end);
    if (!px) continue;
    const diff = Math.abs(px - targetPx);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestLen = len;
      bestPx = px;
    }
  }

  if (!bestPx) return;
  const clampedPx = Math.max(40, Math.min(bestPx, 220));
  bar.style.width = `${clampedPx}px`;
  let displayLen = bestLen;
  if (bestLen < 1) {
    displayLen = bestLen.toFixed(2);
  } else if (!Number.isInteger(bestLen)) {
    displayLen = bestLen.toFixed(1);
  }
  label.textContent = `${displayLen} m`;
}

function startHudUpdates() {
  updateHud();
  if (hudRenderHooked || !viewer) return;

  viewer.addEventListener("render.pass.end", updateHud);
  if (viewer.controls && viewer.controls.addEventListener) {
    viewer.controls.addEventListener("change", updateHud);
  }

  hudRenderHooked = true;
}

function stopHudUpdates() {
  // listeners stay attached; no action needed between loads
}

function updateNorthArrow() {
  if (!viewer) return;
  const arrow = document.getElementById("north-arrow");
  if (!arrow) return;

  const camera = viewer.scene.getActiveCamera();
  if (!camera) return;

  const origin = new THREE.Vector3(0, 0, 0).project(camera);
  const north = new THREE.Vector3(0, 1, 0).project(camera);

  const dx = north.x - origin.x;
  const dy = north.y - origin.y;
  if (dx === 0 && dy === 0) return;

  const angleRad = Math.atan2(dx, dy); // screen-space angle from up
  const angleDeg = THREE.MathUtils.radToDeg(angleRad);
  arrow.style.setProperty("--north-rotation", `${angleDeg}deg`);
}

window.addEventListener("resize", updateHud);

document.addEventListener("DOMContentLoaded", init);
