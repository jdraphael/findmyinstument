document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();

  const screen = document.getElementById("screen");
  const answers = getAnswers();
  const scores = calculateScores(answers);

  const ranked = [...INSTRUMENTS]
    .map((instrument) => ({
      ...instrument,
      score: scores[instrument.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!ranked.length) {
    window.location.href = "survey.html";
    return;
  }

  setLastFamily(ranked[0].family);

  const profile = getProfile();
  const name = profile.name ? `, ${profile.name}` : "";

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
    <div class="signin-confirm" id="sign-confirm">
      <p>Congrats you have been signed in.</p>
      <div class="confetti" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;

  screen.querySelector("#restart").addEventListener("click", () => {
    setAnswers({});
    setStep(0);
    window.location.href = "index.html";
  });

  screen.querySelector("#edit").addEventListener("click", () => {
    setStep(0);
    window.location.href = "survey.html";
  });

  screen.querySelector("#next-page").addEventListener("click", () => {
    window.location.href = "songs.html";
  });

  const confirm = screen.querySelector("#sign-confirm");
  confirm.classList.add("show");
  setTimeout(() => {
    confirm.classList.remove("show");
  }, 5000);
});



