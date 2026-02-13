document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();
  initMaybeLaterModal();
  applyTheme();

  const screen = document.getElementById("screen");
  const answers = getAnswers();
  const earned = new Set(getBadges(answers));

  const visibleBadges = BADGE_INVENTORY
    .filter((badge) => {
      if (badge.ui && badge.ui.hiddenUntilEligible && !earned.has(badge.name)) return false;
      return true;
    })
    .sort((a, b) => (a.ui?.order || 0) - (b.ui?.order || 0));

  screen.innerHTML = `
    <h2 class="screen-title">Badge Collection</h2>
    <p class="screen-subtitle">Collect badges as you explore instruments and styles.</p>
    <div class="badge-legend">
      <span class="badge-pill">Starter</span>
      <span class="badge-pill">Explorer</span>
      <span class="badge-pill">Identity</span>
      <span class="badge-pill">Mastery</span>
      <span class="badge-pill">Elite</span>
    </div>
    <div class="badge-grid">
      ${visibleBadges
        .map((badge) => renderBadgeCard(badge, earned))
        .join("")}
    </div>
    <div class="badge-gallery">
      <h3>Badge previews</h3>
      <p class="screen-subtitle">Here’s what each badge looks like.</p>
      <div class="badge-gallery-grid">
        ${visibleBadges
          .map(
            (badge) => `
          <div class="badge-preview">
            <img src="${badge.assets?.svg || ""}" alt="${badge.name} badge preview" />
            <span>${badge.name}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  screen.querySelectorAll(".badge-card").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-key");
      const badge = BADGE_INVENTORY.find((b) => b.key === key);
      if (!badge) return;
      showBadgeDetail(badge, earned);
    });
  });
});

function renderBadgeCard(badge, earned) {
  const isEarned = earned.has(badge.name);
  const lockedClass = isEarned ? "earned" : "locked";
  const svgPath = badge.assets?.svg || "";
  const unlockText = getUnlockText(badge);
  return `
    <button class="badge-card ${lockedClass}" type="button" data-key="${badge.key}">
      <div class="badge-icon">
        ${svgPath ? `<img src="${svgPath}" alt="${badge.name} badge" class="badge-svg" />` : `<span>${badge.name.split(" ")[0]}</span>`}
      </div>
      <span class="badge-title">${badge.name}</span>
      <span class="badge-desc">${unlockText}</span>
      <span class="badge-meta">${badge.tier.toUpperCase()} · ${badge.category.toUpperCase()}</span>
      <span class="badge-state">${isEarned ? "Unlocked" : "Locked"}</span>
    </button>
  `;
}

function getUnlockText(badge) {
  if (!badge.unlock || !badge.unlock.rules) return "Keep exploring to unlock.";
  return badge.unlock.rules
    .map((rule) => {
      switch (rule.type) {
        case "quiz_complete":
          return `Finish ${rule.value.replace(/_/g, " ")}`;
        case "audio_samples_listened":
          return `Listen to ${rule.value} samples`;
        case "minigame_score_at_least":
          return `Score ${rule.value.score}+ in ${rule.value.game.replace(/_/g, " ")}`;
        case "instrument_selected":
          return `Choose ${rule.value.replace(/_/g, " ")}`;
        case "path_complete":
          return `Complete ${rule.value.replace(/_/g, " ")}`;
        case "category_explored_count":
          return `Explore ${rule.value.count} ${rule.value.category} instruments`;
        case "lesson_complete":
          return `Complete ${rule.value.replace(/_/g, " ")}`;
        case "feature_used":
          return `Use ${rule.value.replace(/_/g, " ")}`;
        case "activities_completed":
          return `Complete ${rule.value} activities`;
        case "play_along_completed":
          return `Finish ${rule.value} play along`;
        case "genre_explored":
          return `Explore ${rule.value} style`;
        case "streak_days":
          return `${rule.value}-day streak`;
        case "all_core_badges_unlocked":
          return "Unlock all core badges";
        default:
          return "Keep exploring to unlock.";
      }
    })
    .join(" + ");
}

function showBadgeDetail(badge, earned) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay show";
  const isEarned = earned.has(badge.name);
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <h3>${badge.name}</h3>
      <p>${getUnlockText(badge)}</p>
      <p><strong>Tier:</strong> ${badge.tier} · <strong>Category:</strong> ${badge.category}</p>
      <div class="modal-actions">
        <button class="modal-stay" type="button">Change my mind</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector(".modal-stay").addEventListener("click", () => {
    overlay.remove();
  });

  if (isEarned) {
    playBadgeSound(badge.tier);
  }
}

function playBadgeSound(tier) {
  const toneMap = {
    starter: 523.25,
    explorer: 659.25,
    identity: 587.33,
    mastery: 783.99,
    elite: 987.77,
  };
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = toneMap[tier] || 523.25;
  osc.type = "sine";
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.35);
}
