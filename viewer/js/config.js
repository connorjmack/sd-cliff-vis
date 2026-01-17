const CONFIG = {
  dataBaseUrl: window.location.hostname === 'localhost'
    ? '../data/converted/'
    : 'https://YOUR_R2_URL/',
  metadataUrl: 'metadata.json',
  testPointCloudUrl: window.location.hostname === 'localhost'
    ? '../data/converted/test/cloud.js'
    : null,
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
