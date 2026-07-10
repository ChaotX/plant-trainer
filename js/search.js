const Search = {
    nameFilter: "",
    nameLanguage: null,
    tagFilter: "",
    tagMode: "any",
    levelFilter: "",
    sortKey: "index",
    sortDir: "asc",

    start() {
        App.showContent();
        if (!this.nameLanguage) {
            const languages = this.getAvailableLanguages();
            this.nameLanguage = languages.includes("la") ? "la" : languages[0] || "la";
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

    levels: [
        { value: "1", label: "🟢 Lista" },
        { value: "2", label: "🔴 Haladó" }
    ],

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

    getRows() {
        let rows = App.plants.map((plant, index) => ({
            plant,
            plantIndex: index,
            name: App.getPlantDisplayName(plant, ["la", "hu"]) || "(névtelen)",
            tags: (plant.tags || []).join(", "),
            level: Array.isArray(plant.level) ? plant.level.join(", ") : plant.level ?? "",
            imageCount: (plant.images || []).length
        }));

        rows = rows.filter(
            (row) =>
                this.matchesName(row.plant, this.nameFilter, this.nameLanguage) &&
                this.matchesTag(row.plant, this.tagFilter, this.tagMode) &&
                this.matchesLevel(row.plant, this.levelFilter)
        );

        rows.sort((a, b) => {
            let result = 0;
            switch (this.sortKey) {
                case "name":
                    result = a.name.localeCompare(b.name);
                    break;
                case "tags":
                    result = a.tags.localeCompare(b.tags);
                    break;
                case "level":
                    result = String(a.level).localeCompare(String(b.level));
                    break;
                case "images":
                    result = a.imageCount - b.imageCount;
                    break;
                default:
                    result = a.plantIndex - b.plantIndex;
            }
            return this.sortDir === "asc" ? result : -result;
        });

        return rows;
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
                <option value="" ${this.levelFilter === "" ? "selected" : ""}>Mind</option>
                ${this.levels
                    .map(
                        (level) => `
<option value="${level.value}" ${this.levelFilter === level.value ? "selected" : ""}>${level.label}</option>
`
                    )
                    .join("")}
            </select>
        </div>
    </div>
    <div class="search-table-wrap">
        <table class="search-table">
            <thead>
                <tr>
                    <th class="col-name" data-sort="name">Név<span class="sort-indicator">${this.sortIndicator("name")}</span></th>
                    <th class="col-tags" data-sort="tags">Címkék<span class="sort-indicator">${this.sortIndicator("tags")}</span></th>
                    <th class="col-images" data-sort="images">Képek<span class="sort-indicator">${this.sortIndicator("images")}</span></th>
                    <th class="col-level" data-sort="level">Szint<span class="sort-indicator">${this.sortIndicator("level")}</span></th>
                    <th class="col-id" data-sort="index">Id<span class="sort-indicator">${this.sortIndicator("index")}</span></th>
                </tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (row) => `
<tr data-plant-index="${row.plantIndex}">
    <td class="col-name">${row.name}</td>
    <td class="col-tags">${row.tags}</td>
    <td class="col-images">${row.imageCount}</td>
    <td class="col-level">${row.level}</td>
    <td class="col-id">${row.plantIndex + 1}</td>
</tr>
`
                    )
                    .join("")}
            </tbody>
        </table>
        ${rows.length === 0 ? `<p class="center">Nincs találat.</p>` : ""}
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
