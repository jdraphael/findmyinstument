const FAMILY_INSTRUMENT_MAP = {
  Strings: ["Violin", "Cello", "Guitar"],
  Winds: ["Flute", "Clarinet", "Saxophone"],
  Brass: ["Trumpet", "Trombone", "French Horn"],
  Percussion: ["Drums", "Snare Drum", "Marimba"],
  Keys: ["Piano", "Keyboard"],
  Mix: ["Piano", "Violin", "Flute", "Trumpet", "Drums"],
  Surprise: ["Piano", "Violin", "Flute", "Trumpet", "Drums"],
};

const FAMILY_INDEX = {
  Strings: 0,
  Winds: 0,
  Brass: 0,
  Percussion: 0,
  Keys: 0,
  Mix: 0,
  Surprise: 0,
};
document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();

  const screen = document.getElementById("screen");
  const lastFamily = getLastFamily();
  let currentInstrument = lastFamily;
  let currentXML = "";
screen.innerHTML = `
    <h2 class="screen-title">Instrument?</h2>
    <p class="screen-subtitle">Type an instrument and how many songs you want to see.</p>
    <div class="form-grid">
      <div>
        <label for="instrument-input">Instrument name</label>
        <input id="instrument-input" placeholder="Violin, Flute, Drum Kit..." value="${lastFamily}" />
      </div>
      <div>
        <label for="song-count">Amount of songs</label>
        <input id="song-count" type="number" min="1" max="20" value="5" />
      </div>
    </div>
    <div class="form-grid">
      <div>
        <label for="family-select">Instrument family options</label>
        <select id="family-select">
          <option value="Strings">Strings</option>
          <option value="Winds">Winds</option>
          <option value="Brass">Brass</option>
          <option value="Percussion">Percussion</option>
          <option value="Keys">Keys</option>
        </select>
      </div>
    </div>
    <div class="actions">
      <button class="primary" id="show-songs">Show songs</button>
      <button class="secondary" id="back-results">Back to results</button>
    </div>
    <div class="note-pad">
      <h3>Choose what you like</h3>
      <p class="screen-subtitle">Pick a family to update the song list.</p>
      <div class="note-buttons">
        <button data-family="Strings">Strings</button>
        <button data-family="Winds">Winds</button>
        <button data-family="Brass">Brass</button>
        <button data-family="Percussion">Percussion</button>
        <button data-family="Keys">Keys</button>
        <button data-family="Mix">Mix</button>
        <button data-family="Surprise">Surprise</button>
      </div>
    </div>
    <div class="musicxml-controls">
      <h3>Generate Sheet Music</h3>
      <p class="screen-subtitle">Create a short melody for your chosen instrument.</p>
      <div class="control-grid">
        <div>
          <label for="difficulty">Difficulty</label>
          <select id="difficulty">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
          </select>
        </div>
        <div>
          <label for="style">Style</label>
          <select id="style">
            <option value="happy">Happy</option>
            <option value="calm">Calm</option>
            <option value="epic">Epic</option>
            <option value="silly">Silly</option>
          </select>
        </div>
        <div>
          <label for="tempo">Tempo: <span id="tempo-value">96</span> BPM</label>
          <input id="tempo" type="range" min="60" max="140" value="96" />
        </div>
      </div>
      <div class="musicxml-actions">
        <button class="primary" id="generate-music">Generate Sheet Music</button>
        <button class="secondary" id="play-music" disabled>Play</button>
        <button class="secondary" id="download-music" disabled>Download MusicXML</button>
      </div>
      <div class="osmd-container" id="osmd-container"></div>
    </div>
    <div class="sheet-list" id="sheet-list" hidden></div>
  `;

  const input = screen.querySelector("#instrument-input");
  const countInput = screen.querySelector("#song-count");
  const familySelect = screen.querySelector("#family-select");
  const list = screen.querySelector("#sheet-list");
  const tempo = screen.querySelector("#tempo");
  const tempoValue = screen.querySelector("#tempo-value");
  const generateButton = screen.querySelector("#generate-music");
  const playButton = screen.querySelector("#play-music");
  const downloadButton = screen.querySelector("#download-music");
  const osmdContainer = screen.querySelector("#osmd-container");

  const renderDefault = () => {
    // No default song list on this page.
    list.setAttribute("hidden", "hidden");
  };

  familySelect.value = resolveFamily(input.value || lastFamily);
  familySelect.addEventListener("change", () => {
    const family = familySelect.value;
    input.value = family;
    currentInstrument = family;
  });

  screen.querySelector("#show-songs").addEventListener("click", () => {
    const name = input.value.trim() || lastFamily;
    input.value = name;
    currentInstrument = name;
  });

  screen.querySelector("#back-results").addEventListener("click", () => {
    window.location.href = "results.html";
  });

  screen.querySelectorAll(".note-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const family = btn.getAttribute("data-family");
      const count = Math.max(1, Math.min(20, Number(countInput.value || 5)));
      input.value = family;
      currentInstrument = family;
      familySelect.value = family;
      // Song list removed from this page.
    });
  });

  tempo.addEventListener("input", () => {
    tempoValue.textContent = tempo.value;
  });

  generateButton.addEventListener("click", () => {
    const chosenFamily = familySelect.value || currentInstrument;
    const instrument = pickInstrumentFromFamily(chosenFamily);
    const difficulty = screen.querySelector("#difficulty").value;
    const style = screen.querySelector("#style").value;
    const tempoValue = Number(tempo.value);
    currentXML = generateMusicXML({ instrument, difficulty, style, tempo: tempoValue });
    renderMusicXML(currentXML, osmdContainer);
    downloadButton.disabled = false;
    playButton.disabled = false;
  });

  downloadButton.addEventListener("click", () => {
    if (!currentXML) return;
    downloadMusicXML(currentXML, "find-my-instrument.xml");
  });

  playButton.addEventListener("click", () => {
    if (!currentXML) return;
    playSimpleMelody(currentXML);
  });

  renderDefault();
});

function renderSheetSongs(instrumentName, count, isDefault, list) {
  const family = resolveFamily(instrumentName);
  const songs = (SONG_LIBRARY[family] || []).slice(0, count);

  if (!songs.length) {
    list.innerHTML = `<p class="screen-subtitle">No songs found for that instrument yet. Try another one.</p>`;
    return;
  }

  const header = isDefault
    ? `<p class="screen-subtitle">Showing ${family} songs. Type a different instrument to change the list.</p>`
    : "";

  renderSheetCards(list, songs, header);
}

function renderMixedSongs(count, list) {
  const all = Object.values(SONG_LIBRARY).flat();
  const mix = shuffle(all).slice(0, count);
  renderSheetCards(list, mix, `<p class="screen-subtitle">Mixing songs from all families.</p>`);
}

function renderSurpriseSongs(count, list) {
  const families = Object.keys(SONG_LIBRARY);
  const family = families[Math.floor(Math.random() * families.length)];
  const songs = (SONG_LIBRARY[family] || []).slice(0, count);
  renderSheetCards(list, songs, `<p class="screen-subtitle">Surprise! Songs from ${family}.</p>`);
}

function normalizeInstrument(input) {
  const lower = (input || "").toLowerCase();
  if (lower.includes("piano") || lower.includes("keys")) return "Piano";
  if (lower.includes("guitar")) return "Guitar";
  if (lower.includes("violin") || lower.includes("strings")) return "Violin";
  if (lower.includes("flute") || lower.includes("winds")) return "Flute";
  if (lower.includes("trumpet") || lower.includes("brass") || lower.includes("clarinet")) return "Trumpet";
  if (lower.includes("drum") || lower.includes("percussion")) return "Drums";
  return "Piano";
}

function pickInstrumentFromFamily(family) {
  const list = FAMILY_INSTRUMENT_MAP[family] || FAMILY_INSTRUMENT_MAP.Strings;
  const index = FAMILY_INDEX[family] ?? 0;
  const chosen = list[index % list.length];
  FAMILY_INDEX[family] = (index + 1) % list.length;
  return chosen;
}

function renderMusicXML(xml, container) {
  if (!window.opensheetmusicdisplay) {
    container.innerHTML = "<p class=\"screen-subtitle\">Sheet music renderer failed to load.</p>";
    return;
  }
  container.innerHTML = "";
  const osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
    autoResize: true,
    drawTitle: false,
  });
  osmd
    .load(xml)
    .then(() => osmd.render())
    .catch(() => {
      container.innerHTML = "<p class=\"screen-subtitle\">Could not render the sheet music.</p>";
    });
}

function downloadMusicXML(xml, filename) {
  const blob = new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function generateMusicXML({ instrument, difficulty, style, tempo }) {
  // Build a short, kid-friendly melody with simple rhythms and stepwise motion.
  const isKeyboard = instrument === "Piano" || instrument === "Guitar";
  const measures = difficulty === "beginner" ? 8 : 12;
  const key = pickKeyForInstrument(instrument);
  const divisions = 2;
  const melodyRange = difficulty === "beginner" ? 5 : 7;
  const rhythmPool = difficulty === "beginner" ? beginnerRhythms() : intermediateRhythms();
  const scale = buildScale(key);
  const melody = [];
  let index = Math.floor(scale.length / 2);

  for (let m = 0; m < measures; m += 1) {
    const rhythm = rhythmPool[Math.floor(Math.random() * rhythmPool.length)];
    rhythm.forEach((dur) => {
      index = stepwiseIndex(index, scale.length, melodyRange, difficulty);
      melody.push({ pitch: scale[index], duration: dur });
    });
  }

  const chordProgression = isKeyboard ? ["I", "V", "vi", "IV"] : [];
  const styleComment = style ? `<!-- Style: ${style} -->` : "";
  const transpositionNote =
    instrument === "Trumpet"
      ? "<!-- For Bb instruments: written in concert C (no transposition) -->"
      : "";

  let xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC \"-//Recordare//DTD MusicXML 3.1 Partwise//EN\" \"http://www.musicxml.org/dtds/partwise.dtd\">\n` +
    `<score-partwise version=\"3.1\">\n` +
    `  ${styleComment}\n` +
    `  ${transpositionNote}\n` +
    `  <part-list>\n` +
    `    <score-part id=\"P1\">\n` +
    `      <part-name>${instrument}</part-name>\n` +
    `    </score-part>\n` +
    `  </part-list>\n` +
    `  <part id=\"P1\">\n`;

  let noteIndex = 0;
  for (let measure = 1; measure <= measures; measure += 1) {
    xml += `    <measure number=\"${measure}\">\n`;
    if (measure === 1) {
      xml += `      <attributes>\n` +
        `        <divisions>${divisions}</divisions>\n` +
        `        <key><fifths>${key.fifths}</fifths></key>\n` +
        `        <time><beats>4</beats><beat-type>4</beat-type></time>\n` +
        `        <clef><sign>G</sign><line>2</line></clef>\n` +
        `      </attributes>\n` +
        `      <direction placement=\"above\">\n` +
        `        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempo}</per-minute></metronome></direction-type>\n` +
        `      </direction>\n`;
    }

    const measureNotes = [];
    let beats = 0;
    while (beats < 8 && noteIndex < melody.length) {
      const note = melody[noteIndex];
      beats += note.duration;
      measureNotes.push(note);
      noteIndex += 1;
    }

    measureNotes.forEach((note) => {
      xml += `      <note>\n` +
        `        <pitch>\n` +
        `          <step>${note.pitch.step}</step>\n` +
        `          ${note.pitch.alter ? `<alter>${note.pitch.alter}</alter>\n` : ""}` +
        `          <octave>${note.pitch.octave}</octave>\n` +
        `        </pitch>\n` +
        `        <duration>${note.duration}</duration>\n` +
        `        <type>${durationType(note.duration)}</type>\n` +
        `      </note>\n`;
    });

    if (isKeyboard) {
      const chord = chordForMeasure(key, chordProgression[(measure - 1) % chordProgression.length]);
      xml += buildChordNotes(chord);
    }

    xml += `    </measure>\n`;
  }

  xml += `  </part>\n</score-partwise>\n`;
  return xml;
}

function pickKeyForInstrument(instrument) {
  if (instrument === "Piano" || instrument === "Guitar") return { name: "C", fifths: 0, baseOctave: 4 };
  if (instrument === "Violin" || instrument === "Flute") return { name: "D", fifths: 2, baseOctave: 5 };
  if (instrument === "Trumpet") return { name: "C", fifths: 0, baseOctave: 4 };
  return { name: "G", fifths: 1, baseOctave: 4 };
}

function buildScale(key) {
  const steps = key.name === "D"
    ? ["D", "E", "F#", "G", "A", "B", "C#"]
    : key.name === "G"
      ? ["G", "A", "B", "C", "D", "E", "F#"]
      : ["C", "D", "E", "F", "G", "A", "B"];

  const octaves = [key.baseOctave - 1, key.baseOctave, key.baseOctave + 1];
  const scale = [];
  octaves.forEach((oct) => {
    steps.forEach((step) => {
      const isSharp = step.includes("#");
      scale.push({
        step: step.replace("#", ""),
        alter: isSharp ? 1 : 0,
        octave: oct,
      });
    });
  });
  return scale;
}

function stepwiseIndex(current, max, range, difficulty) {
  const moves = difficulty === "beginner"
    ? [-1, 0, 1, 1, 0, -1, 2, -2]
    : [-2, -1, 0, 1, 2, 3, -3, 1];
  let next = current + moves[Math.floor(Math.random() * moves.length)];
  const mid = Math.floor(max / 2);
  const min = Math.max(0, mid - range);
  const maxIndex = Math.min(max - 1, mid + range);
  if (next < min) next = min;
  if (next > maxIndex) next = maxIndex;
  return next;
}

function beginnerRhythms() {
  return [
    [2, 2, 2, 2],
    [4, 4],
    [2, 2, 4],
    [4, 2, 2],
    [1, 1, 2, 2, 2],
  ];
}

function intermediateRhythms() {
  return [
    [1, 1, 1, 1, 2, 2],
    [2, 1, 1, 2, 2],
    [1, 1, 2, 1, 1, 2],
    [2, 2, 1, 1, 2],
    [1, 1, 1, 1, 1, 1, 2],
  ];
}

function durationType(duration) {
  if (duration === 1) return "eighth";
  if (duration === 2) return "quarter";
  if (duration === 4) return "half";
  if (duration === 8) return "whole";
  return "quarter";
}

function chordForMeasure(key, numeral) {
  const scale = buildScale(key);
  const baseIndexMap = { I: 0, IV: 3, V: 4, vi: 5 };
  const rootIndex = baseIndexMap[numeral] ?? 0;
  const base = Math.floor(scale.length / 3);
  const root = scale[base + rootIndex];
  const third = scale[base + rootIndex + 2];
  const fifth = scale[base + rootIndex + 4];
  return [root, third, fifth];
}

function buildChordNotes(chord) {
  return `
      <note>
        <pitch>
          <step>${chord[0].step}</step>
          ${chord[0].alter ? `<alter>${chord[0].alter}</alter>` : ""}
          <octave>${chord[0].octave - 1}</octave>
        </pitch>
        <duration>8</duration>
        <type>whole</type>
        <voice>2</voice>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>${chord[1].step}</step>
          ${chord[1].alter ? `<alter>${chord[1].alter}</alter>` : ""}
          <octave>${chord[1].octave - 1}</octave>
        </pitch>
        <duration>8</duration>
        <type>whole</type>
        <voice>2</voice>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>${chord[2].step}</step>
          ${chord[2].alter ? `<alter>${chord[2].alter}</alter>` : ""}
          <octave>${chord[2].octave - 1}</octave>
        </pitch>
        <duration>8</duration>
        <type>whole</type>
        <voice>2</voice>
      </note>
  `;
}

function playSimpleMelody(xml) {
  const noteRegex = new RegExp("<note>[\\s\\S]*?<\\/note>", "g");
  const notes = Array.from(xml.matchAll(noteRegex));
  if (!notes.length) return;
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  let cursor = 0;
  const tempoMatch = xml.match(new RegExp("<per-minute>(\\d+)<\\/per-minute>"));
  const bpm = tempoMatch ? Number(tempoMatch[1]) : 96;
  const secondsPerBeat = 60 / bpm;

  notes.forEach((match) => {
    const block = match[0];
    if (block.includes("<chord/>")) return;
    const stepMatch = block.match(new RegExp("<step>([A-G])<\\/step>"));
    const alterMatch = block.match(new RegExp("<alter>(-?\\d+)<\\/alter>"));
    const octaveMatch = block.match(new RegExp("<octave>(\\d+)<\\/octave>"));
    const durationMatch = block.match(new RegExp("<duration>(\\d+)<\\/duration>"));
    if (!stepMatch || !octaveMatch || !durationMatch) return;
    const step = stepMatch[1];
    const alter = alterMatch ? Number(alterMatch[1]) : 0;
    const octave = Number(octaveMatch[1]);
    const duration = Number(durationMatch[1]) / 2;
    const freq = noteFrequency(step, alter, octave);
    const start = now + cursor;
    const length = duration * secondsPerBeat;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
    gain.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);

    cursor += length;
  });
}

function noteFrequency(step, alter, octave) {
  const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semitone = map[step] + alter + (octave - 4) * 12;
  return 261.63 * Math.pow(2, semitone / 12);
}

function getAudioContext() {
  if (window.fmiAudioCtx) return window.fmiAudioCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  window.fmiAudioCtx = new AudioCtx();
  return window.fmiAudioCtx;
}



