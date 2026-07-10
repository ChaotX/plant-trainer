const LearnMode = {
    plants: [],
    currentIndex: 0,
    showNames: false,
    renderToken: 0,
    nextEntry: null,
    randomEntry: null,

    async start() {
        if (!App.ensureEnoughPlants(1)) {
            return;
        }
        this.showNames = false;
        this.plants = [...App.getQuizPlants()];
        this.shuffle(this.plants);
        FlashcardHistory.clear();
        this.currentIndex = 0;
        this.nextEntry = null;
        FlashcardHistory.push(this.createEntry(this.plants[this.currentIndex]));
        App.showContent();
        await this.render();
        this.prepareNext();
    },

    getCurrentEntry() {
        return FlashcardHistory.current();
    },

    async render() {
        const token = ++this.renderToken;
        const entry = this.getCurrentEntry();
        const plant = entry.plant;
        const names = App.getPlantDisplayName(plant, ["la", "hu"]);
        const namesHiddenClass = this.showNames ? "" : "hidden";
        const previousButton = `<button id="previousPlantButton" ${FlashcardHistory.canGoPrevious() ? "" : "disabled"}>⬅️</button>`;
        const tags = plant.tags?.length
            ? `<div class="plant-tags">(${plant.tags.join(" • ")})</div>`
            : "";
        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <div class="navigation-buttons">
        ${previousButton}
        <button id="showAnswerButton">
            ${this.showNames ? "🙈 Név" : "👁️ Név"}
        </button>
        <button id="nextPlantButton">➡️</button>
    </div>
    <div id="plantNames" class="plant-names ${namesHiddenClass}">
        ${names}
        ${tags}
    </div>
    <div id="plantImageContainer" class="plant-image-wrap">
        <button id="plantInfoButton" class="info-badge" title="Növény adatlap">ℹ️</button>
        <div id="plantImageInner">
            <div class="plant-image loading">
                Kép betöltése...
            </div>
        </div>
    </div>
</div>
`;
        this.registerEvents();
        if (!FlashcardHistory.canGoNext()) {
            this.prepareNext();
        }
        requestAnimationFrame(() => {
            ImageManager.getImage(entry.imagePath)
                .then((imageData) => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("plantImageInner").innerHTML =
                        `<img src="${imageData}" class="plant-image">`;
                })
                .catch(() => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("plantImageInner").innerHTML =
                        App.getMissingImageHtml(plant, entry.imagePath);
                });
        });
    },

    registerEvents() {
        document.getElementById("plantInfoButton").onclick = () => {
            PlantDetail.open(this.getCurrentEntry().plant);
        };

        document.getElementById("showAnswerButton").onclick = () => {
            this.showNames = !this.showNames;
            document.getElementById("plantNames").classList.toggle("hidden");
            document.getElementById("showAnswerButton").textContent = this.showNames
                ? "🙈 Név"
                : "👁️ Név";
        };

        document.getElementById("previousPlantButton").onclick = async () => {
            if (!FlashcardHistory.canGoPrevious()) {
                return;
            }
            const entry = FlashcardHistory.previous();
            this.currentIndex = this.plants.indexOf(entry.plant);
            this.showNames &&= !App.settings.study.hide_name_on_next;
            await this.render();
        };

        document.getElementById("nextPlantButton").onclick = async () => {
            if (FlashcardHistory.canGoNext()) {
                const entry = FlashcardHistory.next();
                this.currentIndex = this.plants.indexOf(entry.plant);
                this.nextEntry = null;
                this.showNames &&= !App.settings.study.hide_name_on_next;
                await this.render();
                return;
            }
            if (!this.nextEntry) {
                this.prepareNext();
            }
            console.log("PUSH NEXT", this.nextEntry.plant.names.la[0], this.nextEntry.imagePath);
            FlashcardHistory.push(this.nextEntry);
            this.currentIndex = this.plants.indexOf(this.nextEntry.plant);
            this.nextEntry = null;
            this.showNames &&= !App.settings.study.hide_name_on_next;
            await this.render();
        };
    },

    createEntry(plant) {
        return {
            plant,
            imagePath: ImageManager.pickRandomImage(plant)
        };
    },

    prepareNext() {
        console.log("PREPARE NEXT", this.currentIndex, this.plants[this.currentIndex].names.la[0]);
        if (this.nextEntry) {
            return;
        }
        if (FlashcardHistory.canGoNext()) {
            this.nextEntry = FlashcardHistory.history[FlashcardHistory.position + 1];
            console.log("NEXT ENTRY", this.nextEntry.plant.names.la[0], this.nextEntry.imagePath);
            ImageManager.preload(this.nextEntry.imagePath);
            return;
        }
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.plants.length) {
            nextIndex = 0;
        }
        this.nextEntry = this.createEntry(this.plants[nextIndex]);
        console.log("NEXT ENTRY", this.nextEntry.plant.names.la[0], this.nextEntry.imagePath);
        ImageManager.preload(this.nextEntry.imagePath);
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
