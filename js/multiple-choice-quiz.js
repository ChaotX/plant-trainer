const MultipleChoiceQuiz = Object.assign({}, QuizBase, {
    buildQuestions() {
        const questionCount = App.settings.quiz?.multiple_choice?.question_count || 10;
        const choiceCount = App.settings.quiz?.multiple_choice?.choice_count || 4;
        const plants = [...App.getQuizPlants()];
        App.shuffle(plants);
        const languages = App.settings.quiz.multiple_choice.display_languages ?? ["la"];
        return plants.slice(0, questionCount).map((plant) => {
            const correctAnswer = App.getPlantDisplayName(plant, languages);
            const wrongPool = App.getQuizPlants().filter((p) => p !== plant);
            App.shuffle(wrongPool);
            const choices = [
                { name: correctAnswer, plant },
                ...wrongPool
                    .slice(0, choiceCount - 1)
                    .map((p) => ({ name: App.getPlantDisplayName(p, languages), plant: p }))
            ];
            App.shuffle(choices);
            return {
                plant,
                imagePath: ImageManager.pickRandomImage(plant),
                correctAnswer,
                choices,
                selectedAnswer: null,
                selectedPlant: null,
                isCorrect: null
            };
        });
    },

    async render() {
        const question = this.questions[this.currentQuestion];
        document.getElementById("content").innerHTML = `
${this.renderProgressHeader()}
<div class="quiz-layout">
    <div class="quiz-choices">
        ${question.choices
            .map(
                (choice) => `
<button class="quiz-choice" data-answer="${choice.name}">
    ${choice.name}
</button>
`
            )
            .join("")}
    </div>
    <button id="nextQuestionButton" class="quiz-next" disabled>
        ${this.currentQuestion + 1 >= this.questions.length ? "📊" : "➡️"}
    </button>
</div>
`;
        this.registerEvents(question);
        this.renderQuizImage(question);
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
                question.selectedPlant = question.choices.find((choice) => choice.name === answer)?.plant;
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
                document.querySelectorAll(".quiz-choice").forEach((btn) => {
                    if (
                        !btn.classList.contains("quiz-correct") &&
                        !btn.classList.contains("quiz-wrong")
                    ) {
                        btn.classList.add("quiz-neutral");
                    }
                });
                this.showAnswer(question);
            });
        });
    },

    showAnswer() {
        const button = document.getElementById("nextQuestionButton");
        button.disabled = false;
        button.onclick = async () => {
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
    <button class="info-inline" data-info="selected" title="Növény adatlap">ℹ️</button>
</div>
`;
        return this.renderResultRowShell(question, imageHtml, question.correctAnswer, answerBlock);
    },

    wireResultRow(row, question) {
        this.wireCorrectButton(row, question);
        const selectedButton = row.querySelector('[data-info="selected"]');
        if (selectedButton) {
            if (question.selectedPlant) {
                selectedButton.onclick = () => PlantDetail.open(question.selectedPlant);
            } else {
                selectedButton.disabled = true;
            }
        }
    }
});
