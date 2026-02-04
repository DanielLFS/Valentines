(() => {
  "use strict";

  const cfg = window.VAL_CONFIG;
  if (!cfg || !Array.isArray(cfg.scenes)) {
    throw new Error("Missing VAL_CONFIG. Check config.js");
  }

  const $ = (id) => document.getElementById(id);
  const titleEl = $("title");
  const subtitleEl = $("subtitle");
  const bodyEl = $("body");
  const actionsEl = $("actions");
  const badgeEl = $("badge");
  const hintEl = $("hint");
  const restartEl = $("restart");

  const mediaWrapEl = $("media");
  const imageEl = $("image");

  const confettiCanvas = $("confetti");
  const confettiCtx = confettiCanvas.getContext("2d");

  document.title = cfg.pageTitle || document.title;
  badgeEl.textContent = cfg.badgeText || "";
  hintEl.textContent = cfg.hintText || "";

  const scenesById = new Map(cfg.scenes.map((s) => [s.id, s]));

  function setBodyParagraphs(lines) {
    bodyEl.innerHTML = "";
    for (const line of lines || []) {
      const p = document.createElement("p");
      p.textContent = line;
      bodyEl.appendChild(p);
    }
  }

  function setImage(scene) {
    const key = scene.imageKey;
    const src = key ? cfg.images?.[key] : null;

    if (!src) {
      mediaWrapEl.hidden = true;
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      return;
    }

    mediaWrapEl.hidden = false;
    imageEl.src = src;
    imageEl.alt = scene.imageAlt || "";
  }

  function clearActions() {
    actionsEl.innerHTML = "";
  }

  function addButton(action) {
    const btn = document.createElement("button");
    btn.type = "button";

    const variant = action.variant === "secondary" ? "secondary" : "primary";
    btn.className = `btn ${variant === "primary" ? "btnPrimary" : "btnSecondary"}`;
    btn.textContent = action.label || "Continue";

    btn.addEventListener("click", () => {
      if (action.onClick === "restart") {
        goTo("intro");
        return;
      }
      if (action.to) {
        goTo(action.to);
      }
    });

    actionsEl.appendChild(btn);
  }

  function renderScene(sceneId) {
    const scene = scenesById.get(sceneId);
    if (!scene) throw new Error(`Unknown scene: ${sceneId}`);

    // Respectful behavior for "No" if allowNo=false:
    // we still show the "no" scene, we just let you tailor what it says.
    titleEl.textContent = scene.title || "";
    subtitleEl.textContent = scene.subtitle || "";
    setBodyParagraphs(scene.body);
    setImage(scene);

    clearActions();

    const actions = Array.isArray(scene.actions) ? scene.actions : [];
    const safeActions = actions.filter((a) => {
      if (!cfg.allowNo && sceneId === "question" && a.to === "no") return false;
      return true;
    });

    for (const action of safeActions) addButton(action);

    restartEl.hidden = sceneId === "intro";

    if (scene.confetti) {
      burstConfetti();
    }

    history.replaceState({ sceneId }, "", `#${encodeURIComponent(sceneId)}`);
  }

  function goTo(sceneId) {
    renderScene(sceneId);
  }

  function getInitialScene() {
    const hash = (location.hash || "").replace(/^#/, "").trim();
    if (hash && scenesById.has(hash)) return hash;
    return "intro";
  }

  // Confetti (tiny, no dependencies)
  function resizeCanvas() {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCanvas.style.width = `${window.innerWidth}px`;
    confettiCanvas.style.height = `${window.innerHeight}px`;
    confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function burstConfetti() {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const colors = ["#ff3f84", "#7c3aed", "#22c55e", "#06b6d4", "#f59e0b"]; 
    const particles = [];

    const count = 170;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
        y: window.innerHeight / 3 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10 - 2,
        size: Math.random() * 6 + 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0],
        life: 0,
        ttl: Math.random() * 40 + 70,
      });
    }

    let frame = 0;

    function step() {
      frame++;
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particles) {
        p.life += 1;
        p.vy += 0.18;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const alpha = Math.max(0, 1 - p.life / p.ttl);
        confettiCtx.save();
        confettiCtx.globalAlpha = alpha;
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        confettiCtx.restore();
      }

      const alive = particles.some((p) => p.life < p.ttl);
      if (alive) requestAnimationFrame(step);
      else confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    requestAnimationFrame(step);
  }

  // Wire restart button
  restartEl.addEventListener("click", () => goTo("intro"));

  // Render
  goTo(getInitialScene());
})();
