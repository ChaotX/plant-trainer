const Settings = {
    start() {
        App.showContent();

        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <h2>⚙️ Beállítások</h2>
    <div class="settings-group">
        <h3>🌿 Növény vizsgaszint</h3>
        <label>
            <input type="radio" name="difficulty" value="1" ${App.settings.difficulty == 1 ? "checked" : ""}>
            🟢 Lista
        </label>
        <br>
        <label>
            <input type="radio" name="difficulty" value="2" ${App.settings.difficulty == 2 ? "checked" : ""}>
            🔴 Haladó
        </label>
    </div>
    <hr>
    <div class="settings-group">
        <h3>🏷️ Szűrés tulajdonság alapján</h3>
        <p class="setting-help">
            Például:
            <em>egynyári</em>
            <em>kétnyári</em>
            <em>levéldísznövény</em>
            <em>lombhullató</em>
        </p>
        <div class="search-filter-row">
            <input id="tagFilter" type="text" value="${App.settings.filter.tag}">
            <select id="tagFilterModeSelect">
                <option value="any" ${App.settings.filter.tag_mode === "any" ? "selected" : ""}>Bármely</option>
                <option value="all" ${App.settings.filter.tag_mode === "all" ? "selected" : ""}>Mindegyik</option>
                <option value="exact" ${App.settings.filter.tag_mode === "exact" ? "selected" : ""}>Egyezés</option>
            </select>
        </div>
        <div id="tagFilterInfo" class="setting-help"></div>
    </div>
    <div class="settings-group">
        <h3>📖 Tanuló mód</h3>
        <label>
            <input id="hideNameOnNextCheckbox" type="checkbox" ${App.settings.study.hide_name_on_next ? "checked" : ""}>
            Név elrejtése új növénynél
        </label>
    </div>
    <hr>
    <div class="settings-group">
        <h3>☑️ Feleletválasztós kvíz</h3>
        <label class="setting-label">
            Kérdések száma
        </label>
        <input id="mcQuestionCount" type="number" min="1" max="100" step="1" value="${App.settings.quiz.multiple_choice.question_count}">
        <label class="setting-label">
            Válaszlehetőségek
        </label>
        <select id="mcChoiceCount">
            <option value="2" ${App.settings.quiz.multiple_choice.choice_count == 2 ? "selected" : ""}>2</option>
            <option value="3" ${App.settings.quiz.multiple_choice.choice_count == 3 ? "selected" : ""}>3</option>
            <option value="4" ${App.settings.quiz.multiple_choice.choice_count == 4 ? "selected" : ""}>4</option>
            <option value="5" ${App.settings.quiz.multiple_choice.choice_count == 5 ? "selected" : ""}>5</option>
        </select>
        <label class="setting-label">
            Kérdezett név
        </label>
        <div class="radio-group">
            ${this.languageSelector("mcLanguage", App.settings.quiz.multiple_choice.display_languages)}
        </div>
    </div>
    <hr>
    <div class="settings-group">
        <h3>✏️ Beírásos kvíz</h3>
        <label class="setting-label">
            Kérdések száma
        </label>
        <input id="ftQuestionCount" type="number" min="1" max="100" step="1" value="${App.settings.quiz.free_text.question_count}">
        <label class="setting-label">
            Kérdezett név
        </label>
        <div class="radio-group">
            ${this.languageSelector("ftLanguage", App.settings.quiz.free_text.language)}
        </div>
    </div>
    <hr>
    <div class="settings-group">
        <h3>🔍 Keresés</h3>
        <label class="setting-label">
            Név oszlop
        </label>
        <div class="radio-group">
            <label>
                <input type="checkbox" id="searchShowNameLa" ${App.settings.search.show_name_la ? "checked" : ""}>
                Latin Név
            </label>
            <label>
                <input type="checkbox" id="searchShowNameHu" ${App.settings.search.show_name_hu ? "checked" : ""}>
                Magyar Név
            </label>
            <label>
                <input type="checkbox" id="searchCombineNames" ${App.settings.search.combine_names ? "checked" : ""}>
                Összevont név oszlop
            </label>
        </div>
        <label class="setting-label">
            Megjelenő oszlopok
        </label>
        <div class="radio-group">
            <label>
                <input type="checkbox" id="searchShowTags" ${App.settings.search.show_tags ? "checked" : ""}>
                Címkék
            </label>
            <label>
                <input type="checkbox" id="searchShowImages" ${App.settings.search.show_images ? "checked" : ""}>
                Képek
            </label>
            <label>
                <input type="checkbox" id="searchShowImagePaths" ${App.settings.search.show_image_paths ? "checked" : ""}>
                Kép útvonalak
            </label>
            <label>
                <input type="checkbox" id="searchShowLevel" ${App.settings.search.show_level ? "checked" : ""}>
                Szint
            </label>
            <label>
                <input type="checkbox" id="searchShowId" ${App.settings.search.show_id ? "checked" : ""}>
                Id (sorszám)
            </label>
        </div>
    </div>
</div>
`;
        document.querySelectorAll("input[name=difficulty]").forEach((radio) => {
            radio.onchange = () => {
                App.settings.difficulty = Number(radio.value);
                this.updateTagFilterInfo();
            };
        });
        document.getElementById("hideNameOnNextCheckbox").onchange = (e) => {
            App.settings.study.hide_name_on_next = e.target.checked;
        };
        document.getElementById("mcQuestionCount").oninput = (e) => {
            const value = parseInt(e.target.value, 10) || 1;
            App.settings.quiz.multiple_choice.question_count = Math.min(100, value);
        };
        document.getElementById("mcChoiceCount").onchange = (e) => {
            App.settings.quiz.multiple_choice.choice_count = Number(e.target.value);
        };
        document.querySelectorAll("input[name=mcLanguage]").forEach((checkbox) => {
            checkbox.onchange = () => {
                const selected = [
                    ...document.querySelectorAll("input[name=mcLanguage]:checked")
                ].map((cb) => cb.value);
                if (selected.length === 0) {
                    checkbox.checked = true;
                    return;
                }
                App.settings.quiz.multiple_choice.display_languages = selected;
            };
        });
        document.getElementById("ftQuestionCount").oninput = (e) => {
            const value = parseInt(e.target.value, 10) || 1;
            App.settings.quiz.free_text.question_count = Math.min(100, value);
        };
        document.querySelectorAll("input[name=ftLanguage]").forEach((radio) => {
            radio.onchange = () => {
                App.settings.quiz.free_text.language = radio.value;
            };
        });
        document.getElementById("searchShowNameLa").onchange = (e) => {
            if (!e.target.checked && !App.settings.search.show_name_hu) {
                e.target.checked = true;
                return;
            }
            App.settings.search.show_name_la = e.target.checked;
        };
        document.getElementById("searchShowNameHu").onchange = (e) => {
            if (!e.target.checked && !App.settings.search.show_name_la) {
                e.target.checked = true;
                return;
            }
            App.settings.search.show_name_hu = e.target.checked;
        };
        document.getElementById("searchCombineNames").onchange = (e) => {
            App.settings.search.combine_names = e.target.checked;
        };
        document.getElementById("searchShowTags").onchange = (e) => {
            App.settings.search.show_tags = e.target.checked;
        };
        document.getElementById("searchShowImages").onchange = (e) => {
            App.settings.search.show_images = e.target.checked;
        };
        document.getElementById("searchShowImagePaths").onchange = (e) => {
            App.settings.search.show_image_paths = e.target.checked;
        };
        document.getElementById("searchShowLevel").onchange = (e) => {
            App.settings.search.show_level = e.target.checked;
        };
        document.getElementById("searchShowId").onchange = (e) => {
            App.settings.search.show_id = e.target.checked;
        };
        document.getElementById("tagFilter").oninput = (e) => {
            App.settings.filter.tag = e.target.value;
            this.updateTagFilterInfo();
        };
        document.getElementById("tagFilterModeSelect").onchange = (e) => {
            App.settings.filter.tag_mode = e.target.value;
            this.updateTagFilterInfo();
        };

        this.updateTagFilterInfo();
    },

    updateTagFilterInfo() {
        const info = document.getElementById("tagFilterInfo");
        if (!info) {
            return;
        }
        const difficulty = App.getDifficultyPlants().length;
        const filtered = App.getQuizPlants().length;
        info.textContent = `A nehézségi szintnek megfelelő ${difficulty} növényből ${filtered} felel meg a szűrésnek.`;
    },

    languageSelector(groupName, selectedLangs = []) {
        return `
<label>
    <input type="checkbox" name="${groupName}" value="la" ${selectedLangs.includes("la") ? "checked" : ""}>
    Latin
</label>
<label>
    <input type="checkbox" name="${groupName}" value="hu" ${selectedLangs.includes("hu") ? "checked" : ""}>
    Magyar
</label>
`;
    }
};
