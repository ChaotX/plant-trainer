const FreeTextQuiz = Object.assign({}, QuizBase, {
    buildQuestions() {
        const questionCount = App.settings.quiz?.free_text?.question_count || 10;
        const language = App.settings.quiz.free_text.language || "la";
        const plants = [...App.getQuizPlants()];
        App.shuffle(plants);
        return plants.slice(0, questionCount).map((plant) => ({
            plant,
            imagePath: ImageManager.pickRandomImage(plant),
            correctAnswers: App.getPlantNames(plant, language),
            selectedAnswer: null,
            isCorrect: null
        }));
    },

    async render() {
        const question = this.questions[this.currentQuestion];
        document.getElementById("content").innerHTML = `
${this.renderProgressHeader()}
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
        this.renderQuizImage(question);
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

    async renderResultRow(question) {
        const imageHtml = await this.getResultImageHtml(question);
        const answerBlock = question.isCorrect
            ? ""
            : `
<div class="result-label">
    Te válaszod:
</div>
<div class="result-answer">
    ${question.selectedAnswer}
</div>
`;
        return this.renderResultRowShell(question, imageHtml, question.correctAnswers[0], answerBlock);
    }
});
