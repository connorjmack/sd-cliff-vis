const IS_LOCAL = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(window.location.hostname);

const CONFIG = {
  dataBaseUrl: IS_LOCAL
    ? '/data/converted/'
    : 'https://YOUR_R2_URL/',
  metadataUrl: 'metadata.json',
  testPointCloudUrl: null, // Disabled - now using metadata.json with multiple epochs
  testEpoch: {
    id: 'test',
    date: 'Test LAS',
    label: 'Test LAS',
    pointCount: null
  },
  pointBudget: 2_000_000,
  fov: 60,
  edlEnabled: true
};
