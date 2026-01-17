const CONFIG = {
  dataBaseUrl: window.location.hostname === 'localhost'
    ? '../data/converted/'
    : 'https://YOUR_R2_URL/',
  metadataUrl: 'metadata.json',
  pointBudget: 2_000_000,
  fov: 60,
  edlEnabled: true
};
