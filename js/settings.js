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
            🟢 Minimum
        </label>
        <br>
        <label>
            <input type="radio" name="difficulty" value="2" ${App.settings.difficulty == 2 ? "checked" : ""}>
            🔴 Haladó
        </label>
    </div>
    <hr>
    <div class="settings-group">
        <h3>🏷️ Tag szűrő</h3>
        <p class="setting-help">
            Csak azok a növények jelennek meg, amelyek valamelyeknek valamelyik tag-je tartalmazza a megadott szöveget.
            Például: <em>egynyári</em>
        </p>
        <input id="tagFilter" type="text" value="${App.settings.filter.tag}">
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
</div>
`;
        document.querySelectorAll("input[name=difficulty]").forEach((radio) => {
            radio.onchange = () => {
                App.settings.difficulty = Number(radio.value);
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
        document.getElementById("tagFilter").oninput = (e) => {
            App.settings.filter.tag = e.target.value;
            this.updateTagFilterInfo();
        };

        this.updateTagFilterInfo();
    },

    updateTagFilterInfo() {
        const difficulty = App.getDifficultyPlants().length;
        const filtered = App.getQuizPlants().length;
        document.getElementById("tagFilterInfo").textContent =
            `A nehézségi szintnek megfelelő ${difficulty} növényből ${filtered} felel meg a tag szűrőnek.`;
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
