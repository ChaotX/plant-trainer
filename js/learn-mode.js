const LearnMode = {
    plants: [],
    currentIndex: 0,
    showNames: false,
    renderToken: 0,
    nextEntry: null,
    randomEntry: null,

    async start() {
        this.showNames = false;
        this.plants = [...App.getQuizPlants()];
        if (App.settings.study?.shuffle) {
            this.shuffle(this.plants);
        }
        HistoryManager.clear();
        this.currentIndex = 0;
        HistoryManager.push(this.createEntry(this.plants[this.currentIndex]));
        App.showContent();
        await this.render();
        this.prepareNext();
    },

    getCurrentEntry() {
        return HistoryManager.current();
    },

    async render() {
        const token = ++this.renderToken;
        const entry = this.getCurrentEntry();
        const plant = entry.plant;
        const latinName = plant.names?.la?.[0] || "Ismeretlen";
        const hungarianName = plant.names?.hu?.[0] || "";
        const namesHiddenClass = this.showNames ? "" : "hidden";
        const toggleButtonText = this.showNames ? "🙈 Név elrejtése" : "👁️ Név mutatása";
        const previousButton = HistoryManager.canGoPrevious()
            ? `
<button id="previousPlantButton">
    ⬅️ Előző
</button>
`
            : "";
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
        ${previousButton}
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
        if (!HistoryManager.canGoNext()) {
            this.prepareNext();
        }
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

        const previousButton = document.getElementById("previousPlantButton");
        if (previousButton) {
            previousButton.onclick = async () => {
                const entry = HistoryManager.previous();
                if (!entry) {
                    return;
                }
                this.currentIndex = this.plants.indexOf(entry.plant);
                this.showNames = false;
                await this.render();
            };
        }

        document.getElementById("nextPlantButton").onclick = async () => {
            if (HistoryManager.canGoNext()) {
                const entry = HistoryManager.next();
                this.currentIndex = this.plants.indexOf(entry.plant);
                this.nextEntry = null;
                this.showNames = false;
                await this.render();
                return;
            }
            if (!this.nextEntry) {
                this.prepareNext();
            }
            HistoryManager.push(this.nextEntry);
            this.currentIndex = this.plants.indexOf(this.nextEntry.plant);
            this.nextEntry = null;
            this.showNames = false;
            await this.render();
        };

        document.getElementById("backToMenuButton").onclick = () => {
            App.showMainMenu();
        };
    },

    createEntry(plant) {
        return {
            plant,
            imagePath: ImageManager.pickRandomImage(plant)
        };
    },

    prepareNext() {
        if (this.nextEntry) {
            return;
        }
        if (HistoryManager.canGoNext()) {
            this.nextEntry = HistoryManager.history[HistoryManager.position + 1];
            ImageManager.preload(this.nextEntry.imagePath);
            return;
        }
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.plants.length) {
            nextIndex = 0;
        }
        this.nextEntry = this.createEntry(this.plants[nextIndex]);
        ImageManager.preload(this.nextEntry.imagePath);
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
