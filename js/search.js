const Search = {
    nameFilter: "",
    nameLanguage: null,
    tagFilter: "",
    tagMode: "any",
    levelFilter: null,
    sortKey: null,
    sortDir: "asc",

    levels: [
        { value: "1", label: "🟢 Lista" },
        { value: "2", label: "🔴 Haladó" }
    ],

    start() {
        App.showContent();
        if (!this.nameLanguage) {
            const languages = this.getAvailableLanguages();
            this.nameLanguage = languages.includes("la") ? "la" : languages[0] || "la";
        }
        if (this.levelFilter === null) {
            this.levelFilter = String(App.settings.difficulty ?? "");
        }
        this.render();
    },

    getAvailableLanguages() {
        const languages = new Set();
        App.plants.forEach((plant) => {
            Object.keys(plant.names || {}).forEach((lang) => languages.add(lang));
        });
        return Array.from(languages).sort();
    },

    matchesName(plant, query, language) {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
            return true;
        }
        const names = App.getPlantNames(plant, language).map((name) => name.toLowerCase());
        return names.some((name) => name.includes(trimmed));
    },

    matchesTag(plant, query, mode) {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
            return true;
        }
        const tags = (plant.tags || []).map((tag) => tag.toLowerCase());
        if (mode === "exact") {
            return tags.includes(trimmed);
        }
        const words = trimmed.split(/\s+/).filter(Boolean);
        if (mode === "all") {
            return words.every((word) => tags.some((tag) => tag.includes(word)));
        }
        return words.some((word) => tags.some((tag) => tag.includes(word)));
    },

    matchesLevel(plant, levelFilter) {
        if (!levelFilter || plant.level == null) {
            return true;
        }
        if (Array.isArray(plant.level)) {
            return plant.level.some((level) => Number(level) === Number(levelFilter));
        }
        return Number(plant.level) === Number(levelFilter);
    },

    getActiveColumns() {
        const settings = App.settings.search;
        const nameLanguages = ["la", "hu"].filter((lang) => settings[`show_name_${lang}`]);
        const columns = [];

        if (nameLanguages.length > 1 && !settings.combine_names) {
            columns.push({ key: "name_la", label: "Latin Név", className: "col-name" });
            columns.push({ key: "name_hu", label: "Magyar Név", className: "col-name" });
        } else if (nameLanguages.length > 0) {
            columns.push({ key: "name", label: "Név", className: "col-name" });
        }

        if (settings.show_tags) {
            columns.push({ key: "tags", label: "Címkék", className: "col-tags" });
        }
        if (settings.show_images) {
            columns.push({ key: "images", label: "Képek", className: "col-narrow" });
        }
        if (settings.show_image_paths) {
            columns.push({ key: "image_paths", label: "Kép útvonalak", className: "col-tags" });
        }
        if (settings.show_level) {
            columns.push({ key: "level", label: "Szint", className: "col-narrow" });
        }
        if (settings.show_id) {
            columns.push({ key: "id", label: "Id", className: "col-narrow" });
        }

        return columns;
    },

    getRows() {
        const nameLanguages = ["la", "hu"].filter((lang) => App.settings.search[`show_name_${lang}`]);

        let rows = App.plants.map((plant, index) => ({
            plant,
            plantIndex: index,
            name: App.getPlantDisplayName(plant, nameLanguages) || "(névtelen)",
            nameLa: App.getPlantPrimaryName(plant, "la") || "(névtelen)",
            nameHu: App.getPlantPrimaryName(plant, "hu") || "(névtelen)",
            tags: (plant.tags || []).join(", "),
            level: Array.isArray(plant.level) ? plant.level.join(", ") : plant.level ?? "",
            imageCount: (plant.images || []).length,
            imagePaths: (plant.images || []).map((path) => `<code>${path}</code>`).join("<br>"),
            imagePathsSort: (plant.images || []).join(", ")
        }));

        rows = rows.filter(
            (row) =>
                this.matchesName(row.plant, this.nameFilter, this.nameLanguage) &&
                this.matchesTag(row.plant, this.tagFilter, this.tagMode) &&
                this.matchesLevel(row.plant, this.levelFilter)
        );

        rows.sort((a, b) => {
            let result;
            switch (this.sortKey) {
                case "name":
                    result = a.name.localeCompare(b.name);
                    break;
                case "name_la":
                    result = a.nameLa.localeCompare(b.nameLa);
                    break;
                case "name_hu":
                    result = a.nameHu.localeCompare(b.nameHu);
                    break;
                case "tags":
                    result = a.tags.localeCompare(b.tags);
                    break;
                case "images":
                    result = a.imageCount - b.imageCount;
                    break;
                case "image_paths":
                    result = a.imagePathsSort.localeCompare(b.imagePathsSort);
                    break;
                case "level":
                    result = String(a.level).localeCompare(String(b.level));
                    break;
                default:
                    result = a.plantIndex - b.plantIndex;
            }
            return this.sortDir === "asc" ? result : -result;
        });

        return rows;
    },

    getCellValue(row, key) {
        switch (key) {
            case "name":
                return row.name;
            case "name_la":
                return row.nameLa;
            case "name_hu":
                return row.nameHu;
            case "tags":
                return row.tags;
            case "images":
                return row.imageCount;
            case "image_paths":
                return row.imagePaths;
            case "level":
                return row.level;
            case "id":
                return row.plantIndex + 1;
            default:
                return "";
        }
    },

    sortIndicator(key) {
        if (this.sortKey !== key) {
            return "";
        }
        return this.sortDir === "asc" ? "▲" : "▼";
    },

    escapeAttr(value) {
        return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    },

    render() {
        const rows = this.getRows();
        const languages = this.getAvailableLanguages();
        const columns = this.getActiveColumns();

        document.getElementById("content").innerHTML = `
<div class="search-page">
    <div class="search-filters">
        <div class="search-filter-row">
            <input
                id="nameFilterInput"
                type="text"
                placeholder="Név..."
                value="${this.escapeAttr(this.nameFilter)}"
            >
            <select id="nameLanguageSelect">
                ${languages
                    .map(
                        (lang) => `
<option value="${lang}" ${this.nameLanguage === lang ? "selected" : ""}>${lang.toUpperCase()}</option>
`
                    )
                    .join("")}
            </select>
        </div>
        <div class="search-filter-row">
            <input
                id="tagFilterInput"
                type="text"
                placeholder="Címke..."
                value="${this.escapeAttr(this.tagFilter)}"
            >
            <select id="tagModeSelect">
                <option value="any" ${this.tagMode === "any" ? "selected" : ""}>Bármely szó</option>
                <option value="all" ${this.tagMode === "all" ? "selected" : ""}>Mindegyik szó</option>
                <option value="exact" ${this.tagMode === "exact" ? "selected" : ""}>Címke egyezés</option>
            </select>
        </div>
        <div class="search-filter-row">
            <label for="levelFilterSelect">Szint</label>
            <select id="levelFilterSelect">
                ${this.levels
                    .map(
                        (level) => `
<option value="${level.value}" ${this.levelFilter === level.value ? "selected" : ""}>${level.label}</option>
`
                    )
                    .join("")}
                <option value="" ${this.levelFilter === "" ? "selected" : ""}>Mind</option>
            </select>
        </div>
    </div>
    <div class="search-table-wrap">
        <table class="search-table">
            <thead>
                <tr>
                    ${columns
                        .map(
                            (column) => `
<th class="${column.className}" data-sort="${column.key}">${column.label}<span class="sort-indicator">${this.sortIndicator(column.key)}</span></th>
`
                        )
                        .join("")}
                </tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (row) => `
<tr data-plant-index="${row.plantIndex}">
    ${columns
        .map((column) => `<td class="${column.className}">${this.getCellValue(row, column.key)}</td>`)
        .join("")}
</tr>
`
                    )
                    .join("")}
            </tbody>
        </table>
        ${rows.length === 0 ? `<p class="center">Nincs találat.</p>` : ""}
        ${columns.length === 0 ? `<p class="center">Nincs megjeleníthető oszlop a beállításokban.</p>` : ""}
    </div>
</div>
`;
        this.registerEvents();
    },

    bindFilterInput(id, onChange) {
        const input = document.getElementById(id);
        input.oninput = (event) => {
            onChange(event.target.value);
            this.render();
            const newInput = document.getElementById(id);
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        };
    },

    registerEvents() {
        this.bindFilterInput("nameFilterInput", (value) => {
            this.nameFilter = value;
        });
        this.bindFilterInput("tagFilterInput", (value) => {
            this.tagFilter = value;
        });

        document.getElementById("nameLanguageSelect").onchange = (event) => {
            this.nameLanguage = event.target.value;
            this.render();
        };
        document.getElementById("tagModeSelect").onchange = (event) => {
            this.tagMode = event.target.value;
            this.render();
        };
        document.getElementById("levelFilterSelect").onchange = (event) => {
            this.levelFilter = event.target.value;
            this.render();
        };

        document.querySelectorAll("[data-sort]").forEach((th) => {
            th.onclick = () => {
                const key = th.dataset.sort;
                if (this.sortKey === key) {
                    this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
                } else {
                    this.sortKey = key;
                    this.sortDir = "asc";
                }
                this.render();
            };
        });

        document.querySelectorAll("[data-plant-index]").forEach((row) => {
            row.onclick = () => {
                const plant = App.plants[Number(row.dataset.plantIndex)];
                PlantDetail.open(plant);
            };
        });
    }
};
