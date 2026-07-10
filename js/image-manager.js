const ImageManager = {
    app: null,
    imageCache: {},
    pendingRequests: {},
    randomCandidate: null,

    initialize(app) {
        this.app = app;
    },

    clear() {
        this.imageCache = {};
        this.pendingRequests = {};
        this.randomCandidate = null;
    },

    pickRandomImage(plant) {
        const images = plant.images || [];
        if (images.length === 0) {
            return null;
        }
        return images[Math.floor(Math.random() * images.length)];
    },

    async getImage(imagePath) {
        const start = performance.now();
        console.log("GET", imagePath);
        if (!imagePath) {
            throw new Error("Nincs imagePath");
        }
        if (this.imageCache[imagePath]) {
            console.log("CACHE HIT", imagePath, Math.round(performance.now() - start), "ms");
            return this.imageCache[imagePath];
        }
        if (this.pendingRequests[imagePath]) {
            console.log("PENDING", imagePath, Math.round(performance.now() - start), "ms");
            return await this.pendingRequests[imagePath];
        }
        console.log("DOWNLOAD", imagePath);
        const promise = this.downloadImage(imagePath);
        this.pendingRequests[imagePath] = promise;
        try {
            const image = await promise;
            console.log("DOWNLOADED", imagePath, Math.round(performance.now() - start), "ms");
            this.imageCache[imagePath] = image;
            console.log("GET DONE", imagePath, Math.round(performance.now() - start), "ms");
            return image;
        } finally {
            delete this.pendingRequests[imagePath];
        }
    },

    async downloadImage(imagePath) {
        const start = performance.now();
        const file = this.app.imageIndex[imagePath];
        if (!file) {
            throw new Error(`Kép nem található: ${imagePath}`);
        }
        const candidates = this.getCandidateUrls(file);
        if (candidates.length === 0) {
            throw new Error(`Kép nem található: ${imagePath}`);
        }
        let lastError;
        for (const url of candidates) {
            try {
                await this.probeImage(url, 15000);
                console.log("RESOLVED", imagePath, Math.round(performance.now() - start), "ms", url);
                return url;
            } catch (error) {
                lastError = error;
                console.warn("Candidate failed", imagePath, url, error);
            }
        }
        throw lastError;
    },

    getCandidateUrls(file) {
        const candidates = [];
        const thumbnailUrl = this.buildThumbnailUrl(file.thumbnailLink, 1600);
        if (thumbnailUrl) {
            candidates.push(thumbnailUrl);
        }
        if (this.app.apiKey) {
            candidates.push(
                "https://www.googleapis.com/drive/v3/files/" +
                    encodeURIComponent(file.id) +
                    "?alt=media&key=" +
                    encodeURIComponent(this.app.apiKey)
            );
        }
        return candidates;
    },

    buildThumbnailUrl(thumbnailLink, size) {
        if (!thumbnailLink || !/=s\d+$/.test(thumbnailLink)) {
            return null;
        }
        return thumbnailLink.replace(/=s\d+$/, `=s${size}`);
    },

    probeImage(url, timeoutMs) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const cleanup = () => {
                clearTimeout(timer);
                img.onload = null;
                img.onerror = null;
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error("Időtúllépés a kép betöltése közben"));
            }, timeoutMs);
            img.onload = () => {
                cleanup();
                resolve();
            };
            img.onerror = () => {
                cleanup();
                reject(new Error("Kép betöltése sikertelen"));
            };
            img.src = url;
        });
    },

    preload(imagePath) {
        console.log("PRELOAD", imagePath);
        if (!imagePath) {
            return;
        }
        this.getImage(imagePath).catch((error) => console.error(error));
    },

    async preloadPlant(plant) {
        if (!plant) {
            return;
        }
        const imagePath = this.pickRandomImage(plant);
        await this.preload(imagePath);
    }
};
