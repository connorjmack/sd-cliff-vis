function formatNumber(num) {
  if (num === null || num === undefined || Number.isNaN(num)) {
    return "Unknown";
  }
  return num.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) {
    return "Unknown date";
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

async function fetchMetadata(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load metadata: ${response.status}`);
  return response.json();
}
