const ApiClient = {
    async fetchWithRetry(url, options = {}, { retries = 2, timeoutMs = 20000, retryDelayMs = 1000 } = {}) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            } catch (error) {
                lastError = error;
                if (attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
                }
            } finally {
                clearTimeout(timeoutId);
            }
        }
        throw lastError;
    }
};
