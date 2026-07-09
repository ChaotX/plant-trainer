const Search = {
    filterText: "",
    sortKey: "index",
    sortDir: "asc",

    start() {
        App.showContent();
        this.render();
    },

    getRows() {
        const filter = this.filterText.trim().toLowerCase();
        let rows = App.plants.map((plant, index) => ({
            plant,
            plantIndex: index,
            name: App.getPlantDisplayName(plant, ["la", "hu"], " / ") || "(névtelen)",
            tags: (plant.tags || []).join(", "),
            level: Array.isArray(plant.level) ? plant.level.join(", ") : (plant.level ?? ""),
            imageCount: (plant.images || []).length
        }));

        if (filter) {
            rows = rows.filter(
                (row) =>
                    row.name.toLowerCase().includes(filter) || row.tags.toLowerCase().includes(filter)
            );
        }

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
        return this.sortDir === "asc" ? " ▲" : " ▼";
    },

    render() {
        const rows = this.getRows();
        const escapedFilterText = this.filterText.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        document.getElementById("content").innerHTML = `
<div class="search-page">
    <input
        id="searchFilterInput"
        type="text"
        placeholder="Szűrés név vagy címke szerint..."
        value="${escapedFilterText}"
    >
    <div class="search-table-wrap">
        <table class="search-table">
            <thead>
                <tr>
                    <th data-sort="name">Név${this.sortIndicator("name")}</th>
                    <th data-sort="tags">Címkék${this.sortIndicator("tags")}</th>
                    <th data-sort="level">Szint${this.sortIndicator("level")}</th>
                    <th data-sort="images">Képek${this.sortIndicator("images")}</th>
                    <th data-sort="index">Sorrend${this.sortIndicator("index")}</th>
                </tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (row) => `
<tr data-plant-index="${row.plantIndex}">
    <td>${row.name}</td>
    <td>${row.tags}</td>
    <td>${row.level}</td>
    <td>${row.imageCount}</td>
    <td>${row.plantIndex + 1}</td>
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

    registerEvents() {
        const input = document.getElementById("searchFilterInput");
        input.oninput = (event) => {
            this.filterText = event.target.value;
            this.render();
            const newInput = document.getElementById("searchFilterInput");
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
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
