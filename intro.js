document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();

  const screen = document.getElementById("screen");
  const profile = getProfile();

  screen.innerHTML = `
    <h2 class="screen-title">Let's get your match</h2>
    <p class="screen-subtitle">Start with a few basics so we can personalize your path.</p>
    <div class="form-grid">
      <div>
        <label for="name">Your name</label>
        <input id="name" placeholder="Jordan" value="${profile.name || ""}" />
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

  if (profile.ageRange) {
    screen.querySelector("#age").value = profile.ageRange;
  }

  screen.querySelector("#start").addEventListener("click", () => {
    const name = screen.querySelector("#name").value.trim();
    const ageRange = screen.querySelector("#age").value;
    if (!ageRange) {
      alert("Please select an age range.");
      return;
    }
    setProfile({ name, ageRange });
    setStep(0);
    setAnswers({});
    window.location.href = "survey.html";
  });

  screen.querySelector("#guest").addEventListener("click", () => {
    setProfile({ name: "", ageRange: "" });
    setStep(0);
    setAnswers({});
    window.location.href = "survey.html";
  });
});



