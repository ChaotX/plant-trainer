const Settings = {
    start() {
        App.showContent();
        document.getElementById("content").innerHTML = `
<div class="plant-card">
    <h2>⚙️ Beállítások</h2>
    <div class="settings-group">
        <h3>Kvíz nehézsége</h3>
        <label>
            <input type="radio" name="difficulty" value="1" ${App.settings.difficulty == 1 ? "checked" : ""}>
            🟢 Könnyű
        </label>
        <br>
        <label>
            <input type="radio" name="difficulty" value="2" ${App.settings.difficulty == 2 ? "checked" : ""}>
            🔴 Nehéz
        </label>
    </div>
    <hr>
    <hr>
</div>
`;
        document.querySelectorAll("input[name=difficulty]").forEach((radio) => {
            radio.onchange = () => {
                App.settings.difficulty = Number(radio.value);
            };
        });
    }
};
