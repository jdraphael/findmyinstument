document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();
  initMaybeLaterModal();
  applyTheme();

  const screen = document.getElementById("screen");

  function renderQuestion() {
    let step = getStep();
    if (step >= QUESTIONS.length) {
      window.location.href = "results.html";
      return;
    }
    const question = QUESTIONS[step];
    if (!question) {
      window.location.href = "results.html";
      return;
    }
    const progress = Math.round(((step + 1) / QUESTIONS.length) * 100);

    const canSpeak = "speechSynthesis" in window;
    const voicePref = getVoicePreference();

    screen.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-label">Progress: ${progress}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="question-header">
        <h2 class="screen-title">${question.title}</h2>
        ${
          canSpeak
            ? `
            <div class="speak-controls">
              <label class="sr-only" for="voice-choice">Voice</label>
              <select id="voice-choice" class="voice-select">
                <option value="female" ${voicePref === "female" ? "selected" : ""}>Female voice</option>
                <option value="male" ${voicePref === "male" ? "selected" : ""}>Male voice</option>
              </select>
              <button class="speak-btn" id="speak">🔊 Read aloud</button>
            </div>
          `
            : ""
        }
      </div>
      <p class="screen-subtitle">${question.subtitle}</p>
      <div class="question-options">
        ${question.options
          .map(
            (option) => `
          <button class="option-btn" data-value="${option.value}">
            <span class="option-title">
              <span class="option-emoji">${pickEmoji(option.value)}</span>
              <strong>${option.label}</strong>
            </span>
            <small>${option.note}</small>
            <span class="creature" data-say="${pickSpeech()}">${pickCreature()}</span>
          </button>`
          )
          .join("")}
      </div>
      <div class="actions">
        <button class="secondary" id="back">Back</button>
      </div>
    `;

    screen.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.getAttribute("data-value");
        const answers = getAnswers();
        answers[question.id] = value;
        setAnswers(answers);
        setStep(step + 1);
        renderQuestion();
      });
    });

    if (canSpeak) {
      screen.querySelector("#voice-choice").addEventListener("change", (event) => {
        setVoicePreference(event.target.value);
      });
      screen.querySelector("#speak").addEventListener("click", () => {
        speakQuestion(question);
      });
    }

    screen.querySelector("#back").addEventListener("click", () => {
      if (step === 0) {
        window.location.href = "index.html";
      } else {
        setStep(step - 1);
        renderQuestion();
      }
    });
  }

  renderQuestion();
});



