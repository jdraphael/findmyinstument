const STORAGE_KEYS = {
  profile: "fmi-profile",
  answers: "fmi-answers",
  step: "fmi-step",
  lastFamily: "fmi-last-family",
  largeText: "fmi-large-text",
  voice: "fmi-voice",
};

const memoryStore = {};
const storage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStore, key)
        ? memoryStore[key]
        : null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryStore[key] = value;
    }
  },
};
function getProfile() {
  return readJson(STORAGE_KEYS.profile, { name: "", ageRange: "" });
}

function setProfile(profile) {
  writeJson(STORAGE_KEYS.profile, profile);
}

function getAnswers() {
  return readJson(STORAGE_KEYS.answers, {});
}

function setAnswers(answers) {
  writeJson(STORAGE_KEYS.answers, answers);
}

function getStep() {
  return Number(storage.getItem(STORAGE_KEYS.step) || 0);
}

function setStep(step) {
  storage.setItem(STORAGE_KEYS.step, String(step));
}

function getLastFamily() {
  return storage.getItem(STORAGE_KEYS.lastFamily) || "Strings";
}

function setLastFamily(family) {
  storage.setItem(STORAGE_KEYS.lastFamily, family);
}

function readJson(key, fallback) {
  const stored = storage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function redirectOnReload() {
  const entries = ((performance && performance.getEntriesByType) ? performance.getEntriesByType("navigation") : []);
  const nav = entries && entries.length ? entries[0] : null;
  const isReload = nav && nav.type === "reload";
  if (!isReload) return;
  const path = window.location.pathname.toLowerCase();
  const isIndex = path.endsWith("/") || path.endsWith("index.html");
  if (!isIndex) {
    window.location.href = "index.html";
  }
}

function initAccessibility() {
  const toggle = document.getElementById("text-toggle");
  if (!toggle) return;
  const stored = storage.getItem(STORAGE_KEYS.largeText);
  if (stored === "on") {
    document.body.classList.add("large-text");
    toggle.textContent = "Bigger text: On";
  }

  toggle.addEventListener("click", () => {
    const isOn = document.body.classList.toggle("large-text");
    toggle.textContent = `Bigger text: ${isOn ? "On" : "Off"}`;
    storage.setItem(STORAGE_KEYS.largeText, isOn ? "on" : "off");
  });
}

function initMusicLauncher() {
  if (document.querySelector(".music-launcher")) return;

  const launcher = document.createElement("button");
  launcher.className = "music-launcher";
  launcher.setAttribute("aria-label", "Open music ideas");
  launcher.textContent = "🎵";

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

function calculateScores(answers) {
  const scores = {};

  INSTRUMENTS.forEach((instrument) => {
    scores[instrument.id] = 0;
  });

  QUESTIONS.forEach((question) => {
    const answer = answers[question.id];
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

function getVoicePreference() {
  return storage.getItem(STORAGE_KEYS.voice) || "female";
}

function setVoicePreference(value) {
  storage.setItem(STORAGE_KEYS.voice, value);
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

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderSheetCards(list, songs, headerText) {
  list.innerHTML = `${headerText || ""}` + songs
    .map(
      (song) => `
      <div class="sheet-card">
        <div class="staff"></div>
        <div class="sheet-content">
          <span class="note">♪</span>
          <div>
            <h4>${song.title}</h4>
            <small>${song.creator} · ${song.mood}</small>
          </div>
        </div>
        <div class="staff"></div>
      </div>
    `
    )
    .join("");
}


