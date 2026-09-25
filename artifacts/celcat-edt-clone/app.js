(() => {
  const START = 8;
  const END = 20;
  const PX = 60; // 60px / heure  → 30px / demi-heure

  const times = document.getElementById("times");
  const cols = [...document.querySelectorAll(".fc-col")];
  const detail = document.getElementById("detail");
  const status = document.getElementById("selStatus");

  const H = (END - START) * PX;
  times.style.height = H + "px";
  cols.forEach((c) => (c.style.height = H + "px"));

  function min(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function y(t) {
    return ((min(t) - START * 60) / 60) * PX;
  }
  function hgt(a, b) {
    return Math.max(14, ((min(b) - min(a)) / 60) * PX - 1);
  }

  for (let h = START; h <= END; h++) {
    const el = document.createElement("div");
    el.className = "h";
    el.textContent = String(h).padStart(2, "0");
    el.style.top = (h - START) * PX + "px";
    times.appendChild(el);
  }

  function render() {
    cols.forEach((c) => (c.innerHTML = ""));
    (window.EDT_EVENTS || []).forEach((ev) => {
      const col = cols.find((c) => Number(c.dataset.d) === ev.d);
      if (!col) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fc-event " + ev.c;
      btn.style.top = y(ev.s) + "px";
      btn.style.height = hgt(ev.s, ev.e) + "px";

      if (ev.cols > 1) {
        const w = 100 / ev.cols;
        btn.style.left = `calc(${ev.col * w}% + 1px)`;
        btn.style.width = `calc(${w}% - 2px)`;
        btn.style.right = "auto";
      }

      let html = `<span class="t">${ev.s} - ${ev.e}</span><span class="n">${ev.n}</span>`;
      if (ev.r) html += `<span class="m">${ev.r}</span>`;
      if (ev.p) html += `<span class="m">${ev.p}</span>`;
      btn.innerHTML = html;

      btn.addEventListener("click", () => {
        document.querySelectorAll(".fc-event.sel").forEach((n) => n.classList.remove("sel"));
        btn.classList.add("sel");
        status.textContent = `${ev.s} – ${ev.e}`;
        detail.hidden = false;
        detail.innerHTML = `<h3>${ev.n}</h3>
          <p><b>Horaire :</b> ${ev.s} – ${ev.e}</p>
          <p><b>Salle :</b> ${ev.r || "—"}</p>
          <p><b>Enseignant :</b> ${ev.p || "—"}</p>`;
      });

      col.appendChild(btn);
    });
  }

  render();
})();
