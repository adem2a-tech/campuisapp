(() => {
  const form = document.getElementById("fm1");
  const password = document.getElementById("password");
  const revealBtn = document.querySelector(".reveal-password");

  if (revealBtn && password) {
    revealBtn.addEventListener("click", () => {
      const showing = password.type === "text";
      password.type = showing ? "password" : "text";
      const icon = revealBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("mdi-eye", showing);
        icon.classList.toggle("mdi-eye-off", !showing);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      // Clone local — aucune donnée n'est envoyée
      alert("Clone local : aucune authentification réelle. Les identifiants ne sont pas transmis.");
    });
  }
})();
