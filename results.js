document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();
  initMaybeLaterModal();
  applyTheme();

  const screen = document.getElementById("screen");
  const answers = getAnswers();
  const scores = calculateScores(answers);
  const favorites = new Set(getFavorites());

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

  const badges = getBadges(answers);
  const matchPercent = 80;

  screen.innerHTML = `
    <h2 class="screen-title">Your best matches</h2>
    <p class="screen-subtitle">Here are the instruments that fit your answers the most.</p>
    <div class="milestone">
      <div>
        <strong>You’re ${matchPercent}% matched</strong>
        <p>Great progress! Pick your favorites to build your shortlist.</p>
      </div>
      <div class="milestone-badge">Level up!</div>
    </div>
    <div class="badge-row">
      ${badges.map((badge) => `<span class="badge-pill">${badge}</span>`).join("")}
    </div>
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
          <button class="favorite-btn" data-id="${instrument.id}">
            ${favorites.has(instrument.id) ? "★ Saved to shortlist" : "☆ Save to shortlist"}
          </button>
          <div class="detail-panel">
            <strong>Why it fits:</strong>
            <p>${instrument.beginnerFit}</p>
          </div>
        </article>
      `
        )
        .join("")}
    </div>
    <div class="shortlist" id="shortlist">
      <h3>Your instrument shortlist</h3>
      <div class="shortlist-grid">
        ${renderShortlist(Array.from(favorites))}
      </div>
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

  screen.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const updated = new Set(toggleFavorite(id));
      btn.textContent = updated.has(id) ? "★ Saved to shortlist" : "☆ Save to shortlist";
      const shortlist = screen.querySelector("#shortlist .shortlist-grid");
      shortlist.innerHTML = renderShortlist(Array.from(updated));
    });
  });

  const confirm = screen.querySelector("#sign-confirm");
  confirm.classList.add("show");
  setTimeout(() => {
    confirm.classList.remove("show");
  }, 5000);
});

function renderShortlist(favoriteIds) {
  if (!favoriteIds.length) {
    return `<p class="screen-subtitle">No favorites yet. Tap “Save to shortlist”.</p>`;
  }
  return favoriteIds
    .map((id) => INSTRUMENTS.find((inst) => inst.id === id))
    .filter(Boolean)
    .map(
      (inst) => `
      <div class="shortlist-card">
        <strong>${inst.name}</strong>
        <p class="shortlist-meta">${inst.family}</p>
      </div>
    `
    )
    .join("");
}



