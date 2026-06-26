const MultipleChoiceQuiz = {
    questions: [],
    currentQuestion: 0,
    score: 0,

    async start() {
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = this.buildQuestions();
        App.showContent();
        await this.render();
    },

    buildQuestions() {
        const questionCount = App.settings.quiz?.multiple_choice?.question_count || 10;
        const choiceCount = App.settings.quiz?.multiple_choice?.choice_count || 4;
        const plants = [...App.getQuizPlants()];
        this.shuffle(plants);
        return plants.slice(0, questionCount).map((plant) => {
            const correctAnswer = plant.names?.la?.[0] || "Ismeretlen";
            const wrongAnswers = App.plants
                .filter((p) => p !== plant)
                .map((p) => p.names?.la?.[0])
                .filter(Boolean);
            this.shuffle(wrongAnswers);
            const choices = [correctAnswer, ...wrongAnswers.slice(0, choiceCount - 1)];
            this.shuffle(choices);
            return {
                plant,
                correctAnswer,
                choices,
                selectedAnswer: null,
                isCorrect: null
            };
        });
    },

    async render() {
        const question = this.questions[this.currentQuestion];
        let imageHtml;
        try {
            const imageUrl = await App.getImageUrl(question.plant.images?.[0]);
            imageHtml = `
                <img src="${imageUrl}" class="plant-image">
            `;
        } catch (error) {
            console.error(error);
            imageHtml = App.getMissingImageHtml(question.plant, question.plant.images?.[0]);
        }
        document.getElementById("content").innerHTML = `
            <div class="quiz-progress">
                ${this.currentQuestion + 1} / ${this.questions.length}
            </div>
            ${imageHtml}
            <div class="quiz-choices">
                ${question.choices
                    .map(
                        (choice) => `
                            <button class="quiz-choice" data-answer="${choice}">
                                ${choice}
                            </button>
                        `
                    )
                    .join("")}
            </div>
            <hr>
            <button id="backToMenuButton">
                🏠 Menü
            </button>
        `;
        this.registerEvents(question);
    },

    registerEvents(question) {
        let answered = false;
        document.querySelectorAll(".quiz-choice").forEach((button) => {
            button.addEventListener("click", () => {
                if (answered) {
                    return;
                }
                answered = true;
                const answer = button.dataset.answer;
                const isCorrect = answer === question.correctAnswer;
                question.selectedAnswer = answer;
                question.isCorrect = isCorrect;
                if (isCorrect) {
                    this.score++;
                    button.classList.add("quiz-correct");
                } else {
                    button.classList.add("quiz-wrong");
                    document.querySelectorAll(".quiz-choice").forEach((btn) => {
                        if (btn.dataset.answer === question.correctAnswer) {
                            btn.classList.add("quiz-correct");
                        }
                    });
                }
                this.showAnswer(question);
            });
        });
        document
            .getElementById("backToMenuButton")
            .addEventListener("click", () => App.showMainMenu());
    },

    showAnswer(question) {
        const result = document.createElement("div");
        if (this.currentQuestion + 1 >= this.questions.length) {
            buttonText = "📊 Eredmény";
        } else {
            buttonText = "➡️ Következő kérdés";
        }
        result.className = "quiz-result";
        result.innerHTML = `
            <p>
                Helyes válasz:
                <strong>
                    ${question.correctAnswer}
                </strong>
            </p>
            <button id="nextQuestionButton">
                ${buttonText}
            </button>
        `;

        document.getElementById("content").appendChild(result);
        document.getElementById("nextQuestionButton").addEventListener("click", async () => {
            await this.nextQuestion();
        });
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
                const imageUrl = await App.getImageUrl(question.plant.images?.[0]);
                imageHtml = `
                    <img src="${imageUrl}" style=" width:120px; border-radius:8px;">
                `;
            } catch (error) {
                imageHtml = App.getMissingImageHtml(question.plant, question.plant.images?.[0]);
            }
            html += `
                <div style="margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #ddd;">
                    ${imageHtml}
                    <p>
                        ${question.isCorrect ? "✅" : "❌"}
                        <strong>
                            ${question.correctAnswer}
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
            <button id="backToMenuButton">
                🏠 Menü
            </button>
        `;

        document.getElementById("content").innerHTML = html;
        document
            .getElementById("backToMenuButton")
            .addEventListener("click", () => App.showMainMenu());
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};
