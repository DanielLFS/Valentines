(() => {
  "use strict";

  const cfg = window.VAL_CONFIG;
  if (!cfg || !Array.isArray(cfg.scenes)) {
    throw new Error("Missing VAL_CONFIG. Check config.js");
  }

  const $ = (id) => document.getElementById(id);

  const scrollRootEl = $("scrollRoot");
  const scrollyRootEl = $("scrollyRoot");
  const floatLayerEl = $("floatLayer");
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

  const pageId = (document.body?.dataset?.page || "").toLowerCase();

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
    // Keep float/scrolly containers intact; only clear the content area.
    floatLayerEl.innerHTML = "";
    scrollyRootEl.innerHTML = "";

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

      scrollyRootEl.appendChild(card);
      if (observer) observer.observe(card);
    }

    // Jump to hash scene if present
    const initial = getInitialScene();
    setTimeout(() => scrollToScene(initial), 0);
  }

  // Scrolly (Apple-like pinned chapters)
  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpObj(from, to, t) {
    return {
      x: lerp(from.x ?? 0, to.x ?? 0, t),
      y: lerp(from.y ?? 0, to.y ?? 0, t),
      rot: lerp(from.rot ?? 0, to.rot ?? 0, t),
      scale: lerp(from.scale ?? 1, to.scale ?? 1, t),
      opacity: lerp(from.opacity ?? 1, to.opacity ?? 1, t),
    };
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  async function loadLinesFile(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return [];
    const text = await res.text();
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  }

  function renderScrolly() {
    const chapters = Array.isArray(cfg.chapters) ? cfg.chapters : null;
    if (!chapters || chapters.length === 0) {
      // Fall back to normal scroll stack if no chapters are defined
      renderScroll();
      return;
    }

    singleCardEl.hidden = true;
    scrollRootEl.hidden = false;
    scrollyRootEl.innerHTML = "";
    floatLayerEl.innerHTML = "";

    // Sticky progress pill
    const pill = document.createElement("div");
    pill.className = "progressPill";
    pill.textContent = "Scroll";
    scrollyRootEl.appendChild(pill);

    const chapterEls = [];
    const chapterMeta = new Map();

    // Build DOM
    for (const ch of chapters) {
      const track = document.createElement("div");
      track.className = "chapterTrack";
      track.id = `chapter-${ch.id}`;
      track.style.setProperty("--trackH", `${Math.max(120, ch.trackVh ?? 160)}vh`);

      const sticky = document.createElement("div");
      sticky.className = "chapterSticky";

      const chapter = document.createElement("section");
      chapter.className = "chapter";
      chapter.dataset.chapterId = ch.id;

      const header = document.createElement("header");
      header.className = "header";
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = cfg.badgeText || "";
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = ch.title || "";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = ch.subtitle || "";
      header.appendChild(badge);
      header.appendChild(h);
      header.appendChild(sub);
      chapter.appendChild(header);

      // Layout
      const layout = (ch.layout || "split").toLowerCase();
      const grid = document.createElement("div");
      grid.className = "chapterGrid";

      // Left: body
      const left = document.createElement("div");
      left.className = "body";
      for (const line of ch.body || []) {
        const p = document.createElement("p");
        p.textContent = line;
        left.appendChild(p);
      }

      // Right: media / interactive area
      const right = document.createElement("div");
      if (layout === "question") {
        // Chase UI lives here
        const zone = document.createElement("div");
        zone.className = "chaseZone";

        const yesBtn = document.createElement("button");
        yesBtn.type = "button";
        yesBtn.className = "btn btnPrimary";
        yesBtn.textContent = "Yes 💖";
        yesBtn.dataset.chase = "yes";

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.className = "btn btnSecondary";
        noBtn.textContent = "Not this time";
        noBtn.dataset.chase = "no";

        // Initial placement
        yesBtn.style.position = "absolute";
        noBtn.style.position = "absolute";
        yesBtn.style.left = "18%";
        yesBtn.style.top = "38%";
        noBtn.style.left = "58%";
        noBtn.style.top = "58%";

        zone.appendChild(yesBtn);
        zone.appendChild(noBtn);

        const hud = document.createElement("div");
        hud.className = "chaseHud";
        const taunt = document.createElement("div");
        taunt.className = "taunt";
        taunt.textContent = "(Tip: move your cursor near the buttons.)";

        const serious = document.createElement("div");
        serious.className = "microRow";

        if (cfg.allowNo && cfg.chase?.showSeriousLinks !== false) {
          const seriousYes = document.createElement("button");
          seriousYes.type = "button";
          seriousYes.className = "microLink";
          seriousYes.textContent = "Yes (serious)";
          seriousYes.addEventListener("click", () => scrollToChapter("yes"));

          const seriousNo = document.createElement("button");
          seriousNo.type = "button";
          seriousNo.className = "microLink";
          seriousNo.textContent = "No thanks (serious)";
          seriousNo.addEventListener("click", () => scrollToChapter("no"));

          serious.appendChild(seriousYes);
          serious.appendChild(seriousNo);
        }

        const note = document.createElement("div");
        note.className = "microNote";
        note.textContent = "This is just a playful effect — your choice is always respected.";

        hud.appendChild(taunt);
        hud.appendChild(note);

        right.appendChild(zone);
        right.appendChild(hud);
        if (serious.childNodes.length) right.appendChild(serious);

        // Chase behavior
        const chaseCfg = cfg.chase || {};
        const reduced = prefersReducedMotion();
        const enabled = chaseCfg.enabled !== false && !reduced;
        const yesDodges = Math.max(0, chaseCfg.yesDodges ?? 0);
        const noDodges = Math.max(0, chaseCfg.noDodges ?? 0);
        const radius = Math.max(40, chaseCfg.triggerRadiusPx ?? 110);
        const dodgeDist = Math.max(60, chaseCfg.dodgeDistancePx ?? 170);
        const taunts = Array.isArray(chaseCfg.taunts) && chaseCfg.taunts.length ? chaseCfg.taunts : ["Hehe."];
        let tauntIndex = 0;

        const state = {
          yes: { dodges: 0, max: yesDodges, givenUp: yesDodges === 0 },
          no: { dodges: 0, max: noDodges, givenUp: noDodges === 0 },
        };

        function setTaunt(text) {
          taunt.textContent = text;
        }

        function nextTaunt() {
          tauntIndex = (tauntIndex + 1) % taunts.length;
          setTaunt(taunts[tauntIndex]);
        }

        function within(el, rect, x, y, pad) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = x - cx;
          const dy = y - cy;
          return Math.hypot(dx, dy) <= pad;
        }

        function dodge(el, which) {
          const s = state[which];
          if (!enabled || s.givenUp) return;
          if (s.dodges >= s.max) {
            s.givenUp = true;
            setTaunt(which === "yes" ? "Okay okay — you can click me now." : "Alright, you win. Click me if you mean it.");
            // Snap transforms back
            el.style.setProperty("--tx", "0px");
            el.style.setProperty("--ty", "0px");
            return;
          }

          s.dodges += 1;
          nextTaunt();

          const zoneRect = zone.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();

          // Random move within the zone
          const margin = 18;
          const maxLeft = zoneRect.width - elRect.width - margin;
          const maxTop = zoneRect.height - elRect.height - margin;

          const newLeft = margin + Math.random() * Math.max(1, maxLeft - margin);
          const newTop = margin + Math.random() * Math.max(1, maxTop - margin);

          el.style.left = `${newLeft}px`;
          el.style.top = `${newTop}px`;

          // Add a little kick
          const dx = (Math.random() - 0.5) * 2 * dodgeDist;
          const dy = (Math.random() - 0.5) * 2 * (dodgeDist * 0.55);
          el.style.setProperty("--tx", `${dx.toFixed(0)}px`);
          el.style.setProperty("--ty", `${dy.toFixed(0)}px`);
          setTimeout(() => {
            el.style.setProperty("--tx", "0px");
            el.style.setProperty("--ty", "0px");
          }, 140);
        }

        function onMove(evt) {
          const x = evt.clientX;
          const y = evt.clientY;
          const yesRect = yesBtn.getBoundingClientRect();
          const noRect = noBtn.getBoundingClientRect();
          if (within(yesBtn, yesRect, x, y, radius)) dodge(yesBtn, "yes");
          if (within(noBtn, noRect, x, y, radius)) dodge(noBtn, "no");
        }

        if (enabled) {
          zone.addEventListener("pointermove", onMove);
          zone.addEventListener("pointerdown", onMove);
        } else {
          setTaunt("(Reduced motion is on — chase disabled.)");
          state.yes.givenUp = true;
          state.no.givenUp = true;
        }

        yesBtn.addEventListener("click", () => {
          if (!state.yes.givenUp && enabled) {
            setTaunt("Nice try 😌");
            return;
          }
          scrollToChapter("yes");
          if (scenesById.get("yes")?.confetti || chapters.find((c) => c.id === "yes")?.confetti) burstConfetti();
        });

        noBtn.addEventListener("click", () => {
          if (!cfg.allowNo) return;
          if (!state.no.givenUp && enabled) {
            setTaunt("If you really mean no, use the serious link 💛");
            return;
          }
          scrollToChapter("no");
        });
      } else {
        const key = ch.imageKey;
        const src = key ? cfg.images?.[key] : null;
        if (src) {
          const media = document.createElement("div");
          media.className = "chapterMedia";
          const img = document.createElement("img");
          img.src = src;
          img.alt = ch.imageAlt || "";
          media.appendChild(img);
          right.appendChild(media);
        }
      }

      grid.appendChild(left);
      grid.appendChild(right);
      chapter.appendChild(grid);

      sticky.appendChild(chapter);
      track.appendChild(sticky);
      scrollyRootEl.appendChild(track);

      chapterEls.push(track);
      chapterMeta.set(ch.id, { track, chapter });
    }

    // Floating items
    const floats = Array.isArray(cfg.floating) ? cfg.floating : [];
    const floatNodes = new Map();
    for (const f of floats) {
      const node = document.createElement("div");
      node.className = "floatItem";
      node.id = `float-${f.id}`;
      node.style.setProperty("--w", `${Math.max(60, f.widthPx ?? 160)}px`);
      node.style.setProperty("--op", "0");
      const img = document.createElement("img");
      img.src = f.src || cfg.images?.[f.imageKey] || "";
      img.alt = "";
      node.appendChild(img);
      floatLayerEl.appendChild(node);
      floatNodes.set(f.id, node);
    }

    function chapterProgress(chId) {
      const meta = chapterMeta.get(chId);
      if (!meta) return 0;
      const rect = meta.track.getBoundingClientRect();
      const viewH = window.innerHeight;
      const total = Math.max(1, rect.height - viewH);
      const progressed = clamp01((-rect.top) / total);
      return progressed;
    }

    function scrollToChapter(chId) {
      const meta = chapterMeta.get(chId);
      if (!meta) return;
      meta.track.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      history.replaceState({ sceneId: chId }, "", `#${encodeURIComponent(chId)}`);
    }

    function update() {
      // progress pill: show the most-visible chapter
      let best = { id: chapters[0].id, score: -Infinity };
      for (const ch of chapters) {
        const meta = chapterMeta.get(ch.id);
        if (!meta) continue;
        const r = meta.track.getBoundingClientRect();
        const score = -Math.abs(r.top) + Math.min(0, r.bottom - window.innerHeight);
        if (score > best.score) best = { id: ch.id, score };
      }

      const p = chapterProgress(best.id);
      pill.textContent = `${best.id.toUpperCase()} · ${Math.round(p * 100)}%`;

      // Floats: interpolate based on a chapter range
      for (const f of floats) {
        const node = floatNodes.get(f.id);
        if (!node) continue;
        const range = f.chapterRange || [];
        const fromId = range[0];
        const toId = range[1] || fromId;

        // map progress between chapters: use progress of from->to based on scroll position in the overall document
        // Simple version: blend using progress inside the "to" chapter when we are near it.
        let t = 0;
        if (fromId === toId) {
          t = chapterProgress(fromId);
        } else {
          // Use the average of the two progresses as a simple story blend
          t = clamp01((chapterProgress(fromId) * 0.5 + chapterProgress(toId) * 0.5));
        }

        const tr = lerpObj(f.from || {}, f.to || {}, t);
        node.style.setProperty("--op", `${clamp01(tr.opacity)}`);
        node.style.opacity = `${clamp01(tr.opacity)}`;
        node.style.transform = `translate(-50%, -50%) translate(${tr.x.toFixed(0)}px, ${tr.y.toFixed(0)}px) rotate(${tr.rot.toFixed(1)}deg) scale(${tr.scale.toFixed(3)})`;
      }

      if (!prefersReducedMotion()) requestAnimationFrame(update);
    }

    // Hash jump
    const initial = getInitialScene();
    setTimeout(() => scrollToChapter(initial), 0);

    if (prefersReducedMotion()) {
      pill.textContent = "Scroll";
    } else {
      requestAnimationFrame(update);
    }
  }

  // New: multi-page rendering
  function setDocTitle(t) {
    if (t) document.title = t;
  }

  function clearAllRoots() {
    // Clear scrolly area
    if (floatLayerEl) floatLayerEl.innerHTML = "";
    if (scrollyRootEl) scrollyRootEl.innerHTML = "";
  }

  function makeActionLinkButton({ label, href, variant }) {
    const btn = document.createElement("button");
    btn.type = "button";
    const v = variant === "secondary" ? "secondary" : "primary";
    btn.className = `btn ${v === "primary" ? "btnPrimary" : "btnSecondary"}`;
    btn.textContent = label || "Continue";
    btn.addEventListener("click", () => {
      if (href) window.location.href = href;
    });
    return btn;
  }

  function renderStoryPage() {
    const story = cfg.pages?.story;
    const chapters = Array.isArray(story?.chapters) ? story.chapters : [];
    if (!chapters.length) {
      // fallback
      renderScrolly();
      return;
    }

    setDocTitle(cfg.pageTitle || "Valentine?");
    singleCardEl.hidden = true;
    scrollRootEl.hidden = false;
    clearAllRoots();

    const pill = document.createElement("div");
    pill.className = "progressPill";
    pill.textContent = "Scroll";
    scrollyRootEl.appendChild(pill);

    const chapterMeta = new Map();

    for (const ch of chapters) {
      const track = document.createElement("div");
      track.className = "chapterTrack";
      track.id = `chapter-${ch.id}`;
      track.style.setProperty("--trackH", `${Math.max(120, ch.trackVh ?? 160)}vh`);

      const sticky = document.createElement("div");
      sticky.className = "chapterSticky";

      const chapter = document.createElement("section");
      chapter.className = "chapter";
      chapter.dataset.chapterId = ch.id;

      const header = document.createElement("header");
      header.className = "header";
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = cfg.badgeText || "";
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = ch.title || "";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = ch.subtitle || "";
      header.appendChild(badge);
      header.appendChild(h);
      header.appendChild(sub);
      chapter.appendChild(header);

      const grid = document.createElement("div");
      grid.className = "chapterGrid";

      const left = document.createElement("div");
      left.className = "body";
      for (const line of ch.body || []) {
        const p = document.createElement("p");
        p.textContent = line;
        left.appendChild(p);
      }

      const right = document.createElement("div");
      const key = ch.imageKey;
      const src = key ? cfg.images?.[key] : null;
      if (src) {
        const media = document.createElement("div");
        media.className = "chapterMedia";
        const img = document.createElement("img");
        img.src = src;
        img.alt = ch.imageAlt || "";
        media.appendChild(img);
        right.appendChild(media);
      }

      grid.appendChild(left);
      grid.appendChild(right);
      chapter.appendChild(grid);

      sticky.appendChild(chapter);
      track.appendChild(sticky);
      scrollyRootEl.appendChild(track);
      chapterMeta.set(ch.id, { track });
    }

    // CTA card (non-sticky)
    if (story?.cta?.href) {
      const ctaTrack = document.createElement("div");
      ctaTrack.className = "chapterTrack";
      ctaTrack.style.setProperty("--trackH", `120vh`);
      const sticky = document.createElement("div");
      sticky.className = "chapterSticky";
      const chapter = document.createElement("section");
      chapter.className = "chapter";
      const header = document.createElement("header");
      header.className = "header";
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = cfg.badgeText || "";
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = story.cta.title || "One more thing…";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = story.cta.subtitle || "";
      header.appendChild(badge);
      header.appendChild(h);
      header.appendChild(sub);
      chapter.appendChild(header);

      const body = document.createElement("div");
      body.className = "body";
      const p = document.createElement("p");
      p.textContent = "When you’re ready, click below.";
      body.appendChild(p);
      chapter.appendChild(body);

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(
        makeActionLinkButton({ label: story.cta.label || "Next →", href: story.cta.href, variant: "primary" })
      );
      chapter.appendChild(actions);

      sticky.appendChild(chapter);
      ctaTrack.appendChild(sticky);
      scrollyRootEl.appendChild(ctaTrack);
    }

    // Floating items (optional)
    const floats = Array.isArray(cfg.floating) ? cfg.floating : [];
    const floatNodes = new Map();
    for (const f of floats) {
      const node = document.createElement("div");
      node.className = "floatItem";
      node.id = `float-${f.id}`;
      node.style.setProperty("--w", `${Math.max(60, f.widthPx ?? 160)}px`);
      node.style.opacity = "0";
      const img = document.createElement("img");
      img.src = f.src || cfg.images?.[f.imageKey] || "";
      img.alt = "";
      node.appendChild(img);
      floatLayerEl.appendChild(node);
      floatNodes.set(f.id, node);
    }

    function clamp01(x) {
      return Math.max(0, Math.min(1, x));
    }
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }
    function lerpObj(from, to, t) {
      return {
        x: lerp(from.x ?? 0, to.x ?? 0, t),
        y: lerp(from.y ?? 0, to.y ?? 0, t),
        rot: lerp(from.rot ?? 0, to.rot ?? 0, t),
        scale: lerp(from.scale ?? 1, to.scale ?? 1, t),
        opacity: lerp(from.opacity ?? 1, to.opacity ?? 1, t),
      };
    }

    function chapterProgress(chId) {
      const meta = chapterMeta.get(chId);
      if (!meta) return 0;
      const rect = meta.track.getBoundingClientRect();
      const viewH = window.innerHeight;
      const total = Math.max(1, rect.height - viewH);
      return clamp01((-rect.top) / total);
    }

    function update() {
      // pill: show first chapter progress for simplicity
      const active = chapters[0]?.id;
      if (active) pill.textContent = `SCROLL · ${Math.round(chapterProgress(active) * 100)}%`;

      for (const f of floats) {
        const node = floatNodes.get(f.id);
        if (!node) continue;
        const range = f.chapterRange || [];
        const fromId = range[0] || chapters[0]?.id;
        const toId = range[1] || fromId;
        const t = clamp01((chapterProgress(fromId) + chapterProgress(toId)) / 2);
        const tr = lerpObj(f.from || {}, f.to || {}, t);
        node.style.opacity = `${clamp01(tr.opacity)}`;
        node.style.transform = `translate(-50%, -50%) translate(${tr.x.toFixed(0)}px, ${tr.y.toFixed(0)}px) rotate(${tr.rot.toFixed(1)}deg) scale(${tr.scale.toFixed(3)})`;
      }

      if (!prefersReducedMotion()) requestAnimationFrame(update);
    }

    if (!prefersReducedMotion()) requestAnimationFrame(update);
  }

  function renderQuestionPage() {
    const q = cfg.pages?.question;
    setDocTitle(q?.title || "Question");

    singleCardEl.hidden = true;
    scrollRootEl.hidden = false;
    clearAllRoots();

    const chapter = document.createElement("section");
    chapter.className = "chapter chapterFull";

    const header = document.createElement("header");
    header.className = "header";
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = cfg.badgeText || "";
    const h = document.createElement("h1");
    h.className = "title";
    h.textContent = q?.title || "Will you be my Valentine?";
    const sub = document.createElement("p");
    sub.className = "subtitle";
    sub.textContent = q?.subtitle || "";
    header.appendChild(badge);
    header.appendChild(h);
    header.appendChild(sub);
    chapter.appendChild(header);

    const body = document.createElement("div");
    body.className = "body";
    for (const line of q?.body || []) {
      const p = document.createElement("p");
      p.textContent = line;
      body.appendChild(p);
    }
    chapter.appendChild(body);

    const zone = document.createElement("div");
    zone.className = "chaseZone chaseFull";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "btn btnPrimary";
    yesBtn.textContent = q?.yesLabel || "Yes 💖";

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "btn btnSecondary";
    noBtn.textContent = q?.noLabel || "Not this time";

    yesBtn.style.position = "absolute";
    noBtn.style.position = "absolute";
    yesBtn.style.left = "18%";
    yesBtn.style.top = "42%";
    noBtn.style.left = "62%";
    noBtn.style.top = "58%";

    zone.appendChild(yesBtn);
    zone.appendChild(noBtn);
    chapter.appendChild(zone);

    const hud = document.createElement("div");
    hud.className = "chaseHud";
    const taunt = document.createElement("div");
    taunt.className = "taunt";
    taunt.textContent = "(Move near the buttons…)";
    hud.appendChild(taunt);
    chapter.appendChild(hud);

    const hint = document.createElement("div");
    hint.className = "microNote";
    hint.textContent = cfg.hintText || "";
    chapter.appendChild(hint);

    scrollyRootEl.appendChild(chapter);

    // Chase behavior (both buttons)
    const chaseCfg = cfg.chase || {};
    const reduced = prefersReducedMotion();
    const enabled = chaseCfg.enabled !== false && !reduced;
    const yesDodges = Math.max(0, chaseCfg.yesDodges ?? 0);
    const noDodges = Math.max(0, chaseCfg.noDodges ?? 0);
    const radius = Math.max(50, chaseCfg.triggerRadiusPx ?? 110);
    const dodgeDist = Math.max(60, chaseCfg.dodgeDistancePx ?? 170);
    let taunts = Array.isArray(chaseCfg.taunts) && chaseCfg.taunts.length ? chaseCfg.taunts : ["Hehe."];
    let tauntIndex = 0;
    let tauntsUsed = false;

    const state = {
      yes: { dodges: 0, max: yesDodges, ready: yesDodges === 0 },
      no: { dodges: 0, max: noDodges, ready: noDodges === 0 },
    };

    // No-confirmation loop
    const noConfirm = q?.noConfirm || {};
    let confirmPrompts = Array.isArray(noConfirm.prompts) ? noConfirm.prompts : [];
    const yesScaleStart = typeof noConfirm.yesScaleStart === "number" ? noConfirm.yesScaleStart : 1.0;
    const yesScaleStep = typeof noConfirm.yesScaleStep === "number" ? noConfirm.yesScaleStep : 0.18;
    let confirmIndex = 0;
    let confirmUsed = false;

    let yesBaseScale = yesScaleStart;

    function setYesBaseScale(scale) {
      yesBaseScale = scale;
      yesBtn.style.setProperty("--scale", String(yesBaseScale));
    }

    function popYes() {
      // Uses the existing transform transition (120ms) for a bounce.
      const up = yesBaseScale + 0.12;
      const down = Math.max(0.6, yesBaseScale - 0.04);
      yesBtn.style.setProperty("--scale", String(up));
      setTimeout(() => {
        yesBtn.style.setProperty("--scale", String(down));
      }, 140);
      setTimeout(() => {
        yesBtn.style.setProperty("--scale", String(yesBaseScale));
      }, 280);
    }

    function showConfirmPrompt(stepIndex) {
      if (!confirmPrompts.length) return;
      confirmUsed = true;
      const idx = Math.min(stepIndex, confirmPrompts.length - 1);
      setTaunt(confirmPrompts[idx]);
      const scale = Math.min(3.0, yesScaleStart + (idx + 1) * yesScaleStep);
      setYesBaseScale(scale);
      popYes();

      if (noConfirm.noLabelDuring) noBtn.textContent = noConfirm.noLabelDuring;
      if (noConfirm.yesLabelDuring) yesBtn.textContent = noConfirm.yesLabelDuring;
      yesBtn.classList.add("isReady");
    }

    function setTaunt(text) {
      taunt.textContent = text;
    }
    function nextTaunt() {
      tauntsUsed = true;
      tauntIndex = (tauntIndex + 1) % taunts.length;
      setTaunt(taunts[tauntIndex]);
    }

    function distanceToCenter(el, x, y) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return Math.hypot(x - cx, y - cy);
    }

    function dodge(el, which) {
      const s = state[which];
      if (!enabled || s.ready) return;
      if (s.dodges >= s.max) {
        s.ready = true;
        el.classList.add("isReady");
        setTaunt(which === "yes" ? "Okay okay — click me 😌" : "Alright, you can click me now." );
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
        return;
      }

      s.dodges += 1;
      nextTaunt();

      const zoneRect = zone.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const margin = 18;
      const maxLeft = Math.max(margin, zoneRect.width - elRect.width - margin);
      const maxTop = Math.max(margin, zoneRect.height - elRect.height - margin);

      const newLeft = margin + Math.random() * Math.max(1, maxLeft - margin);
      const newTop = margin + Math.random() * Math.max(1, maxTop - margin);
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;

      const dx = (Math.random() - 0.5) * 2 * dodgeDist;
      const dy = (Math.random() - 0.5) * 2 * (dodgeDist * 0.55);
      el.style.setProperty("--tx", `${dx.toFixed(0)}px`);
      el.style.setProperty("--ty", `${dy.toFixed(0)}px`);
      setTimeout(() => {
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      }, 140);
    }

    function onMove(evt) {
      const x = evt.clientX;
      const y = evt.clientY;
      if (distanceToCenter(yesBtn, x, y) <= radius) dodge(yesBtn, "yes");
      if (distanceToCenter(noBtn, x, y) <= radius) dodge(noBtn, "no");
    }

    if (enabled) {
      zone.addEventListener("pointermove", onMove);
      zone.addEventListener("pointerdown", onMove);
    } else {
      setTaunt("(Reduced motion is on — chase disabled.)");
      state.yes.ready = true;
      state.no.ready = true;
    }

    yesBtn.addEventListener("click", () => {
      if (!state.yes.ready && enabled) {
        setTaunt("Nice try 😌");
        return;
      }
      window.location.href = q?.yesHref || "yes.html";
    });

    noBtn.addEventListener("click", () => {
      if (!cfg.allowNo) return;
      if (!state.no.ready && enabled) {
        setTaunt("Not yet 😅");
        return;
      }

      // Confirm loop
      if (confirmPrompts.length && confirmIndex < confirmPrompts.length) {
        showConfirmPrompt(confirmIndex);
        confirmIndex += 1;
        return;
      }

      if (confirmPrompts.length) {
        setTaunt(noConfirm.finalNoTaunt || "Okay 💛");
        // small delay feels nicer
        setTimeout(() => {
          window.location.href = q?.noHref || "no.html";
        }, 450);
        return;
      }

      window.location.href = q?.noHref || "no.html";
    });

    // Start scales clean
    setYesBaseScale(yesScaleStart);

    // Load taunts/prompts from text files (if provided)
    // Only override before the user starts interacting, to avoid mid-run changes.
    const tauntsFile = chaseCfg.tauntsFile;
    if (typeof tauntsFile === "string" && tauntsFile.length) {
      loadLinesFile(tauntsFile)
        .then((lines) => {
          if (!tauntsUsed && Array.isArray(lines) && lines.length) {
            taunts = lines;
            tauntIndex = 0;
          }
        })
        .catch(() => {});
    }

    const promptsFile = noConfirm.promptsFile;
    if (typeof promptsFile === "string" && promptsFile.length) {
      loadLinesFile(promptsFile)
        .then((lines) => {
          if (!confirmUsed && Array.isArray(lines) && lines.length) {
            confirmPrompts = lines;
            confirmIndex = 0;
          }
        })
        .catch(() => {});
    }
  }

  function renderResponsePage(kind) {
    const page = cfg.pages?.[kind];
    if (!page) {
      // fallback to original scenes
      scrollRootEl.hidden = true;
      singleCardEl.hidden = false;
      goTo(kind);
      return;
    }

    setDocTitle(page.title || kind);
    scrollRootEl.hidden = true;
    singleCardEl.hidden = false;

    titleEl.textContent = page.title || "";
    subtitleEl.textContent = page.subtitle || "";
    setBodyParagraphs(page.body);

    // image
    const key = page.imageKey;
    const src = key ? cfg.images?.[key] : null;
    if (src) {
      mediaWrapEl.hidden = false;
      imageEl.src = src;
      imageEl.alt = page.imageAlt || "";
    } else {
      mediaWrapEl.hidden = true;
      imageEl.removeAttribute("src");
      imageEl.alt = "";
    }

    clearActions();
    for (const a of page.actions || []) {
      const btn = makeActionLinkButton({ label: a.label, href: a.href, variant: a.variant });
      actionsEl.appendChild(btn);
    }

    restartEl.hidden = true;
    if (page.confetti) burstConfetti();
  }

  // Render
  // Decide renderer
  if (pageId === "story") {
    renderStoryPage();
  } else if (pageId === "question") {
    renderQuestionPage();
  } else if (pageId === "yes") {
    renderResponsePage("yes");
  } else if (pageId === "no") {
    renderResponsePage("no");
  } else {
    // Fallback to mode-based behavior
    const mode = (cfg.mode || "single").toLowerCase();
    if (mode === "scrolly") {
      renderScrolly();
    } else if (mode === "scroll") {
      renderScroll();
    } else {
      scrollRootEl.hidden = true;
      singleCardEl.hidden = false;
      goTo(getInitialScene());
    }
  }
})();
