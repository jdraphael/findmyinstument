const screen = document.getElementById("screen");

const state = {
  step: 0,
  profile: {
    name: "",
    ageRange: "",
  },
  answers: {},
  scores: {},
  showConfetti: false,
};

const stored = localStorage.getItem("fmi-profile");
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    state.profile = parsed.profile || state.profile;
    state.answers = parsed.answers || {};
  } catch (e) {
    // ignore
  }
}

function saveState() {
  localStorage.setItem(
    "fmi-profile",
    JSON.stringify({ profile: state.profile, answers: state.answers })
  );
}

function renderIntro() {
  screen.innerHTML = `
    <h2 class="screen-title">Let\'s get your match</h2>
    <p class="screen-subtitle">Start with a few basics so we can personalize your path.</p>
    <div class="form-grid">
      <div>
        <label for="name">Your name</label>
        <input id="name" placeholder="Jordan" value="${state.profile.name || ""}" />
      </div>
      <div>
        <label for="age">Age range</label>
        <select id="age">
          <option value="">Select one</option>
          <option value="9-11">9-11</option>
          <option value="12-14">12-14</option>
          <option value="15-17">15-17</option>
          <option value="18-20">18-20</option>
        </select>
      </div>
    </div>
    <div class="actions">
      <button class="primary" id="start">Start the questions</button>
      <button class="secondary" id="guest">Continue as guest</button>
    </div>
  `;

  if (state.profile.ageRange) {
    screen.querySelector("#age").value = state.profile.ageRange;
  }

  screen.querySelector("#start").addEventListener("click", () => {
    const name = screen.querySelector("#name").value.trim();
    const ageRange = screen.querySelector("#age").value;
    if (!ageRange) {
      alert("Please select an age range.");
      return;
    }
    state.profile = { name, ageRange };
    saveState();
    state.step = 0;
    renderQuestion();
  });

  screen.querySelector("#guest").addEventListener("click", () => {
    state.profile = { name: "", ageRange: "" };
    saveState();
    state.step = 0;
    renderQuestion();
  });
}

function renderQuestion() {
  const question = QUESTIONS[state.step];
  if (!question) {
    renderResults();
    return;
  }

  screen.innerHTML = `
    <h2 class="screen-title">${question.title}</h2>
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
      state.answers[question.id] = value;
      saveState();
      state.step += 1;
      renderQuestion();
    });
  });

  screen.querySelector("#back").addEventListener("click", () => {
    if (state.step === 0) {
      renderIntro();
    } else {
      state.step -= 1;
      renderQuestion();
    }
  });
}

function calculateScores() {
  const scores = {};

  INSTRUMENTS.forEach((instrument) => {
    scores[instrument.id] = 0;
  });

  QUESTIONS.forEach((question) => {
    const answer = state.answers[question.id];
    const option = question.options.find((opt) => opt.value === answer);
    if (!option) return;

    const weights = option.weights;

    INSTRUMENTS.forEach((instrument) => {
      let scoreAdd = 0;
      if (weights[instrument.family]) scoreAdd += weights[instrument.family];

      instrument.tags.forEach((tag) => {
        if (weights[tag]) scoreAdd += weights[tag];
      });

      scores[instrument.id] += scoreAdd;
    });
  });

  return scores;
}

function renderResults() {
  state.scores = calculateScores();
  const ranked = [...INSTRUMENTS]
    .map((instrument) => ({
      ...instrument,
      score: state.scores[instrument.id],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const name = state.profile.name ? `, ${state.profile.name}` : "";

  screen.innerHTML = `
    <h2 class="screen-title">Your best matches${name}</h2>
    <p class="screen-subtitle">Here are the instruments that fit your answers the most.</p>
    <div class="results-grid">
      ${ranked
        .map(
          (instrument) => `
        <article class="result-card">
          <h3>${instrument.name}</h3>
          <p><span class="tag">${instrument.family}</span>${instrument.tags
            .slice(0, 2)
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}</p>
          <p>${instrument.description}</p>
          <div class="detail-panel">
            <strong>Why it fits:</strong>
            <p>${instrument.beginnerFit}</p>
          </div>
        </article>
      `
        )
        .join("")}
    </div>
    <div class="actions">
      <button class="primary" id="restart">Start over</button>
      <button class="secondary" id="edit">Edit answers</button>
    </div>
    <div class="signin-confirm ${state.showConfetti ? "show" : ""}">
      <p>Congrats you have been signed in.</p>
      <div class="confetti" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;

  screen.querySelector("#restart").addEventListener("click", () => {
    state.answers = {};
    state.step = 0;
    saveState();
    renderIntro();
  });

  screen.querySelector("#edit").addEventListener("click", () => {
    state.step = 0;
    renderQuestion();
  });

  if (!state.showConfetti) {
    state.showConfetti = true;
    setTimeout(() => renderResults(), 40);
  }
}

renderIntro();

initMusicLauncher();

function pickEmoji(value) {
  const map = {
    Strings: "🎻",
    Winds: "🎼",
    Brass: "🎺",
    Percussion: "🥁",
    Keys: "🎹",
    open: "✨",
    classical: "🎼",
    popular: "🎸",
    jazz: "🎷",
    marching: "🥁",
    film: "🎬",
    chill: "🌙",
    balanced: "⚖️",
    high: "⚡",
    lead: "⭐",
    support: "🤝",
    rhythm: "🪘",
    foundation: "🏗️",
    short: "⏱️",
    long: "📚",
    creative: "🎨",
    bedroom: "🏠",
    school: "🏫",
    stage: "🎤",
  };
  return map[value] || "🎵";
}

function pickCreature() {
  const creatures = ["🦊", "🐙", "🦄", "🐸", "🐨", "🦉", "🐼", "🐝"];
  return creatures[Math.floor(Math.random() * creatures.length)];
}

function pickSpeech() {
  const lines = ["Hi!", "Pick me!", "You got this!", "So cool!", "Let's play!"];
  return lines[Math.floor(Math.random() * lines.length)];
}

function initMusicLauncher() {
  if (document.querySelector(".music-launcher")) return;

  const launcher = document.createElement("button");
  launcher.className = "music-launcher";
  launcher.setAttribute("aria-label", "Open music ideas");
  launcher.textContent = "♪";

  const panel = document.createElement("div");
  panel.className = "music-panel";
  panel.innerHTML = `
    <div class="panel-actions">
      <h3>Music ideas</h3>
      <button class="music-close" aria-label="Close">✕</button>
    </div>
    <p>Pick an instrument to explore songs and creators. Tap “Hear it” only if you want to listen.</p>
    <label for="music-instrument">Instrument</label>
    <select id="music-instrument">
      <option value="Strings">Strings</option>
      <option value="Winds">Winds</option>
      <option value="Brass">Brass</option>
      <option value="Percussion">Percussion</option>
      <option value="Keys">Keys</option>
    </select>
    <div class="music-list" id="music-list"></div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const select = panel.querySelector("#music-instrument");
  const list = panel.querySelector("#music-list");

  function renderSongs(family) {
    const songs = SONG_LIBRARY[family] || [];
    list.innerHTML = songs
      .map(
        (song) => `
      <div class="music-item">
        <h4>${song.title}</h4>
        <small>${song.creator} · ${song.mood}</small>
        <button data-query="${encodeURIComponent(
          `${song.title} ${song.creator}`
        )}">Hear it</button>
      </div>
    `
      )
      .join("");

    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const query = btn.getAttribute("data-query");
        const url = `https://www.youtube.com/results?search_query=${query}`;
        window.open(url, "_blank", "noopener");
      });
    });
  }

  renderSongs(select.value);

  launcher.addEventListener("click", () => {
    panel.classList.toggle("show");
  });

  panel.querySelector(".music-close").addEventListener("click", () => {
    panel.classList.remove("show");
  });

  select.addEventListener("change", (event) => {
    renderSongs(event.target.value);
  });
}
