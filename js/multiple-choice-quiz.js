const MultipleChoiceQuiz = {

    questions: [],

    currentQuestion: 0,

    score: 0,

    async start() {

        this.currentQuestion = 0;

        this.score = 0;

        this.questions =
            this.buildQuestions();

        App.showContent();

        await this.render();
    },

    buildQuestions() {

        const questionCount =
            App.settings.quiz
                ?.multiple_choice
                ?.question_count
            || 10;

        const choiceCount =
            App.settings.quiz
                ?.multiple_choice
                ?.choice_count
            || 4;

        const plants =
            [...App.plants];

        this.shuffle(
            plants
        );

        const selectedPlants =
            plants.slice(
                0,
                questionCount
            );

        return selectedPlants.map(
            plant => {

                const correctAnswer =
                    plant.names.la[0];

                const wrongAnswers =
                    App.plants
                        .filter(
                            p =>
                                p !== plant
                        )
                        .map(
                            p =>
                                p.names.la[0]
                        );

                this.shuffle(
                    wrongAnswers
                );

                const choices = [

                    correctAnswer,

                    ...wrongAnswers.slice(
                        0,
                        choiceCount - 1
                    )
                ];

                this.shuffle(
                    choices
                );

                return {

                    plant,

                    correctAnswer,

                    choices
                };
            }
        );
    },

    async render() {

        const question =
            this.questions[
                this.currentQuestion
            ];

        const imageUrl =
            App.getImageUrl(
                question.plant.images[0]
            );

        document
            .getElementById(
                "content"
            )
            .innerHTML = `

            <div class="quiz-progress">

                ${this.currentQuestion + 1}
                /
                ${this.questions.length}

            </div>

            <img
                src="${imageUrl}"
                class="plant-image"
            >

            <div
                class="quiz-choices"
            >

                ${question.choices
                    .map(
                        choice => `
                            <button
                                class="quiz-choice"
                                data-answer="${choice}"
                            >
                                ${choice}
                            </button>
                        `
                    )
                    .join("")}

            </div>

            <hr>

            <button
                id="backToMenuButton"
            >
                🏠 Menü
            </button>
        `;

        this.registerEvents(
            question
        );
    },

    registerEvents(
        question
    ) {

        document
            .querySelectorAll(
                ".quiz-choice"
            )
            .forEach(
                button => {

                    button
                        .addEventListener(
                            "click",
                            async () => {

                                const answer =
                                    button.dataset.answer;

                                if (
                                    answer ===
                                    question.correctAnswer
                                ) {

                                    this.score++;
                                }

                                await this.nextQuestion();
                            }
                        );
                }
            );

        document
            .getElementById(
                "backToMenuButton"
            )
            .addEventListener(
                "click",
                () =>
                    App.showMainMenu()
            );
    },

    async nextQuestion() {

        this.currentQuestion++;

        if (
            this.currentQuestion >=
            this.questions.length
        ) {

            this.showResults();

            return;
        }

        await this.render();
    },

    showResults() {

        document
            .getElementById(
                "content"
            )
            .innerHTML = `

            <h2>
                Eredmény
            </h2>

            <p>
                ${this.score}
                /
                ${this.questions.length}
            </p>

            <button
                id="backToMenuButton"
            >
                🏠 Menü
            </button>
        `;

        document
            .getElementById(
                "backToMenuButton"
            )
            .addEventListener(
                "click",
                () =>
                    App.showMainMenu()
            );
    },

    shuffle(
        array
    ) {

        for (
            let i = array.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random()
                    * (i + 1)
                );

            [
                array[i],
                array[j]
            ] = [
                array[j],
                array[i]
            ];
        }
    }
};