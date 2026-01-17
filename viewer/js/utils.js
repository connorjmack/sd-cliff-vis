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
