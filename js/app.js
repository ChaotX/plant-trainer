const API_URL =
    "https://script.google.com/macros/s/AKfycbxBfssV4rJFYwVjUqNe2oq87ZBto61u-7zf0V1LYZoyR-ISrjUXRCWMzkOuK_hqEBaW/exec";

const App = {
    defaultSettings: {
        title: "Növényfelismerő",

        difficulty: 1,

        study: {
            shuffle: true
        },

        quiz: {
            multiple_choice: {
                question_count: 10,
                choice_count: 4,
                language: "la"
            },

            free_text: {
                question_count: 10,
                required_languages: ["la"]
            }
        }
    },
    imageIndex: {},
    apiKey: null,
    sources: {},
    plants: [],
    settings: {},
    currentFolderId: null,

    async initialize() {
        try {
            ImageManager.initialize(this);
            await this.loadSources();
            this.registerEvents();
        } catch (error) {
            console.error(error);
            document.getElementById("loadStatus").innerText = error.message;
        }
    },

    registerEvents() {
        document
            .getElementById("loadSourceButton")
            .addEventListener("click", () => this.loadSelectedSource());
        document
            .getElementById("changeSourceButton")
            .addEventListener("click", () => this.showStartupScreen());
        document
            .getElementById("studyModeButton")
            .addEventListener("click", () => LearnMode.start());
        document
            .getElementById("multipleChoiceButton")
            .addEventListener("click", () => MultipleChoiceQuiz.start());
        document
            .getElementById("freeTextButton")
            .addEventListener("click", () => FreeTextQuiz.start());
        document.getElementById("settingsButton").addEventListener("click", () => Settings.start());
    },

    async loadIndex() {
        const url =
            `${API_URL}` + `?action=index` + `&folder=${encodeURIComponent(this.currentFolderId)}`;
        const response = await fetch(url);
        const data = await response.json();
        this.apiKey = data.apiKey;
        this.imageIndex = data.files || {};
        console.log("Indexed files:", Object.keys(this.imageIndex).length);
    },

    async loadSources() {
        const response = await fetch("sources.yaml");
        if (!response.ok) {
            throw new Error(`sources.yaml nem található (${response.status})`);
        }
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        this.sources = data.sources || {};
        const selector = document.getElementById("sourceSelector");
        selector.innerHTML = "";
        Object.keys(this.sources).forEach((sourceName) => {
            const option = document.createElement("option");
            option.value = sourceName;
            option.innerText = sourceName;
            selector.appendChild(option);
        });
    },

    async loadSelectedSource() {
        try {
            const selector = document.getElementById("sourceSelector");
            const sourceName = selector.value;
            const source = this.sources[sourceName];
            const folderUrl = source.drive_folder;
            this.currentFolderId = this.extractFolderId(folderUrl);
            ImageManager.clear();
            document.getElementById("loadStatus").innerText = "Betöltés...";
            await this.loadIndex();
            await this.loadData();
            document.getElementById("appTitle").innerText = this.settings.title || sourceName;
            this.showMainMenu();
            document.getElementById("loadStatus").innerText = "";
        } catch (error) {
            console.error(error);
            document.getElementById("loadStatus").innerText = error.message;
        }
    },

    async loadData() {
        const plantsYaml = await this.fetchTextFile("plants.yaml");
        const settingsYaml = await this.fetchTextFile("settings.yaml");
        const plantsData = jsyaml.load(plantsYaml);
        const settingsData = jsyaml.load(settingsYaml);
        this.settings = this.mergeSettings(
            structuredClone(this.defaultSettings),
            settingsData || {}
        );
        if (Array.isArray(plantsData)) {
            this.plants = plantsData;
        } else {
            this.plants = plantsData.plants || [];
        }
        console.log("Plants loaded:", this.plants.length);
    },

    mergeSettings(target, source) {
        if (!source) {
            return target;
        }
        for (const key of Object.keys(source)) {
            const value = source[key];
            if (value && typeof value === "object" && !Array.isArray(value)) {
                target[key] = this.mergeSettings(target[key] || {}, value);
            } else {
                target[key] = value;
            }
        }
        return target;
    },

    async fetchTextFile(relativePath) {
        const url =
            `${API_URL}` +
            `?action=file` +
            `&folder=${encodeURIComponent(this.currentFolderId)}` +
            `&path=${encodeURIComponent(relativePath)}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Nem sikerült betölteni: ${relativePath}`);
        }
        return await response.text();
    },

    async getImageUrl(relativePath) {
        return await ImageManager.getImage(relativePath);
    },

    extractFolderId(driveUrl) {
        const match = driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (!match) {
            throw new Error("Érvénytelen Google Drive mappa URL");
        }
        return match[1];
    },

    showStartupScreen() {
        document.getElementById("startupScreen").classList.remove("hidden");
        document.getElementById("mainMenu").classList.add("hidden");
        document.getElementById("content").classList.add("hidden");
    },

    showMainMenu() {
        document.getElementById("startupScreen").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");
        document.getElementById("content").classList.add("hidden");
    },

    showContent() {
        document.getElementById("mainMenu").classList.add("hidden");
        document.getElementById("content").classList.remove("hidden");
    },

    isPlantEnabledForQuiz(plant) {
        if (plant.level == null) {
            return true;
        }

        const difficulty = Number(this.settings.difficulty);

        if (Array.isArray(plant.level)) {
            return plant.level.some((level) => Number(level) === difficulty);
        }

        return Number(plant.level) === difficulty;
    },

    getQuizPlants() {
        return this.plants.filter((plant) => this.isPlantEnabledForQuiz(plant));
    },

    getMissingImageHtml(plant, imagePath) {
        const latinName = plant?.names?.la?.[0] || "Ismeretlen növény";
        console.error("Missing image", plant, imagePath);
        return `
            <div class="image-error">
                ❌ Kép nem található
                <br><br>
                <strong> ${latinName} </strong>
                <br><br>
                <code>
                    ${imagePath || "(üres útvonal)"}
                </code>
            </div>
        `;
    }
};

window.addEventListener("DOMContentLoaded", () => App.initialize());
