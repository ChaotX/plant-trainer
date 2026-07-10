const Overlay = {
    container: null,

    open(html, onMount) {
        this.container = document.createElement("div");
        this.container.className = "overlay";
        this.container.innerHTML = html;
        document.body.appendChild(this.container);
        if (onMount) {
            onMount(this.container, () => this.close());
        }
        history.pushState({ overlay: true }, "");
    },

    close() {
        if (!this.container) {
            return;
        }
        history.back();
    },

    handlePopState() {
        if (!this.container) {
            return;
        }
        this.container.remove();
        this.container = null;
    }
};

window.addEventListener("popstate", () => Overlay.handlePopState());
