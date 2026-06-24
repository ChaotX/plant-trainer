const API_URL =
    "https://script.google.com/macros/s/AKfycbxBfssV4rJFYwVjUqNe2oq87ZBto61u-7zf0V1LYZoyR-ISrjUXRCWMzkOuK_hqEBaW/exec";

const FOLDER_ID =
    "1qAXWa63tDdvMC3al9o4XL3W5j0mheaJu";


const App = {

    settings: {},

    plants: [],

    async initialize() {

        try {

            await this.loadData();

            this.showFirstPlant();

        } catch (error) {

            console.error(error);

            document.getElementById(
                "content"
            ).innerHTML = `
                <h2>Hiba</h2>
                <pre>${error}</pre>
            `;
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
            settingsData;

        if (
            Array.isArray(
                plantsData
            )
        ) {

            this.plants =
                plantsData;

        } else {

            this.plants =
                plantsData.plants || [];
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
            + `&folder=${encodeURIComponent(FOLDER_ID)}`
            + `&path=${encodeURIComponent(relativePath)}`;

        const response =
            await fetch(
                url
            );

        if (
            !response.ok
        ) {

            throw new Error(
                `Failed to load ${relativePath}`
            );
        }

        return await response.text();
    },

    buildImageUrl(
        imagePath
    ) {

        return (
            `${API_URL}`
            + `?action=image-url`
            + `&folder=${encodeURIComponent(FOLDER_ID)}`
            + `&path=${encodeURIComponent(imagePath)}`
        );
    },

    showFirstPlant() {

        if (
            this.plants.length === 0
        ) {

            document.getElementById(
                "content"
            ).innerHTML =
                "<h2>Nincs növény.</h2>";

            return;
        }

        const plant =
            this.plants[0];

        const latinName =
            plant.names?.la?.[0]
            || "Ismeretlen";

        const imagePath =
            plant.images?.[0];

        document.getElementById(
            "content"
        ).innerHTML = `
            <h2>${latinName}</h2>

            <p>
                Kép útvonal:
                ${imagePath}
            </p>

            <img
                id="plantImage"
                style="
                    max-width: 600px;
                    width: 100%;
                    border-radius: 12px;
                "
            >
        `;

        this.loadImage(
            imagePath
        );
    },

    loadImage(
        imagePath
    ) {

        const url =
            `${API_URL}`
            + `?action=image-url`
            + `&folder=${encodeURIComponent(FOLDER_ID)}`
            + `&path=${encodeURIComponent(imagePath)}`;

        document.getElementById(
            "plantImage"
        ).src = url;
    }
};


window.addEventListener(
    "DOMContentLoaded",
    () => App.initialize()
);