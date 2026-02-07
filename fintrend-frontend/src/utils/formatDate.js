// ============================================
// DATE FORMATTER - UTILITY FUNCTION
// NO HARDCODING
// ============================================

/**
 * Format timestamp to friendly relative date
 * @param {number|string} timestamp - Unix timestamp or ISO string
 * @returns {string} Formatted date string
 */
export default function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';

  const ts = typeof timestamp === 'number' 
    ? timestamp 
    : Date.parse(String(timestamp));

  if (Number.isNaN(ts)) return 'Unknown';

  const now = Date.now();
  const diff = now - ts;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // For older articles, show formatted date
  const date = new Date(ts);
  const oneYearAgo = now - 31536000000;
  
  const options = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  if (ts < oneYearAgo) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
}