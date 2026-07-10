const API_URL =
    "https://script.google.com/macros/s/AKfycbxBfssV4rJFYwVjUqNe2oq87ZBto61u-7zf0V1LYZoyR-ISrjUXRCWMzkOuK_hqEBaW/exec";

const App = {
    defaultSettings: {
        title: "Növényismeret",

        difficulty: 1,

        filter: {
            tag: "",
            tag_mode: "any"
        },

        study: {
            hide_name_on_next: true
        },

        quiz: {
            multiple_choice: {
                question_count: 10,
                choice_count: 4,
                display_languages: ["la"]
            },

            free_text: {
                question_count: 10,
                language: "la"
            }
        },

        search: {
            show_name_la: true,
            show_name_hu: true,
            combine_names: true,
            show_tags: true,
            show_images: false,
            show_image_paths: false,
            show_level: false,
            show_id: false
        }
    },
    imageIndex: {},
    apiKey: null,
    sources: {},
    plants: [],
    settings: {},
    currentFolderId: null,
    hasLoadedData: false,

    async initialize() {
        try {
            ImageManager.initialize(this);
            await this.loadSources();
            this.registerEvents();
            if (Object.keys(this.sources).length === 1) {
                await this.loadSelectedSource();
            }
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
        document.getElementById("searchButton").addEventListener("click", () => Search.start());
        document.getElementById("settingsButton").addEventListener("click", () => Settings.start());
        document.getElementById("menuButton").addEventListener("click", () => this.showMainMenu());
    },

    async loadIndex() {
        const url =
            `${API_URL}` + `?action=index` + `&folder=${encodeURIComponent(this.currentFolderId)}`;
        let response;
        try {
            response = await ApiClient.fetchWithRetry(url);
        } catch (error) {
            throw new Error("Nem sikerült betölteni a fájllistát");
        }
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
        const selector = document.getElementById("sourceSelector");
        const button = document.getElementById("loadSourceButton");
        const status = document.getElementById("loadStatus");
        try {
            const sourceName = selector.value;
            const source = this.sources[sourceName];
            const folderUrl = source.drive_folder;
            this.currentFolderId = this.extractFolderId(folderUrl);
            ImageManager.clear();
            selector.disabled = true;
            button.disabled = true;
            status.classList.add("loading");
            status.innerText = "Betöltés...";
            await this.loadIndex();
            await this.loadData();
            const errors = this.validateImages();
            if (errors.length > 0) {
                console.log("SHOW ERRORS");
                this.showImageValidationErrors(errors);
                console.log("SHOW ERRORS DONE");
                return;
            }
            this.hasLoadedData = true;
            this.showMainMenu();
            status.innerText = "";
        } catch (error) {
            console.error(error);
            status.innerText = error.message;
        } finally {
            selector.disabled = false;
            button.disabled = false;
            status.classList.remove("loading");
        }
    },

    async loadData() {
        const plantsYaml = await this.fetchTextFile("plants.yaml");
        this.plantLineNumbers = [];
        const lines = plantsYaml.split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("- names:")) {
                this.plantLineNumbers.push(i + 1);
            }
        }
        const settingsYaml = await this.fetchTextFile("settings.yaml");
        const plantsData = jsyaml.load(plantsYaml);
        this.settings = this.defaultSettings;
        if (Array.isArray(plantsData)) {
            this.plants = plantsData;
        } else {
            this.plants = plantsData.plants || [];
        }
        console.log("Plants loaded:", this.plants.length);
    },

    async fetchTextFile(relativePath) {
        const url =
            `${API_URL}` +
            `?action=file` +
            `&folder=${encodeURIComponent(this.currentFolderId)}` +
            `&path=${encodeURIComponent(relativePath)}`;
        let response;
        try {
            response = await ApiClient.fetchWithRetry(url);
        } catch (error) {
            throw new Error(`Nem sikerült betölteni: ${relativePath}`);
        }
        return await response.text();
    },

    getPlantNames(plant, language) {
        const names = plant.names?.[language];

        if (Array.isArray(names)) {
            return names;
        }

        if (typeof names === "string") {
            return [names];
        }

        return [];
    },

    getPlantPrimaryName(plant, language) {
        return this.getPlantNames(plant, language)[0] || "";
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
        document.getElementById("menuButton").classList.toggle("hidden", !this.hasLoadedData);
    },

    showMainMenu() {
        document.getElementById("startupScreen").classList.add("hidden");
        document.getElementById("mainMenu").classList.remove("hidden");
        document.getElementById("content").classList.add("hidden");
        document.getElementById("menuButton").classList.add("hidden");
    },

    showContent() {
        document.getElementById("mainMenu").classList.add("hidden");
        document.getElementById("content").classList.remove("hidden");
        document.getElementById("menuButton").classList.remove("hidden");
    },

    isPlantEnabledForDifficulty(plant) {
        if (plant.level == null) {
            return true;
        }
        const difficulty = Number(this.settings.difficulty);
        if (Array.isArray(plant.level)) {
            return plant.level.some((level) => Number(level) === difficulty);
        }
        return Number(plant.level) === difficulty;
    },

    isPlantEnabledForQuiz(plant) {
        if (!this.isPlantEnabledForDifficulty(plant)) {
            return false;
        }

        return Search.matchesTag(plant, this.settings.filter.tag, this.settings.filter.tag_mode);
    },

    getDifficultyPlants() {
        return this.plants.filter((plant) => this.isPlantEnabledForDifficulty(plant));
    },

    getQuizPlants() {
        return this.plants.filter((plant) => this.isPlantEnabledForQuiz(plant));
    },

    ensureEnoughPlants(minimum) {
        const available = this.getQuizPlants().length;

        if (available >= minimum) {
            return true;
        }

        this.showContent();

        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <h2>⚠ Nem indítható</h2>
    <p>
        A jelenlegi beállításokkal csak <strong>${available}</strong> növény érhető el.
    </p>
    <p>
        Legalább <strong>${minimum}</strong> növény szükséges.
    </p>
    <p>
        Módosítsd a nehézségi szintet vagy a szűrést.
    </p>
</div>
`;
        return false;
    },

    getPlantDisplayName(plant, languages = ["la"], separator = "<br>") {
        return languages
            .map((lang) => this.getPlantPrimaryName(plant, lang))
            .filter(Boolean)
            .join(separator);
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    preloadNextImage(items, currentIndex) {
        const next = items[currentIndex + 1];
        if (!next) {
            return;
        }
        ImageManager.preload(next.imagePath);
    },

    validateImages() {
        const missing = [];
        this.plants.forEach((plant, index) => {
            const images = plant.images || [];
            const missingImages = images.filter((imagePath) => !this.imageIndex[imagePath]);
            if (missingImages.length === 0) {
                return;
            }
            missing.push({
                plant,
                line: this.plantLineNumbers[index],
                images: missingImages
            });
        });
        return missing;
    },

    showImageValidationErrors(errors) {
        console.log("ENTER showImageValidationErrors");
        const selector = document.getElementById("sourceSelector");
        const sourceName = selector.options[selector.selectedIndex].text;
        let html = `
<h2>⚠ Hiányzó vagy hibás képútvonalak</h2>
<p>
A(z)
<strong>${sourceName}</strong>
adatforrás betöltése során a
<b>plants.yaml</b> fájlban
<strong>${errors.length}</strong>
hibás képútvonal található.
</p>
<p>
Javasolt a plants.yaml javítása, de az alkalmazás
a hibák ellenére is használható.
</p>
<button id="continueWithErrorsButton">
    ⚠ Folytatás a hibák ellenére
</button>
<hr>
`;
        errors.forEach((entry, index) => {
            const latinName = App.getPlantPrimaryName(entry.plant, "la") || "(ismeretlen)";
            const hungarianName = App.getPlantPrimaryName(entry.plant, "hu");
            html += `
<div class="image-error">
    <strong>${latinName}</strong>
    <br>
    <small>
        📄 plants.yaml, ${entry.line}. sor
    </small>
`;
            if (hungarianName) {
                html += `
    <br>
    <em>${hungarianName}</em>
`;
            }
            html += `
    <ul>
`;
            entry.images.forEach((imagePath) => {
                html += `<li>${imagePath}</li>`;
            });
            html += `
    </ul>
</div>
`;
        });
        console.log("SETTING HTML");
        document.getElementById("loadStatus").innerHTML = html;
        document.getElementById("continueWithErrorsButton").onclick = () => {
            document.getElementById("loadStatus").innerHTML = "";
            this.showMainMenu();
        };
    },

    getMissingImageHtml(plant, imagePath) {
        const latinName = (plant && this.getPlantPrimaryName(plant, "la")) || "Ismeretlen növény";
        console.error("Missing image", plant, imagePath);
        const fileId = this.imageIndex[imagePath]?.id;
        const driveLink = fileId
            ? `
                <br><br>
                <a href="https://drive.google.com/file/d/${fileId}/view" target="_blank" rel="noopener">
                    📂 Megnyitás a Google Drive-on
                </a>
            `
            : "";
        return `
            <div class="image-error">
                ❌ Kép nem sikerült betölteni
                <br><br>
                <strong> ${latinName} </strong>
                <br><br>
                <code>
                    ${imagePath || "(üres útvonal)"}
                </code>
                ${driveLink}
            </div>
        `;
    }
};

window.addEventListener("DOMContentLoaded", () => App.initialize());
