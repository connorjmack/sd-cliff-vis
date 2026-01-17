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

  // Load most recent epoch
  if (metadata.epochs.length > 0) {
    const latestEpoch = metadata.epochs[metadata.epochs.length - 1];
    await loadEpoch(latestEpoch);
  } else {
    throw new Error("No epochs found in metadata");
  }
}

async function loadEpoch(epoch) {
  const url = CONFIG.dataBaseUrl + epoch.path + "cloud.js";
  return loadPointCloud(url, epoch, { silent: false });
}

function loadPointCloud(url, epoch, options = {}) {
  const { silent } = options;
  showLoading();

  // Remove existing point cloud
  if (currentPointCloud) {
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

document.addEventListener("DOMContentLoaded", init);
