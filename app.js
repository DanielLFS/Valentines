(() => {
  "use strict";

  const cfg = window.VAL_CONFIG;
  if (!cfg || !Array.isArray(cfg.scenes)) {
    throw new Error("Missing VAL_CONFIG. Check config.js");
  }

  const $ = (id) => document.getElementById(id);

  const scrollRootEl = $("scrollRoot");
  const singleCardEl = $("singleCard");

  // Single-card elements
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

  // Scroll mode
  function scrollToScene(sceneId) {
    const el = document.getElementById(`scene-${sceneId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function createActionsRow(scene, mode) {
    const wrap = document.createElement("div");
    wrap.className = "actions";

    const actions = Array.isArray(scene.actions) ? scene.actions : [];
    const safeActions = actions.filter((a) => {
      if (!cfg.allowNo && scene.id === "question" && a.to === "no") return false;
      return true;
    });

    for (const action of safeActions) {
      const btn = document.createElement("button");
      btn.type = "button";
      const variant = action.variant === "secondary" ? "secondary" : "primary";
      btn.className = `btn ${variant === "primary" ? "btnPrimary" : "btnSecondary"}`;
      btn.textContent = action.label || "Continue";

      if (mode === "scroll") {
        btn.addEventListener("click", () => {
          if (action.to) scrollToScene(action.to);
          if (action.to && scenesById.get(action.to)?.confetti) burstConfetti();
          history.replaceState({ sceneId: action.to }, "", `#${encodeURIComponent(action.to || scene.id)}`);
        });
      } else {
        btn.addEventListener("click", () => {
          if (action.to) goTo(action.to);
        });
      }

      // Playful runaway No button (guardrails live in config + we also render a real No link)
      if (
        cfg.runawayNo?.enabled &&
        scene.id === "question" &&
        action.runaway &&
        action.to === "no"
      ) {
        let dodges = 0;
        const maxDodges = Math.max(0, cfg.runawayNo?.maxDodges ?? 0);
        const stopAfter = cfg.runawayNo?.stopAfterMaxDodges !== false;
        const scrollPerDodge = Math.max(0, cfg.runawayNo?.scrollPerDodgePx ?? 0);

        const dodge = () => {
          if (stopAfter && dodges >= maxDodges) return;
          dodges += 1;

          const maxX = Math.min(220, Math.max(60, window.innerWidth * 0.25));
          const maxY = 120;
          const dx = (Math.random() - 0.5) * 2 * maxX;
          const dy = (Math.random() - 0.25) * 2 * maxY;

          btn.style.setProperty("--tx", `${dx.toFixed(0)}px`);
          btn.style.setProperty("--ty", `${dy.toFixed(0)}px`);

          if (scrollPerDodge > 0) {
            window.scrollBy({ top: scrollPerDodge, behavior: "smooth" });
          }
        };

        btn.addEventListener("pointerenter", dodge);
        btn.addEventListener("pointerdown", dodge);
      }

      wrap.appendChild(btn);
    }

    return wrap;
  }

  function renderScroll() {
    // Hide single card and render scroll stack
    singleCardEl.hidden = true;
    scrollRootEl.hidden = false;
    scrollRootEl.innerHTML = "";

    const reveal = cfg.revealOnScroll !== false;
    const observer =
      reveal && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (e.isIntersecting) e.target.classList.add("isVisible");
              }
            },
            { threshold: 0.18 }
          )
        : null;

    for (let i = 0; i < cfg.scenes.length; i++) {
      const scene = cfg.scenes[i];
      const nextScene = cfg.scenes[i + 1];

      const card = document.createElement("section");
      card.className = "sceneCard";
      card.id = `scene-${scene.id}`;
      card.dataset.reveal = reveal ? "true" : "false";
      if (!reveal) card.classList.add("isVisible");

      const header = document.createElement("header");
      header.className = "header";
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = cfg.badgeText || "";
      const h1 = document.createElement("h2");
      h1.className = "title";
      h1.textContent = scene.title || "";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = scene.subtitle || "";
      header.appendChild(badge);
      header.appendChild(h1);
      header.appendChild(sub);
      card.appendChild(header);

      // Image
      const key = scene.imageKey;
      const src = key ? cfg.images?.[key] : null;
      if (src) {
        const media = document.createElement("div");
        media.className = "media";
        const img = document.createElement("img");
        img.src = src;
        img.alt = scene.imageAlt || "";
        media.appendChild(img);
        card.appendChild(media);
      }

      // Body
      const body = document.createElement("div");
      body.className = "body";
      for (const line of scene.body || []) {
        const p = document.createElement("p");
        p.textContent = line;
        body.appendChild(p);
      }
      card.appendChild(body);

      // Actions
      card.appendChild(createActionsRow(scene, "scroll"));

      // Always-available honest "No" link (guardrail) on the question scene
      if (scene.id === "question" && cfg.allowNo) {
        const noLink = document.createElement("button");
        noLink.type = "button";
        noLink.className = "microLink";
        noLink.textContent = "No thanks (serious)";
        noLink.addEventListener("click", () => scrollToScene("no"));
        card.appendChild(noLink);
      }

      // Scroll-next helper
      if (nextScene) {
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "link";
        nextBtn.textContent = "Scroll to next ↓";
        nextBtn.addEventListener("click", () => scrollToScene(nextScene.id));
        const footer = document.createElement("footer");
        footer.className = "footer";
        footer.appendChild(nextBtn);
        const hint = document.createElement("span");
        hint.className = "hint";
        hint.textContent = cfg.hintText || "";
        footer.appendChild(hint);
        card.appendChild(footer);
      }

      scrollRootEl.appendChild(card);
      if (observer) observer.observe(card);
    }

    // Jump to hash scene if present
    const initial = getInitialScene();
    setTimeout(() => scrollToScene(initial), 0);
  }

  // Render
  const mode = (cfg.mode || "single").toLowerCase();
  if (mode === "scroll") {
    renderScroll();
  } else {
    // single
    scrollRootEl.hidden = true;
    singleCardEl.hidden = false;
    goTo(getInitialScene());
  }
})();
