const LearnMode = {

    plants: [],

    currentIndex: 0,

    async start() {

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
                        👁️ Név mutatása
                    </button>

                </div>

                <img
                    id="plantImage"
                    class="plant-image"
                >

                <div
                    id="plantNames"
                    class="plant-names hidden"
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

            imageUrl =
                await App.getImageUrl(
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
                () => {

                    document
                        .getElementById(
                            "plantNames"
                        )
                        .classList
                        .remove(
                            "hidden"
                        );
                }
            );

        document
            .getElementById(
                "previousPlantButton"
            )
            .addEventListener(
                "click",
                async () => {

                    this.currentIndex--;

                    if (
                        this.currentIndex < 0
                    ) {

                        this.currentIndex =
                            this.plants.length - 1;
                    }

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

                    this.currentIndex++;

                    if (
                        this.currentIndex >=
                        this.plants.length
                    ) {

                        this.currentIndex = 0;
                    }

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

                    this.currentIndex =
                        Math.floor(
                            Math.random()
                            * this.plants.length
                        );

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