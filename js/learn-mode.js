const LearnMode = {

    plants: [],

    history: [],

    currentIndex: 0,

    showNames: false,

    async start() {

        this.showNames = false;

        this.currentIndex = 0;

        this.history = [];

        this.plants =
            [...App.plants];

        if (
            App.settings.study?.shuffle
        ) {

            this.shuffle(
                this.plants
            );
        }

        this.currentIndex = 0;

        App.showContent();

        await this.render();
    },

    async render() {

        const namesHiddenClass =
            this.showNames
                ? ""
                : "hidden";

        const toggleButtonText =
            this.showNames
                ? "🙈 Név elrejtése"
                : "👁️ Név mutatása";

        const plant =
            this.plants[
                this.currentIndex
            ];

        console.log(
            "PLANT:",
            plant
        );

        console.log(
            "IMAGE PATH:",
            plant.images?.[0]
        );

        const latinName =
            plant.names?.la?.[0]
            || "Ismeretlen";

        const hungarianName =
            plant.names?.hu?.[0]
            || "";

        const imagePath =
            plant.images?.[0];

        document
            .getElementById(
                "content"
            )
            .innerHTML = `

            <div class="plant-card">

                <div class="center">

                    <button
                        id="showAnswerButton"
                    >
                        ${toggleButtonText}
                    </button>

                </div>

                <img
                    id="plantImage"
                    class="plant-image"
                >

                <div
                    id="plantNames"
                    class="plant-names ${namesHiddenClass}"
                >

                    <div
                        class="plant-latin"
                    >
                        ${latinName}
                    </div>

                    <div
                        class="plant-hungarian"
                    >
                        ${hungarianName}
                    </div>

                </div>

                <div
                    class="navigation-buttons"
                >

                    <button
                        id="previousPlantButton"
                    >
                        ⬅️ Előző
                    </button>

                    <button
                        id="randomPlantButton"
                    >
                        🎲 Véletlen
                    </button>

                    <button
                        id="nextPlantButton"
                    >
                        Következő ➡️
                    </button>

                </div>

                <hr>

                <button
                    id="backToMenuButton"
                >
                    🏠 Menü
                </button>

            </div>
        `;
        
        let imageUrl;

        try {

            const imageUrl =
                App.getImageUrl(
                    imagePath
                );

            document
                .getElementById(
                    "plantImage"
                )
                .src =
                imageUrl;

        } catch (error) {

            console.error(
                error
            );

            document
                .getElementById(
                    "plantImage"
                )
                .outerHTML = `
                    <div
                        class="image-error"
                    >
                        ❌ ${error.message}
                    </div>
                `;
        }

        this.registerEvents();
    },

    registerEvents() {

        document
            .getElementById(
                "showAnswerButton"
            )
            .addEventListener(
                "click",
                async () => {

                    this.showNames =
                        !this.showNames;

                    await this.render();
                }
            );

        document
        .getElementById(
            "previousPlantButton"
        )
        .addEventListener(
            "click",
            async () => {

                if (
                    this.history.length > 0
                ) {

                    this.currentIndex =
                        this.history.pop();

                } else {

                    this.currentIndex--;

                    if (
                        this.currentIndex < 0
                    ) {

                        this.currentIndex =
                            this.plants.length - 1;
                    }
                }
                this.showNames = false;
                await this.render();
            }
        );

        document
            .getElementById(
                "nextPlantButton"
            )
            .addEventListener(
                "click",
                async () => {
                    this.history.push(
                        this.currentIndex
                    );

                    this.currentIndex++;

                    if (
                        this.currentIndex >=
                        this.plants.length
                    ) {

                        this.currentIndex = 0;
                    }
                    this.showNames = false;
                    await this.render();
                }
            );

        document
            .getElementById(
                "randomPlantButton"
            )
            .addEventListener(
                "click",
                async () => {

                    this.history.push(
                        this.currentIndex
                    );

                    this.currentIndex =
                        Math.floor(
                            Math.random()
                            * this.plants.length
                        );
                    this.showNames = false;
                    await this.render();
                }
            );

        document
            .getElementById(
                "backToMenuButton"
            )
            .addEventListener(
                "click",
                () => {

                    App.showMainMenu();
                }
            );
    },

    shuffle(array) {

        for (
            let i = array.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random()
                    * (i + 1)
                );

            [
                array[i],
                array[j]
            ] = [
                array[j],
                array[i]
            ];
        }
    }
};