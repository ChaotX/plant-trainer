const LearnMode = {
    plants: [],
    currentIndex: 0,
    showNames: false,
    renderToken: 0,

    async start() {
        this.showNames = false;
        this.plants = [...App.plants];
        if (App.settings.study?.shuffle) {
            this.shuffle(this.plants);
        }
        HistoryManager.clear();
        this.currentIndex = 0;
        const firstPlant = this.plants[this.currentIndex];
        HistoryManager.push({
            plantIndex: this.currentIndex,
            imagePath: ImageManager.pickRandomImage(firstPlant)
        });
        App.showContent();
        await this.render();
    },

    getCurrentEntry() {
        return HistoryManager.current();
    },

    getCurrentPlant() {
        return this.plants[this.getCurrentEntry().plantIndex];
    },

    async render() {
        const token = ++this.renderToken;
        const entry = this.getCurrentEntry();
        const plant = this.plants[entry.plantIndex];
        const latinName = plant.names?.la?.[0] || "Ismeretlen";
        const hungarianName = plant.names?.hu?.[0] || "";
        const namesHiddenClass = this.showNames ? "" : "hidden";
        const toggleButtonText = this.showNames ? "🙈 Név elrejtése" : "👁️ Név mutatása";
        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <div class="center">
        <button id="showAnswerButton">
            ${toggleButtonText}
        </button>
    </div>
    <div id="plantImageContainer">
        <div class="plant-image loading">
            Kép betöltése...
        </div>
    </div>
    <div id="plantNames" class="plant-names ${namesHiddenClass}">
        <div class="plant-latin">
            ${latinName}
        </div>
        <div class="plant-hungarian">
            ${hungarianName}
        </div>
    </div>
    <div class="navigation-buttons">
        <button id="previousPlantButton">
            ⬅️ Előző
        </button>
        <button id="randomPlantButton">
            🎲 Véletlen
        </button>
        <button id="nextPlantButton">
            Következő ➡️
        </button>
    </div>
    <hr>
    <button id="backToMenuButton">
        🏠 Menü
    </button>
</div>
`;
        this.registerEvents();
        this.preloadNext();
        this.preloadRandom();

        requestAnimationFrame(() => {
            ImageManager.getImage(entry.imagePath)
                .then((imageData) => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("plantImageContainer").innerHTML = `
        <img src="${imageData}" class="plant-image">
        `;
                })
                .catch(() => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("plantImageContainer").innerHTML =
                        App.getMissingImageHtml(plant, entry.imagePath);
                });
        });
    },

    registerEvents() {
        document.getElementById("showAnswerButton").onclick = () => {
            this.showNames = !this.showNames;
            document.getElementById("plantNames").classList.toggle("hidden");
            document.getElementById("showAnswerButton").textContent = this.showNames
                ? "🙈 Név elrejtése"
                : "👁️ Név mutatása";
        };

        document.getElementById("previousPlantButton").onclick = async () => {
            const entry = HistoryManager.previous();
            if (!entry) {
                return;
            }
            this.currentIndex = entry.plantIndex;
            this.showNames = false;
            await this.render();
        };

        document.getElementById("nextPlantButton").onclick = async () => {
            if (HistoryManager.canGoNext()) {
                const entry = HistoryManager.next();
                this.currentIndex = entry.plantIndex;
                this.showNames = false;
                await this.render();
                return;
            }
            this.currentIndex++;
            if (this.currentIndex >= this.plants.length) {
                this.currentIndex = 0;
            }
            const plant = this.plants[this.currentIndex];
            HistoryManager.push({
                plantIndex: this.currentIndex,
                imagePath: ImageManager.pickRandomImage(plant)
            });
            this.showNames = false;
            await this.render();
        };
        document.getElementById("randomPlantButton").onclick = async () => {
            await ImageManager.prepareRandom(this.plants);
            const entry = ImageManager.consumeRandom();
            this.currentIndex = entry.plantIndex;
            HistoryManager.push(entry);
            this.showNames = false;
            await this.render();
        };

        document.getElementById("backToMenuButton").onclick = () => {
            App.showMainMenu();
        };
    },

    preloadNext() {
        if (HistoryManager.canGoNext()) {
            const entry = HistoryManager.history[HistoryManager.position + 1];
            ImageManager.preload(entry.imagePath);
            return;
        }
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.plants.length) {
            nextIndex = 0;
        }
        const plant = this.plants[nextIndex];
        ImageManager.preload(ImageManager.pickRandomImage(plant));
    },

    preloadRandom() {
        ImageManager.prepareRandom(this.plants);
    },
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
