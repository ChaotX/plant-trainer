const Settings = {
    start() {
        App.showContent();
        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <h2>⚙️ Beállítások</h2>
    <div class="settings-group">
        <h3>🌿 Növény vizsgaszint</h3>
        <label>
            <input
                type="radio"
                name="difficulty"
                value="1"
                ${App.settings.difficulty == 1 ? "checked" : ""}>
            🟢 Minimum
        </label>
        <br>
        <label>
            <input
                type="radio"
                name="difficulty"
                value="2"
                ${App.settings.difficulty == 2 ? "checked" : ""}>
            🔴 Haladó
        </label>
    </div>
    <hr>
    <div class="settings-group">
        <h3>Tanuló mód</h3>
        <label>
            <input
                id="hideNameOnNextCheckbox"
                type="checkbox"
                ${App.settings.learn.hide_name_on_next ? "checked" : ""}>
            Név elrejtése új növénynél
        </label>
    </div>
</div>
`;
        document.querySelectorAll("input[name=difficulty]").forEach((radio) => {
            radio.onchange = () => {
                App.settings.difficulty = Number(radio.value);
            };
        });
        document.getElementById("hideNameOnNextCheckbox").onchange = (event) => {
            App.settings.learn.hide_name_on_next = event.target.checked;
        };
    }
};
