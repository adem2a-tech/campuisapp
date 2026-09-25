/**
 * Proxy Campus 3D (Oscar / cosphilog) —
 * UI allégée, panneaux rétractables, recherche + traits de légende.
 */
import type { Plugin } from "vite";

const OSCAR_ORIGIN = "https://cosphilog.fr";
const PREFIX = "/oscar3d";

const INJECT = `
<style data-campus-oscar-ui="1">
  #divPlanDeCoupe, #divPositionPlan, #boutonModeDemploi,
  #divSelectTheme, #divShareThemeIcon, #divVersion,
  #boutonCirculatoire, #boutonReproducteur, #boutonLymphatique,
  #boutonRespiratoire, #boutonDigestif, #boutonExcreteur,
  #boutonEndocrinien, #boutonToutAfficher, #divConsigneApp {
    display: none !important;
  }
  #divGauche h2:nth-of-type(3),
  #divGauche p:has(+ #boutonCirculatoire) { display: none !important; }
  #divGauche, #divDroite {
    transition: width .25s ease, min-width .25s ease, padding .25s ease, opacity .2s ease;
  }
  #divGauche.campus-collapsed, #divDroite.campus-collapsed {
    width: 0 !important;
    min-width: 0 !important;
    padding: 0 !important;
    opacity: 0;
    overflow: hidden !important;
    pointer-events: none;
  }
  .campus-panel-toggle {
    position: absolute;
    top: 0.6em;
    z-index: 40;
    border: none;
    border-radius: 0.5em;
    background: #1e293b;
    color: #f8fafc;
    font: 600 0.75em/1 system-ui, sans-serif;
    padding: 0.45em 0.65em;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,.35);
  }
  .campus-panel-toggle:hover { background: #334155; }
  #campus-toggle-left { left: 0.5em; }
  #campus-toggle-right { right: 0.5em; }
  #h1Titre { font-size: 1.15em !important; }
</style>
<script data-campus-oscar-bridge="1">
(function () {
  function declutter() {
    try {
      ["divPlanDeCoupe","divPositionPlan","boutonModeDemploi","divSelectTheme","divShareThemeIcon","divVersion",
       "boutonCirculatoire","boutonReproducteur","boutonLymphatique","boutonRespiratoire","boutonDigestif",
       "boutonExcreteur","boutonEndocrinien","boutonToutAfficher","divConsigneApp"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      document.querySelectorAll("#divDroite h2").forEach(function (h) {
        var t = (h.textContent || "").toLowerCase();
        if (t.indexOf("thématique") >= 0 || t.indexOf("plan de coupe") >= 0 || t.indexOf("mode") >= 0) h.style.display = "none";
      });
      document.querySelectorAll("#divGauche p, #divGauche h2").forEach(function (n) {
        var t = (n.textContent || "").toLowerCase();
        if (t.indexOf("autres appareils") >= 0) n.style.display = "none";
      });
      var droite = document.getElementById("divDroite");
      if (droite) {
        droite.querySelectorAll("p").forEach(function (p) {
          var t = (p.textContent || "").toLowerCase();
          if (t.indexOf("souris") >= 0 || t.indexOf("survoler") >= 0 || t.indexOf("clic droit") >= 0 || t.indexOf("double cliquer") >= 0 || t.indexOf("avertissement") >= 0 || t.indexOf("tactile") >= 0 || t.indexOf("téléphone") >= 0) {
            p.style.display = "none";
          }
        });
      }
      var h1 = document.getElementById("h1Titre");
      if (h1) h1.textContent = "Campus 3D";
      if (document.title) document.title = "Campus 3D";
    } catch (e) {}
  }

  function setupCollapsible() {
    var left = document.getElementById("divGauche");
    var right = document.getElementById("divDroite");
    var centre = document.getElementById("divCentre") || document.body;
    if (!left || !right) return;
    if (document.getElementById("campus-toggle-left")) return;

    function mk(id, label, side, panel) {
      var b = document.createElement("button");
      b.type = "button";
      b.id = id;
      b.className = "campus-panel-toggle";
      b.textContent = label;
      b.title = "Afficher / masquer le panneau";
      b.onclick = function () {
        panel.classList.toggle("campus-collapsed");
        b.textContent = panel.classList.contains("campus-collapsed")
          ? (side === "left" ? "☰ Sexe / appareils" : "⌕ Recherche")
          : (side === "left" ? "« Masquer" : "Masquer »");
        try { if (typeof redim === "function") redim(); } catch (e) {}
      };
      centre.style.position = centre.style.position || "relative";
      document.body.appendChild(b);
    }
    mk("campus-toggle-left", "« Masquer", "left", left);
    mk("campus-toggle-right", "Masquer »", "right", right);
  }

  /** Traits de légende sur les organes trouvés par la recherche. */
  function addLegendesFromSearch() {
    try {
      if (typeof removeAllLegendes === "function") removeAllLegendes();
      if (typeof modele === "undefined" || typeof camera === "undefined" || typeof renderer === "undefined") return;
      if (typeof materialSearch === "undefined") return;
      var hits = [];
      modele.traverse(function (obj) {
        if (!obj.isMesh) return;
        if (obj.material === materialSearch || (Array.isArray(obj.material) && obj.material.indexOf(materialSearch) >= 0)) {
          hits.push(obj);
        }
      });
      // Dédupliquer par nom racine
      var seen = {};
      var unique = [];
      hits.forEach(function (obj) {
        var n = (obj.name || "").toLowerCase();
        var key = n.replace(/[0-9_].*$/, "").slice(0, 18) || n;
        if (!seen[key]) { seen[key] = true; unique.push(obj); }
      });
      unique.slice(0, 4).forEach(function (obj, i) {
        try {
          obj.updateWorldMatrix(true, false);
          var box = new THREE.Box3().setFromObject(obj);
          var center = box.getCenter(new THREE.Vector3());
          var v = center.clone().project(camera);
          var canvas = renderer.domElement;
          var sx = (v.x * 0.5 + 0.5) * canvas.clientWidth;
          var sy = (-v.y * 0.5 + 0.5) * canvas.clientHeight;
          // Légère offset pour éviter superposition
          sx += (i % 2 === 0 ? -8 : 8);
          sy += i * 6;
          if (typeof addLegende === "function") {
            var label = (typeof cleanNameFromObj === "function") ? cleanNameFromObj(obj) : (obj.name || "Zone");
            addLegende(sx, sy, label);
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  function runSearch(q) {
    var inp = document.getElementById("inputTextRecherche");
    if (!inp || typeof searchInput !== "function") return false;
    if (inp.value.indexOf("saisir") >= 0) inp.value = "";
    inp.value = q;
    searchInput();
    setTimeout(addLegendesFromSearch, 600);
    setTimeout(addLegendesFromSearch, 1400);
    return true;
  }

  var params = new URLSearchParams(window.location.search);
  var q = (params.get("q") || "").trim();
  var sex = (params.get("sex") || "").toUpperCase();
  var legends = (params.get("legends") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var tries = 0;

  function apply() {
    tries++;
    declutter();
    setupCollapsible();
    var ok = false;
    try {
      if (sex === "M" || sex === "F") {
        if (typeof changeSexe === "function") { changeSexe(sex); ok = true; }
      }
      var term = q.length >= 3 ? q : (legends[0] || "");
      if (term.length >= 3) {
        if (runSearch(term)) ok = true;
      }
    } catch (e) {}
    if ((ok && tries > 8) || tries > 90) clearInterval(timer);
  }

  declutter();
  var timer = setInterval(apply, 400);
  window.addEventListener("load", function () {
    setTimeout(apply, 600);
    setTimeout(setupCollapsible, 900);
  });
  document.addEventListener("DOMContentLoaded", function () { declutter(); setupCollapsible(); });
})();
</script>
`;

export function oscarCampusProxy(): Plugin {
  return {
    name: "oscar-campus-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const raw = req.url || "";
        if (!raw.startsWith(PREFIX)) return next();

        try {
          const pathAndQuery = raw.slice(PREFIX.length) || "/";
          const targetPath = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
          const target = `${OSCAR_ORIGIN}${PREFIX}${targetPath === "/" ? "/" : targetPath}`;

          const upstream = await fetch(target, {
            headers: {
              "user-agent": req.headers["user-agent"] || "CAMPUS-Oscar-Proxy",
              accept: req.headers.accept || "*/*",
            },
          });

          const ct = upstream.headers.get("content-type") || "application/octet-stream";
          res.statusCode = upstream.status;

          for (const [key, value] of upstream.headers.entries()) {
            const k = key.toLowerCase();
            if (
              k === "content-encoding" ||
              k === "content-length" ||
              k === "transfer-encoding" ||
              k === "x-frame-options" ||
              k === "content-security-policy"
            ) {
              continue;
            }
            res.setHeader(key, value);
          }

          if (ct.includes("text/html")) {
            let html = await upstream.text();
            if (!html.includes("data-campus-oscar-bridge")) {
              html = html.includes("</body>")
                ? html.replace("</body>", `${INJECT}</body>`)
                : html + INJECT;
            }
            // Branding dans le HTML source aussi
            html = html.replace(/<title>Oscar 3D<\/title>/i, "<title>Campus 3D</title>");
            html = html.replace(/>Oscar 3D</g, ">Campus 3D<");
            const buf = Buffer.from(html, "utf8");
            res.setHeader("content-type", "text/html; charset=utf-8");
            res.setHeader("content-length", String(buf.length));
            res.end(buf);
            return;
          }

          const buf = Buffer.from(await upstream.arrayBuffer());
          res.setHeader("content-length", String(buf.length));
          res.end(buf);
        } catch (err) {
          console.error("[oscar-campus-proxy]", err);
          res.statusCode = 502;
          res.end("Campus 3D indisponible");
        }
      });
    },
  };
}
