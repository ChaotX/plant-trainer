const FreeTextQuiz = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    renderToken: 0,

    async start() {
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = this.buildQuestions();
        App.showContent();
        await this.render();
    },

    buildQuestions() {
        const questionCount = App.settings.quiz?.free_text?.question_count || 10;
        const plants = [...App.getQuizPlants()];
        this.shuffle(plants);
        return plants.slice(0, questionCount).map((plant) => ({
            plant,
            imagePath: ImageManager.pickRandomImage(plant),
            correctAnswers: plant.names?.la || [],
            selectedAnswer: null,
            isCorrect: null
        }));
    },

    async render() {
        const token = ++this.renderToken;
        const question = this.questions[this.currentQuestion];
        document.getElementById("content").innerHTML = `
<div class="quiz-progress">
    ${this.currentQuestion + 1} / ${this.questions.length}
</div>
<div id="quizImageContainer">
    <div class="plant-image loading">
        Kép betöltése...
    </div>
</div>
<div class="free-text-answer">
    <input id="answerInput" type="text" autocomplete="off" placeholder="Latin név...">
    <button id="submitAnswerButton">
        Ellenőrzés
    </button>
</div>
<div id="answerResult"></div>
<hr>
<button id="backToMenuButton"> 🏠 Menü </button>
`;
        this.registerEvents(question);
        document.getElementById("answerInput").focus();
        try {
            const image = await ImageManager.getImage(question.imagePath);
            if (token !== this.renderToken) {
                return;
            }
            document.getElementById("quizImageContainer").innerHTML = `
<img src="${image}" class="plant-image">
`;
        } catch {
            if (token !== this.renderToken) {
                return;
            }
            document.getElementById("quizImageContainer").innerHTML = App.getMissingImageHtml(
                question.plant,
                question.imagePath
            );
        }
        this.preloadNext();
    },

    registerEvents(question) {
        const submit = async () => {
            const input = document.getElementById("answerInput");
            const answer = input.value.trim();
            if (!answer) {
                return;
            }
            const isCorrect = question.correctAnswers.some(
                (correct) => correct.toLowerCase().trim() === answer.toLowerCase().trim()
            );
            question.selectedAnswer = answer;
            question.isCorrect = isCorrect;
            if (isCorrect) {
                this.score++;
            }
            this.showAnswer(question);
        };
        document.getElementById("submitAnswerButton").onclick = submit;
        document.getElementById("answerInput").onkeydown = (e) => {
            if (e.key === "Enter") {
                submit();
            }
        };
        document.getElementById("backToMenuButton").onclick = () => App.showMainMenu();
    },
    showAnswer(question) {
        const buttonText =
            this.currentQuestion + 1 >= this.questions.length
                ? "📊 Eredmény"
                : "➡️ Következő kérdés";
        document.getElementById("answerResult").innerHTML = `
<p>
    ${question.isCorrect ? "✅ Helyes" : "❌ Hibás"}
</p>
<p>
    Helyes válasz:
    <strong>
        ${question.correctAnswers.join(", ")}
    </strong>
</p>
<button id="nextQuestionButton">
    ${buttonText}
</button>
`;
        document.getElementById("answerInput").disabled = true;
        document.getElementById("submitAnswerButton").disabled = true;
        document.getElementById("nextQuestionButton").onclick = async () => {
            await this.nextQuestion();
        };
    },

    async preloadNext() {
        const next = this.currentQuestion + 1;
        if (next >= this.questions.length) {
            return;
        }
        ImageManager.preload(this.questions[next].imagePath);
    },

    async nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion >= this.questions.length) {
            await this.showResults();
            return;
        }
        await this.render();
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
            let imageHtml;
            try {
                const image = await ImageManager.getImage(question.imagePath);
                imageHtml = `
<img src="${image}" style="width:120px; border-radius:8px;">
`;
            } catch {
                imageHtml = App.getMissingImageHtml(question.plant, question.imagePath);
            }
            html += `
<div style="margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #ddd;">
    ${imageHtml}
    <p>
        ${question.isCorrect ? "✅" : "❌"}
        <strong>
            ${question.correctAnswers[0]}
        </strong>
    </p>
    ${
        question.isCorrect
            ? ""
            : `
<p>
    Te válaszod:
    ${question.selectedAnswer}
</p>
`
    }
</div>
`;
        }
        html += `
<button id="backToMenuButton"> 🏠 Menü </button>
`;
        document.getElementById("content").innerHTML = html;
        document.getElementById("backToMenuButton").onclick = () => App.showMainMenu();
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
