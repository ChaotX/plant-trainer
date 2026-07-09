const FlashcardHistory = {
    history: [],
    position: -1,

    clear() {
        this.history = [];
        this.position = -1;
    },

    current() {
        if (this.position < 0) {
            return null;
        }
        return this.history[this.position];
    },

    push(entry) {
        if (this.position < this.history.length - 1) {
            this.history = this.history.slice(0, this.position + 1);
        }
        this.history.push({ ...entry });
        this.position = this.history.length - 1;
    },

    canGoPrevious() {
        return this.position > 0;
    },

    previous() {
        if (!this.canGoPrevious()) {
            return null;
        }
        this.position--;
        return this.current();
    },

    canGoNext() {
        return this.position < this.history.length - 1;
    },

    next() {
        if (!this.canGoNext()) {
            return null;
        }
        this.position++;
        return this.current();
    }
};
