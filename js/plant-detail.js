const PlantDetail = {
    plant: null,
    imageIndex: 0,
    container: null,
    renderToken: 0,

    open(plant) {
        this.plant = plant;
        this.imageIndex = 0;
        Overlay.open("", (container) => {
            this.container = container;
            this.render();
        });
    },

    render() {
        const token = ++this.renderToken;
        const plant = this.plant;
        const images = plant.images || [];
        const names = App.getPlantDisplayName(plant, ["la", "hu"]);
        const tags = plant.tags?.length
            ? `<div class="plant-tags">(${plant.tags.join(" • ")})</div>`
            : "";
        const hasImages = images.length > 0;
        const prevDisabled = !hasImages || this.imageIndex <= 0;
        const nextDisabled = !hasImages || this.imageIndex >= images.length - 1;
        const counter = hasImages ? `${this.imageIndex + 1} / ${images.length}` : "0 / 0";

        this.container.innerHTML = `
<div class="plant-card overlay-card">
    <button id="closeDetailButton" class="overlay-close">✕</button>
    <div id="detailImageContainer">
        <div class="plant-image loading">
            Kép betöltése...
        </div>
    </div>
    <div class="navigation-buttons">
        <button id="prevImageButton" ${prevDisabled ? "disabled" : ""}>⬅️</button>
        <span class="quiz-progress">${counter}</span>
        <button id="nextImageButton" ${nextDisabled ? "disabled" : ""}>➡️</button>
    </div>
    <div class="plant-names">
        ${names}
        ${tags}
    </div>
</div>
`;
        this.registerEvents();

        const imageContainer = this.container.querySelector("#detailImageContainer");
        if (!hasImages) {
            imageContainer.innerHTML = App.getMissingImageHtml(plant, null);
            return;
        }
        const imagePath = images[this.imageIndex];
        requestAnimationFrame(() => {
            ImageManager.getImage(imagePath)
                .then((src) => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    imageContainer.innerHTML = `<img src="${src}" class="plant-image">`;
                })
                .catch(() => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    imageContainer.innerHTML = App.getMissingImageHtml(plant, imagePath);
                });
        });
    },

    registerEvents() {
        this.container.querySelector("#closeDetailButton").onclick = () => Overlay.close();

        const prevButton = this.container.querySelector("#prevImageButton");
        if (prevButton) {
            prevButton.onclick = () => {
                this.imageIndex--;
                this.render();
            };
        }

        const nextButton = this.container.querySelector("#nextImageButton");
        if (nextButton) {
            nextButton.onclick = () => {
                this.imageIndex++;
                this.render();
            };
        }
    }
};
