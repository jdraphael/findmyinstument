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
  confettiTimer: null,
  view: "intro",
  lastFamily: "Strings",
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
  state.view = "intro";
  setViewTheme();
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
  state.view = "question";
  setViewTheme();
  const question = QUESTIONS[state.step];
  if (!question) {
    renderResults();
    return;
  }

  const canSpeak = "speechSynthesis" in window;
  const voicePref = getVoicePreference();

  screen.innerHTML = `
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
            <button class="speak-btn" id="speak">ðŸ”Š Read aloud</button>
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
      state.answers[question.id] = value;
      saveState();
      state.step += 1;
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
  state.view = "results";
  setViewTheme();
  state.scores = calculateScores();
  const ranked = [...INSTRUMENTS]
    .map((instrument) => ({
      ...instrument,
      score: state.scores[instrument.id],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (ranked.length) {
    state.lastFamily = ranked[0].family;
  }

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
      <button class="secondary" id="next-page">next page</button>
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

  screen.querySelector("#next-page").addEventListener("click", () => {
    renderSongPage();
  });

  if (!state.showConfetti) {
    state.showConfetti = true;
    clearTimeout(state.confettiTimer);
    state.confettiTimer = setTimeout(() => {
      if (state.view !== "results") return;
      state.showConfetti = false;
      renderResults();
    }, 5000);
    setTimeout(() => {
      if (state.view === "results") renderResults();
    }, 40);
  }
}

renderIntro();

initMusicLauncher();
initAccessibility();

function pickEmoji(value) {
  const map = {
    Strings: "ðŸŽ»",
    Winds: "ðŸŽ¼",
    Brass: "ðŸŽº",
    Percussion: "ðŸ¥",
    Keys: "ðŸŽ¹",
    open: "âœ¨",
    classical: "ðŸŽ¼",
    popular: "ðŸŽ¸",
    jazz: "ðŸŽ·",
    marching: "ðŸ¥",
    film: "ðŸŽ¬",
    chill: "ðŸŒ™",
    balanced: "âš–ï¸",
    high: "âš¡",
    lead: "â­",
    support: "ðŸ¤",
    rhythm: "ðŸª˜",
    foundation: "ðŸ—ï¸",
    short: "â±ï¸",
    long: "ðŸ“š",
    creative: "ðŸŽ¨",
    bedroom: "ðŸ ",
    school: "ðŸ«",
    stage: "ðŸŽ¤",
  };
  return map[value] || "ðŸŽµ";
}

function pickCreature() {
  const creatures = ["ðŸ¦Š", "ðŸ™", "ðŸ¦„", "ðŸ¸", "ðŸ¨", "ðŸ¦‰", "ðŸ¼", "ðŸ"];
  return creatures[Math.floor(Math.random() * creatures.length)];
}

function pickSpeech() {
  const lines = ["Hi!", "Pick me!", "You got this!", "So cool!", "Let's play!"];
  return lines[Math.floor(Math.random() * lines.length)];
}

function renderSongPage() {
  state.view = "songs";
  state.showConfetti = false;
  clearTimeout(state.confettiTimer);
  setViewTheme();
  screen.innerHTML = `
    <h2 class="screen-title">Instrument?</h2>
    <p class="screen-subtitle">Type an instrument and how many songs you want to see.</p>
    <div class="form-grid">
      <div>
        <label for="instrument-input">Instrument name</label>
        <input id="instrument-input" placeholder="Violin, Flute, Drum Kit..." value="${state.lastFamily}" />
      </div>
      <div>
        <label for="song-count">Amount of songs</label>
        <input id="song-count" type="number" min="1" max="20" value="5" />
      </div>
    </div>
    <div class="actions">
      <button class="primary" id="show-songs">Show songs</button>
      <button class="secondary" id="back-results">Back to results</button>
    </div>
    <div class="note-pad">
      <h3>Press a number to pick a family</h3>
      <p class="screen-subtitle">Tap a button or press 1â€“7 on your keyboard.</p>
      <div class="note-buttons">
        <button data-family="Strings" data-num="1">1 Â· Strings</button>
        <button data-family="Winds" data-num="2">2 Â· Winds</button>
        <button data-family="Brass" data-num="3">3 Â· Brass</button>
        <button data-family="Percussion" data-num="4">4 Â· Percussion</button>
        <button data-family="Keys" data-num="5">5 Â· Keys</button>
        <button data-family="Mix" data-num="6">6 Â· Mix</button>
        <button data-family="Surprise" data-num="7">7 Â· Surprise</button>
      </div>
    </div>
    <div class="sheet-list" id="sheet-list"></div>
  `;

  screen.querySelector("#show-songs").addEventListener("click", () => {
    const input = screen.querySelector("#instrument-input");
    const name = input.value.trim() || state.lastFamily;
    input.value = name;
    const count = Math.max(
      1,
      Math.min(20, Number(screen.querySelector("#song-count").value || 5))
    );
    renderSheetSongs(name, count);
  });

  screen.querySelector("#back-results").addEventListener("click", () => {
    renderResults();
  });

  const initialCount = Math.max(
    1,
    Math.min(20, Number(screen.querySelector("#song-count").value || 5))
  );
  renderSheetSongs(state.lastFamily, initialCount, true);

  const noteButtons = screen.querySelectorAll(".note-buttons button");
  noteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const family = btn.getAttribute("data-family");
      const count = Math.max(
        1,
        Math.min(20, Number(screen.querySelector("#song-count").value || 5))
      );
      const input = screen.querySelector("#instrument-input");
      input.value = family;
      if (family === "Mix") {
        renderMixedSongs(count);
        return;
      }
      if (family === "Surprise") {
        renderSurpriseSongs(count);
        return;
      }
      renderSheetSongs(family, count);
    });
  });

  const keyHandler = (event) => {
    if (state.view !== "songs") return;
    const value = Number(event.key);
    const map = {
      1: "Strings",
      2: "Winds",
      3: "Brass",
      4: "Percussion",
      5: "Keys",
      6: "Mix",
      7: "Surprise",
    };
    const family = map[value];
    if (!family) return;
    const count = Math.max(
      1,
      Math.min(20, Number(screen.querySelector("#song-count").value || 5))
    );
    const input = screen.querySelector("#instrument-input");
    input.value = family;
    if (family === "Mix") {
      renderMixedSongs(count);
      return;
    }
    if (family === "Surprise") {
      renderSurpriseSongs(count);
      return;
    }
    renderSheetSongs(family, count);
  };
  if (window.handleNoteKeys) {
    window.removeEventListener("keydown", window.handleNoteKeys);
  }
  window.addEventListener("keydown", keyHandler);
  window.handleNoteKeys = keyHandler;
}

function renderSheetSongs(instrumentName, count, isDefault = false) {
  const list = screen.querySelector("#sheet-list");
  if (!list) return;

  const family = resolveFamily(instrumentName);
  const songs = (SONG_LIBRARY[family] || []).slice(0, count);

  const header = isDefault
    ? `<p class="screen-subtitle">Showing ${family} songs. Type a different instrument to change the list.</p>`
    : "";

  if (!songs.length) {
    list.innerHTML = `<p class="screen-subtitle">No songs found for that instrument yet. Try another one.</p>`;
    return;
  }

  list.innerHTML = header + songs
    .map(
      (song) => `
      <div class="sheet-card">
        <div class="staff"></div>
        <div class="sheet-content">
          <span class="note">â™ª</span>
          <div>
            <h4>${song.title}</h4>
            <small>${song.creator} Â· ${song.mood}</small>
          </div>
        </div>
        <div class="staff"></div>
      </div>
    `
    )
    .join("");
}

function renderMixedSongs(count) {
  const list = screen.querySelector("#sheet-list");
  if (!list) return;
  const all = Object.values(SONG_LIBRARY).flat();
  const mix = shuffle(all).slice(0, count);
  list.innerHTML = `<p class="screen-subtitle">Mixing songs from all families.</p>` + mix
    .map(
      (song) => `
      <div class="sheet-card">
        <div class="staff"></div>
        <div class="sheet-content">
          <span class="note">â™ª</span>
          <div>
            <h4>${song.title}</h4>
            <small>${song.creator} Â· ${song.mood}</small>
          </div>
        </div>
        <div class="staff"></div>
      </div>
    `
    )
    .join("");
}

function renderSurpriseSongs(count) {
  const list = screen.querySelector("#sheet-list");
  if (!list) return;
  const families = Object.keys(SONG_LIBRARY);
  const family = families[Math.floor(Math.random() * families.length)];
  const songs = (SONG_LIBRARY[family] || []).slice(0, count);
  list.innerHTML = `<p class="screen-subtitle">Surprise! Songs from ${family}.</p>` + songs
    .map(
      (song) => `
      <div class="sheet-card">
        <div class="staff"></div>
        <div class="sheet-content">
          <span class="note">â™ª</span>
          <div>
            <h4>${song.title}</h4>
            <small>${song.creator} Â· ${song.mood}</small>
          </div>
        </div>
        <div class="staff"></div>
      </div>
    `
    )
    .join("");
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function resolveFamily(input) {
  if (!input) return "Strings";
  const lower = input.toLowerCase();
  if (lower.includes("strings")) return "Strings";
  if (lower.includes("winds") || lower.includes("woodwind")) return "Winds";
  if (lower.includes("brass")) return "Brass";
  if (lower.includes("percussion")) return "Percussion";
  if (lower.includes("keys") || lower.includes("keyboard")) return "Keys";
  const match = INSTRUMENTS.find((inst) => inst.name.toLowerCase().includes(lower));
  if (match) return match.family;

  if (lower.includes("piano") || lower.includes("keyboard")) return "Keys";
  if (lower.includes("drum") || lower.includes("marimba") || lower.includes("snare")) return "Percussion";
  if (lower.includes("trumpet") || lower.includes("trombone") || lower.includes("horn")) return "Brass";
  if (lower.includes("flute") || lower.includes("clarinet") || lower.includes("sax")) return "Winds";
  return "Strings";
}


function initAccessibility() {
  const toggle = document.getElementById("text-toggle");
  const stored = localStorage.getItem("fmi-large-text");
  if (stored === "on") {
    document.body.classList.add("large-text");
    toggle.textContent = "Bigger text: On";
  }

  toggle.addEventListener("click", () => {
    const isOn = document.body.classList.toggle("large-text");
    toggle.textContent = `Bigger text: ${isOn ? "On" : "Off"}`;
    localStorage.setItem("fmi-large-text", isOn ? "on" : "off");
  });
}

function setViewTheme() {
  document.body.classList.remove("view-intro", "view-question", "view-results", "view-songs");
  document.body.classList.add(`view-${state.view}`);
}

function speakQuestion(question) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance();
  const optionsList = question.options.map((opt) => opt.label).join(", ");
  utterance.text = `${question.title}. ${question.subtitle}. Options are: ${optionsList}.`;
  const voices = window.speechSynthesis.getVoices();
  const preference = getVoicePreference();
  const chosen = pickVoice(voices, preference);
  if (chosen) utterance.voice = chosen;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function getVoicePreference() {
  return localStorage.getItem("fmi-voice") || "female";
}

function setVoicePreference(value) {
  localStorage.setItem("fmi-voice", value);
}

function pickVoice(voices, preference) {
  if (!voices || !voices.length) return null;
  const lowerPref = preference.toLowerCase();
  const maleHints = ["male", "man", "boy", "david", "mark", "james", "george"];
  const femaleHints = ["female", "woman", "girl", "samantha", "victoria", "zira", "karen"];
  const hints = lowerPref === "male" ? maleHints : femaleHints;
  const match = voices.find((voice) =>
    hints.some((hint) => voice.name.toLowerCase().includes(hint))
  );
  return match || voices[0];
}

function initMusicLauncher() {
  if (document.querySelector(".music-launcher")) return;

  const launcher = document.createElement("button");
  launcher.className = "music-launcher";
  launcher.setAttribute("aria-label", "Open music ideas");
  launcher.textContent = "ðŸŽµ";

  const panel = document.createElement("div");
  panel.className = "music-panel";
  panel.innerHTML = `
    <div class="panel-actions">
      <h3>Music ideas</h3>
      <button class="music-close" aria-label="Close">âœ•</button>
    </div>
    <p>Pick an instrument to explore songs and creators. Tap â€œHear itâ€ only if you want to listen.</p>
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
        <small>${song.creator} Â· ${song.mood}</small>
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

