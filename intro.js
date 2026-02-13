document.addEventListener("DOMContentLoaded", () => {
  initAccessibility();
  initMusicLauncher();
  initMaybeLaterModal();

  const screen = document.getElementById("screen");
  const profile = getProfile();
  if (profile.gender) {
    setTheme(profile.gender === "male" ? "male" : "female");
  } else {
    applyTheme();
  }

  screen.innerHTML = `
    <h2 class="screen-title">Let's get your match</h2>
    <p class="screen-subtitle">Start with a few basics so we can personalize your path.</p>
    <div class="form-grid">
      <div>
        <label for="gender">Gender</label>
        <select id="gender">
          <option value="">Select one</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
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

  if (profile.gender) {
    screen.querySelector("#gender").value = profile.gender;
  }
  if (profile.ageRange) {
    screen.querySelector("#age").value = profile.ageRange;
  }

  screen.querySelector("#start").addEventListener("click", () => {
    const gender = screen.querySelector("#gender").value;
    const ageRange = screen.querySelector("#age").value;
    if (!gender || !ageRange) {
      alert("Please select a gender and age range.");
      return;
    }
    setTheme(gender === "male" ? "male" : "female");
    setProfile({ gender, ageRange });
    setStep(0);
    setAnswers({});
    window.location.href = "survey.html";
  });

  screen.querySelector("#guest").addEventListener("click", () => {
    setTheme("female");
    setProfile({ gender: "", ageRange: "" });
    setStep(0);
    setAnswers({});
    window.location.href = "survey.html";
  });
});



