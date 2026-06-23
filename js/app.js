const App = {

    links: {},

    settings: {},

    plants: [],

    imageUrls: new Map(),

    currentSource: null,

    async initialize() {

        document
            .getElementById(
                "loadSourceButton"
            )
            .addEventListener(
                "click",
                () => this.loadSelectedSource()
            );

        document
            .getElementById(
                "changeSourceButton"
            )
            .addEventListener(
                "click",
                () => this.changeSource()
            );

        document
            .getElementById(
                "studyModeButton"
            )
            .addEventListener(
                "click",
                () => StudyMode.start()
            );

        document
            .getElementById(
                "multipleChoiceButton"
            )
            .addEventListener(
                "click",
                () =>
                    MultipleChoiceQuiz.start()
            );

        document
            .getElementById(
                "freeTextButton"
            )
            ?.addEventListener(
                "click",
                () =>
                    FreeTextQuiz.start()
            );

        document
            .getElementById(
                "statsButton"
            )
            .addEventListener(
                "click",
                () => Statistics.show()
            );

        await this.loadLinksYaml();
    },

    async loadLinksYaml() {

        const response =
            await fetch(
                "links.yaml"
            );

        if (!response.ok) {

            throw new Error(
                "links.yaml nem tölthető be"
            );
        }

        const text =
            await response.text();

        this.links =
            jsyaml.load(text);

        const selector =
            document.getElementById(
                "sourceSelector"
            );

        selector.innerHTML = "";

        const sources =
            this.links.sources || {};

        for (
            const sourceName
            of Object.keys(sources)
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                sourceName;

            option.textContent =
                sourceName;

            selector.appendChild(
                option
            );
        }

        document
            .getElementById(
                "loadStatus"
            )
            .textContent =
            `${Object.keys(sources).length} forrás található`;
    },

    async loadSelectedSource() {

        const selector =
            document.getElementById(
                "sourceSelector"
            );

        const sourceName =
            selector.value;

        if (!sourceName) {

            return;
        }

        await this.loadSource(
            sourceName
        );
    },

    async loadSource(
        sourceName
    ) {

        const source =
            this.links.sources[
            sourceName
            ];

        if (!source) {

            throw new Error(
                `Ismeretlen forrás: ${sourceName}`
            );
        }

        document
            .getElementById(
                "loadStatus"
            )
            .textContent =
            "Betöltés...";

        this.currentSource =
            sourceName;

        const plantsResponse =
            await fetch(
                source.plants_yaml
            );

        const settingsResponse =
            await fetch(
                source.settings_yaml
            );

        if (
            !plantsResponse.ok
        ) {

            throw new Error(
                "plants.yaml letöltése sikertelen"
            );
        }

        if (
            !settingsResponse.ok
        ) {

            throw new Error(
                "settings.yaml letöltése sikertelen"
            );
        }

        const plantsText =
            await plantsResponse.text();

        const settingsText =
            await settingsResponse.text();

        const plantsYaml =
            jsyaml.load(
                plantsText
            );

        const settingsYaml =
            jsyaml.load(
                settingsText
            );

        this.settings =
            settingsYaml;

        this.plants =
            plantsYaml.plants;

        this.imageUrls.clear();

        for (
            const [path, url]
            of Object.entries(
                source.images
            )
        ) {

            this.imageUrls.set(
                path,
                url
            );

            const filename =
                path.split("/")
                    .pop();

            this.imageUrls.set(
                filename,
                url
            );
        }

        document
            .getElementById(
                "appTitle"
            )
            .innerText =
            this.settings.title
            || "🌿 Növényfelismerő";

        document
            .getElementById(
                "startupScreen"
            )
            .classList.add(
                "hidden"
            );

        document
            .getElementById(
                "mainMenu"
            )
            .classList.remove(
                "hidden"
            );

        document
            .getElementById(
                "loadStatus"
            )
            .textContent =
            "";

        console.log(
            `Betöltve: ${sourceName}`
        );

        console.log(
            `Növények: ${this.plants.length}`
        );

        document.getElementById(
            "content"
        ).innerHTML = `
            <h2>${this.plants[0].names.la[0]}</h2>
            <img
                src="${this.getImageUrl(this.plants[0].images[0])}"
                class="plant-image"
            >
        `;
    },

    changeSource() {

        document
            .getElementById(
                "mainMenu"
            )
            .classList.add(
                "hidden"
            );

        document
            .getElementById(
                "startupScreen"
            )
            .classList.remove(
                "hidden"
            );

        document
            .getElementById(
                "content"
            )
            .innerHTML = "";
    },

    getImageUrl(
        imagePath
    ) {

        const url =
            this.imageUrls.get(
                imagePath
            );

        if (!url) {

            console.warn(
                "Kép nem található:",
                imagePath
            );

            return "";
        }

        return url;
    }
};

window.addEventListener(
    "DOMContentLoaded",
    () => App.initialize()
);