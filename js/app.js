const API_URL =
    "https://script.google.com/macros/s/AKfycbxBfssV4rJFYwVjUqNe2oq87ZBto61u-7zf0V1LYZoyR-ISrjUXRCWMzkOuK_hqEBaW/exec";

const App = {

    imageIndex: {},

    apiKey: null,

    sources: {},

    plants: [],

    settings: {},

    currentFolderId: null,

    async initialize() {

        try {

            await this.loadSources();

            this.registerEvents();

        } catch (error) {

            console.error(error);

            document.getElementById(
                "loadStatus"
            ).innerText =
                error.message;
        }
    },

    registerEvents() {

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
                () => this.showStartupScreen()
            );

        document
            .getElementById(
                "studyModeButton"
            )
            .addEventListener(
                "click",
                () => LearnMode.start()
            );

        document
            .getElementById(
                "multipleChoiceButton"
            )
            .addEventListener(
                "click",
                () => MultipleChoiceQuiz.start()
            );

        document
            .getElementById(
                "freeTextButton"
            )
            .addEventListener(
                "click",
                () => FreeTextQuiz.start()
            );
    },

    async loadIndex() {

        const url =
            `${API_URL}`
            + `?action=index`
            + `&folder=${encodeURIComponent(
                this.currentFolderId
            )}`;

        const response =
            await fetch(
                url
            );

        const data =
            await response.json();

        this.apiKey =
            data.apiKey;

        this.imageIndex =
            data.files || {};

        console.log(
            "Indexed files:",
            Object.keys(
                this.imageIndex
            ).length
        );
    },

    async loadSources() {

        const response =
            await fetch(
                "sources.yaml"
            );

        if (!response.ok) {

            throw new Error(
                `sources.yaml nem található (${response.status})`
            );
        }

        const yamlText =
            await response.text();

        const data =
            jsyaml.load(
                yamlText
            );

        this.sources =
            data.sources || {};

        const selector =
            document.getElementById(
                "sourceSelector"
            );

        selector.innerHTML = "";

        Object.keys(
            this.sources
        ).forEach(
            sourceName => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    sourceName;

                option.innerText =
                    sourceName;

                selector.appendChild(
                    option
                );
            }
        );
    },

    async loadSelectedSource() {

        try {

            const selector =
                document.getElementById(
                    "sourceSelector"
                );

            const sourceName =
                selector.value;

            const source =
                this.sources[
                    sourceName
                ];

            const folderUrl =
                source.drive_folder;

            this.currentFolderId =
                this.extractFolderId(
                    folderUrl
                );

            document.getElementById(
                "loadStatus"
            ).innerText =
                "Betöltés...";

            await this.loadIndex();

            await this.loadData();

            document.getElementById(
                "appTitle"
            ).innerText =
                this.settings.title
                || sourceName;

            this.showMainMenu();

            document.getElementById(
                "loadStatus"
            ).innerText =
                "";

        } catch (error) {

            console.error(
                error
            );

            document.getElementById(
                "loadStatus"
            ).innerText =
                error.message;
        }
    },

    async loadData() {

        const plantsYaml =
            await this.fetchTextFile(
                "plants.yaml"
            );

        const settingsYaml =
            await this.fetchTextFile(
                "settings.yaml"
            );

        const plantsData =
            jsyaml.load(
                plantsYaml
            );

        const settingsData =
            jsyaml.load(
                settingsYaml
            );

        this.settings =
            settingsData || {};

        if (
            Array.isArray(
                plantsData
            )
        ) {

            this.plants =
                plantsData;

        } else {

            this.plants =
                plantsData.plants
                || [];
        }

        console.log(
            "Plants loaded:",
            this.plants.length
        );
    },

    async fetchTextFile(
        relativePath
    ) {

        const url =
            `${API_URL}`
            + `?action=file`
            + `&folder=${encodeURIComponent(this.currentFolderId)}`
            + `&path=${encodeURIComponent(relativePath)}`;

        const response =
            await fetch(
                url
            );

        if (
            !response.ok
        ) {

            throw new Error(
                `Nem sikerült betölteni: ${relativePath}`
            );
        }

        return await response.text();
    },

    getImageUrl(
        relativePath
    ) {

        const file =
            this.imageIndex[
                relativePath
            ];

        if (!file) {

            throw new Error(
                `Kép nem található: ${relativePath}`
            );
        }

        return (
            "https://www.googleapis.com/drive/v3/files/"
            + file.id
            + "?alt=media&key="
            + this.apiKey
        );
    },

    extractFolderId(
        driveUrl
    ) {

        const match =
            driveUrl.match(
                /folders\/([a-zA-Z0-9_-]+)/
            );

        if (!match) {

            throw new Error(
                "Érvénytelen Google Drive mappa URL"
            );
        }

        return match[1];
    },

    showStartupScreen() {

        document
            .getElementById(
                "startupScreen"
            )
            .classList.remove(
                "hidden"
            );

        document
            .getElementById(
                "mainMenu"
            )
            .classList.add(
                "hidden"
            );

        document
            .getElementById(
                "content"
            )
            .classList.add(
                "hidden"
            );
    },

    showMainMenu() {

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
                "content"
            )
            .classList.add(
                "hidden"
            );
    },

    showContent() {

        document
            .getElementById(
                "mainMenu"
            )
            .classList.add(
                "hidden"
            );

        document
            .getElementById(
                "content"
            )
            .classList.remove(
                "hidden"
            );
    }
};

window.addEventListener(
    "DOMContentLoaded",
    () => App.initialize()
);