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
        console.log("GET", imagePath);
        if (!imagePath) {
            throw new Error("Nincs imagePath");
        }
        if (this.imageCache[imagePath]) {
            console.log("CACHE HIT", imagePath);
            return this.imageCache[imagePath];
        }
        if (this.pendingRequests[imagePath]) {
            console.log("PENDING", imagePath);
            return await this.pendingRequests[imagePath];
        }
        console.log("DOWNLOAD", imagePath);
        const promise = this.downloadImage(imagePath);
        this.pendingRequests[imagePath] = promise;
        try {
            const image = await promise;
            console.log("DOWNLOADED", imagePath);
            this.imageCache[imagePath] = image;
            return image;
        } finally {
            delete this.pendingRequests[imagePath];
        }
    },

    async downloadImage(imagePath) {
        const file = this.app.imageIndex[imagePath];
        if (!file) {
            throw new Error(`Kép nem található: ${imagePath}`);
        }
        const response = await fetch(
            API_URL + "?action=image" + "&id=" + encodeURIComponent(file.id)
        );
        const data = await response.json();
        const imageData = `data:${data.mimeType};base64,${data.data}`;
        const img = new Image();
        img.src = imageData;
        return imageData;
    },

    async preload(imagePath) {
        console.log("PRELOAD", imagePath);
        if (!imagePath) {
            return;
        }
        try {
            await this.getImage(imagePath);
        } catch (error) {
            console.error(error);
        }
    },

    async preloadPlant(plant) {
        if (!plant) {
            return;
        }
        const imagePath = this.pickRandomImage(plant);
        await this.preload(imagePath);
    },

    async prepareRandom(plants) {
        if (this.randomCandidate) {
            return;
        }
        const plantIndex = Math.floor(Math.random() * plants.length);
        const plant = plants[plantIndex];
        const imagePath = this.pickRandomImage(plant);
        await this.preload(imagePath);
        console.log("RANDOM READY", imagePath);
        this.randomCandidate = {
            plantIndex,
            imagePath
        };
    },

    consumeRandom() {
        const result = this.randomCandidate;
        this.randomCandidate = null;
        return result;
    }
};
