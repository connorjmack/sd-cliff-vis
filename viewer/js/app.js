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

  const url = CONFIG.dataBaseUrl + epoch.path + "cloud.js";

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
