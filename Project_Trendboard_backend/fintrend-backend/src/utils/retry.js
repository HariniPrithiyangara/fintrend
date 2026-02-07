// ============================================
// RETRY UTILITY - EXPONENTIAL BACKOFF
// ============================================

async function retry(fn, options = {}) {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 10000,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const timeout = Math.min(
          minTimeout * Math.pow(2, attempt - 1),
          maxTimeout
        );

        if (onRetry) {
          onRetry(attempt, retries, timeout, error);
        }

        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    }
  }

  throw lastError;
}

module.exports = retry;