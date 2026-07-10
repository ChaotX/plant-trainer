const QuizBase = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    renderToken: 0,

    async start() {
        if (!App.ensureEnoughPlants(1)) {
            return;
        }
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = this.buildQuestions();
        App.showContent();
        await this.render();
    },

    async nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion >= this.questions.length) {
            await this.showResults();
            return;
        }
        await this.render();
    },

    renderProgressHeader() {
        return `
<div class="quiz-progress">
    ${this.currentQuestion + 1} / ${this.questions.length}
</div>
<div id="quizImageContainer">
    <div class="plant-image loading">
        Kép betöltése...
    </div>
</div>
`;
    },

    renderQuizImage(question) {
        const token = ++this.renderToken;
        App.preloadNextImage(this.questions, this.currentQuestion);
        ImageManager.renderInto(
            "quizImageContainer",
            question.plant,
            question.imagePath,
            () => token !== this.renderToken
        );
    },

    async getResultImageHtml(question) {
        try {
            const imageUrl = await ImageManager.getImage(question.imagePath);
            return `<img src="${imageUrl}" class="result-image">`;
        } catch {
            return App.getMissingImageHtml(question.plant, question.imagePath);
        }
    },

    renderResultRowShell(question, imageHtml, correctLabel, answerBlockHtml) {
        return `
<div class="result-row">
    <div class="result-icon">
        ${question.isCorrect ? "✅" : "❌"}
    </div>
    ${imageHtml}
    <div class="result-text">
        <div class="result-correct-name">
            ${correctLabel}
            <button class="info-inline" data-info="correct" title="Növény adatlap">ℹ️</button>
        </div>
        ${answerBlockHtml}
    </div>
</div>
`;
    },

    wireCorrectButton(row, question) {
        const correctButton = row.querySelector('[data-info="correct"]');
        if (correctButton) {
            correctButton.onclick = () => PlantDetail.open(question.plant);
        }
    },

    wireResultRow(row, question) {
        this.wireCorrectButton(row, question);
    },

    async showResults() {
        let html = `
<h2>
    Eredmény
</h2>
<p>
    ${this.score} / ${this.questions.length}
</p>
<hr>
`;
        for (const question of this.questions) {
            html += await this.renderResultRow(question);
        }
        document.getElementById("content").innerHTML = html;
        document.querySelectorAll(".result-row").forEach((row, index) => {
            this.wireResultRow(row, this.questions[index]);
        });
    }
};
