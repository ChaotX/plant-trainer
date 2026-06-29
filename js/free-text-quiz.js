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
</div>
<div id="answerResult" class="quiz-feedback">
    &nbsp;
</div>
<div class="quiz-actions">
    <button id="submitAnswerButton">
        Ellenőrzés
    </button>
    <button id="nextQuestionButton" class="quiz-next" disabled>
        ${this.currentQuestion + 1 >= this.questions.length ? "📊" : "➡️"}
    </button>
</div>
`;
        this.registerEvents(question);
        document.getElementById("answerInput").focus();
        this.preloadNext();
        requestAnimationFrame(() => {
            ImageManager.getImage(question.imagePath)
                .then((image) => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("quizImageContainer").innerHTML =
                        `<img src="${image}" class="plant-image">`;
                })
                .catch(() => {
                    if (token !== this.renderToken) {
                        return;
                    }
                    document.getElementById("quizImageContainer").innerHTML =
                        App.getMissingImageHtml(question.plant, question.imagePath);
                });
        });
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
    },

    showAnswer(question) {
        const input = document.getElementById("answerInput");
        const submit = document.getElementById("submitAnswerButton");
        const next = document.getElementById("nextQuestionButton");
        input.disabled = true;
        submit.disabled = true;
        if (question.isCorrect) {
            input.classList.add("quiz-correct");
        } else {
            input.classList.add("quiz-wrong");
        }
        document.getElementById("answerResult").innerHTML = `
✔ <strong>
${question.correctAnswers.join(", ")}
</strong>
`;
        next.disabled = false;
        next.onclick = async () => {
            await this.nextQuestion();
        };
    },

    preloadNext() {
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
                imageHtml = `<img src="${image}" class="result-image">`;
            } catch {
                imageHtml = App.getMissingImageHtml(question.plant, question.imagePath);
            }
            html += `
<div class="result-row">
    <div class="result-icon">
        ${question.isCorrect ? "✅" : "❌"}
    </div>
    ${imageHtml}
    <div class="result-text">
        <div class="result-correct-name">
            ${question.correctAnswers[0]}
        </div>
        ${
            question.isCorrect
                ? ""
                : `
<div class="result-label">
    Te válaszod:
</div>
<div class="result-answer">
    ${question.selectedAnswer}
</div>
`
        }
    </div>
</div>
`;
        }
        document.getElementById("content").innerHTML = html;
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
