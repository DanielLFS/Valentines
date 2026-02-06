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

  function applyBackgroundFromConfig() {
    const bgCfg = cfg.background;
    if (!bgCfg) return;

    const root = document.documentElement;
    const style = (bgCfg.style || "paper").toLowerCase();

    let photoUrl = "";
    const images = Array.isArray(bgCfg.stockImages) ? bgCfg.stockImages.filter(Boolean) : [];
    if (style === "stock" && images.length) {
      photoUrl = images[Math.floor(Math.random() * images.length)];
    }

    const photoOpacity = typeof bgCfg.photoOpacity === "number" ? bgCfg.photoOpacity : 0;
    const photoBlurPx = typeof bgCfg.photoBlurPx === "number" ? bgCfg.photoBlurPx : 0;
    const photoSaturate = typeof bgCfg.photoSaturate === "number" ? bgCfg.photoSaturate : 1;

    const showLines = bgCfg.showLines === true;
    const showDoodles = bgCfg.showDoodles !== false;
    const doodlesOpacity = typeof bgCfg.doodlesOpacity === "number" ? bgCfg.doodlesOpacity : 0.1;
    const doodlesSize = bgCfg.doodlesSize;

    root.style.setProperty("--bg-photo-url", photoUrl ? `url(${JSON.stringify(photoUrl)})` : "none");
    root.style.setProperty("--bg-photo-opacity", photoUrl ? String(photoOpacity) : "0");
    root.style.setProperty("--bg-photo-blur", `${Math.max(0, photoBlurPx)}px`);
    root.style.setProperty("--bg-photo-saturate", String(Math.max(0, photoSaturate)));

    // If we have a real photo, default to minimal paper effects unless explicitly enabled.
    const linesOpacity = showLines ? "0.9" : photoUrl ? "0" : "0.9";
    root.style.setProperty("--bg-lines-opacity", linesOpacity);

    const finalDoodlesOpacity = showDoodles ? (photoUrl ? String(doodlesOpacity) : String(doodlesOpacity)) : "0";
    root.style.setProperty("--bg-doodles-opacity", finalDoodlesOpacity);

    if (typeof doodlesSize === "number" && Number.isFinite(doodlesSize)) {
      root.style.setProperty("--bg-doodles-size", `${Math.max(40, doodlesSize)}px`);
    } else if (typeof doodlesSize === "string" && doodlesSize.trim().length) {
      root.style.setProperty("--bg-doodles-size", doodlesSize.trim());
    }
  }

  function ensureLetterHud() {
    const existing = document.querySelector(".letterHud");
    if (existing) return existing;

    const hud = document.createElement("div");
    hud.className = "letterHud";
    hud.setAttribute("aria-label", "Letter details");

    const left = document.createElement("div");
    left.className = "letterCorner letterTo";
    const leftIcon = document.createElement("span");
    leftIcon.className = "letterIcon";
    leftIcon.textContent = "💌";
    leftIcon.setAttribute("aria-hidden", "true");
    const leftText = document.createElement("span");
    leftText.className = "letterText";
    left.appendChild(leftIcon);
    left.appendChild(leftText);

    const right = document.createElement("div");
    right.className = "letterCorner letterFrom";
    const rightText = document.createElement("span");
    rightText.className = "letterText";
    const rightIcon = document.createElement("span");
    rightIcon.className = "letterIcon";
    rightIcon.textContent = "💋";
    rightIcon.setAttribute("aria-hidden", "true");
    right.appendChild(rightText);
    right.appendChild(rightIcon);

    hud.appendChild(left);
    hud.appendChild(right);
    document.body.appendChild(hud);
    return hud;
  }

  applyBackgroundFromConfig();

  const letterCfg = cfg.letter;
  if (letterCfg?.enabled !== false) {
    const hud = ensureLetterHud();
    const toEl = hud.querySelector(".letterTo .letterText");
    const fromEl = hud.querySelector(".letterFrom .letterText");
    if (toEl) toEl.textContent = letterCfg?.to || "";
    if (fromEl) fromEl.textContent = letterCfg?.from || "";
  }

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
    const pillLabel = document.createElement("span");
    pillLabel.className = "pillLabel";
    pillLabel.textContent = "Scroll";
    const pillBar = document.createElement("div");
    pillBar.className = "pillBar";
    pill.appendChild(pillBar);
    pill.appendChild(pillLabel);
    scrollyRootEl.appendChild(pill);

    const chapterEls = [];
    const chapterMeta = new Map();

    // Build DOM
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const ch = chapters[chapterIndex];
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
      const shouldShowBadge = typeof ch.showBadge === "boolean" ? ch.showBadge : chapterIndex === 0;
      if (shouldShowBadge && cfg.badgeText) {
        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = cfg.badgeText;
        header.appendChild(badge);
      }
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = ch.title || "";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = ch.subtitle || "";
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
    const pillLabel = document.createElement("span");
    pillLabel.className = "pillLabel";
    pillLabel.textContent = "Scroll";
    const pillBar = document.createElement("div");
    pillBar.className = "pillBar";
    pill.appendChild(pillBar);
    pill.appendChild(pillLabel);
    scrollyRootEl.appendChild(pill);

    const chapterMeta = new Map();
    const trackEls = [];
    const galleries = [];

    const GALLERY_MODES = new Set([
      "final",
      "grid",
      "grid-shuffle",
      "orbit",
      "stack",
      "polaroid",
      "conveyor",
      "spotlight",
      "timeline",
    ]);

    function getGalleryModeOverride() {
      const sp = new URLSearchParams(window.location.search || "");
      const urlMode = (sp.get("gallery") || "").trim().toLowerCase();
      const cfgMode = (cfg.debug?.galleryModeOverride || "").trim().toLowerCase();
      const mode = urlMode || cfgMode;
      return GALLERY_MODES.has(mode) ? mode : "";
    }

    function hashString(str) {
      let h = 2166136261;
      const s = String(str || "");
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function mulberry32(seed) {
      let t = seed >>> 0;
      return () => {
        t += 0x6d2b79f5;
        let x = t;
        x = Math.imul(x ^ (x >>> 15), x | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }

    function clamp01(x) {
      return Math.max(0, Math.min(1, x));
    }

    function stableShuffle(list, seed) {
      const arr = Array.isArray(list) ? [...list] : [];
      let s = 0;
      const str = String(seed || "seed");
      for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
      // Fisher-Yates with LCG
      for (let i = arr.length - 1; i > 0; i--) {
        s = (1664525 * s + 1013904223) >>> 0;
        const j = s % (i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    const galleryModeOverride = getGalleryModeOverride();

    function buildGalleryModePicker() {
      const picker = document.createElement("div");
      picker.className = "galleryModePicker";

      const label = document.createElement("div");
      label.className = "galleryModePickerLabel";
      label.textContent = "Gallery mode";

      const select = document.createElement("select");
      select.className = "galleryModePickerSelect";

      const sp = new URLSearchParams(window.location.search || "");
      const currentUrlMode = (sp.get("gallery") || "").trim().toLowerCase();
      const currentCfgMode = (cfg.debug?.galleryModeOverride || "").trim().toLowerCase();

      const optDefault = document.createElement("option");
      optDefault.value = "";
      optDefault.textContent = "(chapter setting)";
      select.appendChild(optDefault);

      const orderedModes = [
        "final",
        "conveyor",
        "polaroid",
        "grid",
        "grid-shuffle",
        "stack",
        "orbit",
        "spotlight",
        "timeline",
      ].filter((m) => GALLERY_MODES.has(m));

      for (const mode of orderedModes) {
        const opt = document.createElement("option");
        opt.value = mode;
        opt.textContent = (mode === "conveyor" || mode === "polaroid") ? `${mode} ♥` : mode;
        select.appendChild(opt);
      }

      select.value = GALLERY_MODES.has(currentUrlMode)
        ? currentUrlMode
        : (GALLERY_MODES.has(currentCfgMode) ? currentCfgMode : "");

      select.addEventListener("change", () => {
        const v = (select.value || "").trim().toLowerCase();
        const url = new URL(window.location.href);
        if (!v) url.searchParams.delete("gallery");
        else url.searchParams.set("gallery", v);
        history.replaceState(null, "", url.toString());
        window.location.reload();
      });

      picker.appendChild(label);
      picker.appendChild(select);
      return picker;
    }

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const ch = chapters[chapterIndex];
      const layout = (ch.layout || "split").toLowerCase();
      const gcfgEarly = layout === "gallery" ? (ch.gallery || {}) : null;
      const galleryBare = layout === "gallery" && gcfgEarly?.bare === true;

      const track = document.createElement("div");
      track.className = "chapterTrack";
      track.id = `chapter-${ch.id}`;
      track.style.setProperty("--trackH", `${Math.max(120, ch.trackVh ?? 160)}vh`);

      const sticky = document.createElement("div");
      sticky.className = "chapterSticky";

      const chapter = document.createElement("section");
      chapter.className = "chapter";
      chapter.dataset.chapterId = ch.id;
      if (layout === "gallery") chapter.classList.add("chapterGallery");
      if (galleryBare) chapter.classList.add("chapterGalleryBare");

      const header = document.createElement("header");
      header.className = "header";
      const shouldShowBadge = typeof ch.showBadge === "boolean" ? ch.showBadge : chapterIndex === 0;
      if (shouldShowBadge && cfg.badgeText) {
        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = cfg.badgeText;
        header.appendChild(badge);
      }
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = ch.title || "";

      const shouldShowInlinePicker = layout === "gallery" && !galleryBare && Boolean(cfg.debug?.showGalleryModePicker);
      if (shouldShowInlinePicker) {
        const row = document.createElement("div");
        row.className = "headerRow";
        row.appendChild(h);
        row.appendChild(buildGalleryModePicker());
        header.appendChild(row);
      } else {
        header.appendChild(h);
      }

      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = ch.subtitle || "";
      header.appendChild(sub);

      const grid = document.createElement("div");
      grid.className = "chapterGrid";

      const bodyBox = document.createElement("div");
      bodyBox.className = "body";
      for (const line of ch.body || []) {
        const p = document.createElement("p");
        p.textContent = line;
        bodyBox.appendChild(p);
      }

      // Default split layout columns
      let left = bodyBox;
      let right = document.createElement("div");

      // Gallery layout becomes: [gallery on background] [paper letter panel]
      let galleryHost = null;
      if (layout === "gallery") {
        galleryHost = document.createElement("div");
        galleryHost.className = "galleryHost";

        if (galleryBare) {
          grid.style.gridTemplateColumns = "1fr";
          galleryHost.classList.add("galleryHostBare");
          left = galleryHost;
          right = document.createElement("div");
          right.hidden = true;
        } else {
          grid.style.gridTemplateColumns = "1.2fr 0.8fr";
          const paper = document.createElement("div");
          paper.className = "paperLetter";
          paper.appendChild(header);
          paper.appendChild(bodyBox);

          left = galleryHost;
          right = paper;
        }
      } else {
        chapter.appendChild(header);
      }

      if (layout === "gallery") {
        // galleryHost is created above for gallery chapters
        const gcfg = ch.gallery || {};
        const cols = Number.isFinite(gcfg.columns) ? Math.max(2, Math.min(6, gcfg.columns)) : 3;
        const rawImages = Array.isArray(gcfg.images) ? gcfg.images.filter(Boolean) : [];
        const requestedMode = String(gcfg.mode || "").trim().toLowerCase();

        // Order options:
        // - `shuffle` (legacy): stable shuffle (deterministic) when true
        // - `randomize` (new): randomize order; default is true
        //   - randomizeMode: "random" (changes each load) | "stable" (deterministic)
        //   - randomizeSeed: custom seed for deterministic ordering
        const randomizeEnabled = typeof gcfg.randomize === "boolean" ? gcfg.randomize : true;
        const randomizeMode = String(gcfg.randomizeMode || "random").trim().toLowerCase();
        const randomizeSeed = typeof gcfg.randomizeSeed === "string" && gcfg.randomizeSeed.trim().length
          ? gcfg.randomizeSeed.trim()
          : null;
        const legacyShuffle = gcfg.shuffle === true;
        const baseMode = requestedMode && GALLERY_MODES.has(requestedMode)
          ? requestedMode
          : "grid";
        const mode = galleryModeOverride || baseMode;

        // Decide image order
        let images = rawImages;
        if (mode === "grid-shuffle") {
          images = stableShuffle(rawImages, ch.id);
        } else if (legacyShuffle) {
          images = stableShuffle(rawImages, ch.id);
        } else if (randomizeEnabled && rawImages.length > 1) {
          const seed = randomizeSeed
            ? `${ch.id}:${randomizeSeed}`
            : (randomizeMode === "stable" ? ch.id : `${ch.id}:${Date.now()}`);
          images = stableShuffle(rawImages, seed);
        }

        const wrap = document.createElement("div");
        wrap.className = `galleryWrap galleryMode-${mode}`;

        // Mode builders register an update(progress01) handler.
        const rng = mulberry32(hashString(ch.id));

        const makeImg = (src) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          return img;
        };

        if (mode === "final") {
          const stage = document.createElement("div");
          stage.className = "galleryStage finalStage";
          if (galleryBare) stage.classList.add("finalStageBare");

          const metas = [];

          // Layout is computed on first update once stage has real size.
          let laidOut = false;
          const placed = [];

          const spread = typeof gcfg.spread === "number" ? Math.max(0.75, Math.min(0.98, gcfg.spread)) : 0.95;
          const targetCount = typeof gcfg.targetCount === "number" ? Math.max(8, Math.min(60, gcfg.targetCount)) : 25;

          const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

          const bestCandidatePointPx = (w, h, extentX, extentY, radius) => {
            const edgePad = 12;
            const halfW = (w * spread) / 2;
            const halfH = (h * spread) / 2;
            const maxX = Math.max(0, halfW - extentX - edgePad);
            const maxY = Math.max(0, halfH - extentY - edgePad);
            if (maxX === 0 && maxY === 0) return { x: 0, y: 0 };

            const evaluate = (x, y) => {
              // Minimize overlap area with already-placed rectangles.
              let overlapArea = 0;
              let minGap = Infinity;

              for (const p of placed) {
                const dx = Math.abs(x - p.x);
                const dy = Math.abs(y - p.y);
                const ox = (extentX + p.extentX) - dx;
                const oy = (extentY + p.extentY) - dy;
                if (ox > 0 && oy > 0) overlapArea += ox * oy;

                const d = Math.hypot(x - p.x, y - p.y);
                const allowed = (radius + p.radius) * 0.82;
                const gap = d - allowed;
                if (gap < minGap) minGap = gap;
              }

              if (!placed.length) minGap = 999;
              const spreadiness = ((Math.abs(x) / (maxX || 1)) + (Math.abs(y) / (maxY || 1))) / 2;
              return { overlapArea, minGap, spreadiness };
            };

            let best = { x: 0, y: 0, overlapArea: Infinity, minGap: -Infinity, spreadiness: -Infinity };

            const tryCandidate = (x, y) => {
              const e = evaluate(x, y);
              const betterOverlap = e.overlapArea < best.overlapArea - 1;
              const sameOverlap = Math.abs(e.overlapArea - best.overlapArea) <= 1;
              const betterGap = e.minGap > best.minGap + 0.5;
              const sameGap = Math.abs(e.minGap - best.minGap) <= 0.5;
              const betterSpread = e.spreadiness > best.spreadiness + 0.02;
              if (betterOverlap || (sameOverlap && (betterGap || (sameGap && betterSpread)))) {
                best = { x, y, ...e };
              }
            };

            // Mix of grid-ish and random candidates to fill whitespace.
            const grid = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1];
            for (const gx of grid) {
              for (const gy of grid) {
                tryCandidate(gx * maxX, gy * maxY);
              }
            }

            const tries = 140;
            for (let k = 0; k < tries; k++) {
              const x = (rng() * 2 - 1) * maxX;
              const y = (rng() * 2 - 1) * maxY;
              tryCandidate(x, y);
            }

            placed.push({ x: best.x, y: best.y, extentX, extentY, radius });
            return { x: best.x, y: best.y };
          };

          for (let i = 0; i < images.length; i++) {
            const fig = document.createElement("figure");
            fig.className = "finalItem";

            const media = document.createElement("div");
            media.className = "finalMedia";
            const img = makeImg(images[i]);
            media.appendChild(img);
            fig.appendChild(media);

            const applyAspect = () => {
              const w = img.naturalWidth;
              const h = img.naturalHeight;
              if (w > 0 && h > 0) {
                // Makes the polaroid “window” match the photo.
                media.style.aspectRatio = `${w} / ${h}`;
              }
            };
            if (img.complete) applyAspect();
            else img.addEventListener("load", applyAspect, { once: true });

            stage.appendChild(fig);
            const meta = { el: fig, media, img, x: 0, y: 0, r: (rng() * 2 - 1) * 16, width: 0, height: 0, index: i };
            metas.push(meta);

            img.addEventListener(
              "load",
              () => {
                if (!laidOut) return;
                // After real dimensions arrive, clamp position to stay inside bounds.
                const stageW = stage.clientWidth || 1;
                const stageH = stage.clientHeight || 1;
                const edgePad = 12;
                const halfW = (stageW * spread) / 2;
                const halfH = (stageH * spread) / 2;
                const extentX = meta.width ? meta.width / 2 : 120;
                const extentY = meta.height ? meta.height / 2 : 120;
                const maxX = Math.max(0, halfW - extentX - edgePad);
                const maxY = Math.max(0, halfH - extentY - edgePad);
                meta.x = clamp(meta.x, -maxX, maxX);
                meta.y = clamp(meta.y, -maxY, maxY);
              },
              { once: true }
            );
          }

          wrap.appendChild(stage);
          galleryHost.appendChild(wrap);

          const depositDurRaw = typeof gcfg.depositDur === "number" ? gcfg.depositDur : 0.15;
          const depositDur = Math.max(0.08, Math.min(0.32, depositDurRaw));

          const appearScaleRaw = typeof gcfg.appearScale === "number" ? gcfg.appearScale : 1.65;
          const appearScale = clamp(appearScaleRaw, 1.0, 6.0);

          const targetHeightFracRaw =
            typeof gcfg.targetHeightFrac === "number"
              ? gcfg.targetHeightFrac
              : typeof gcfg.targetHeightPercent === "number"
                ? gcfg.targetHeightPercent / 100
                : null;
          const targetHeightFrac = typeof targetHeightFracRaw === "number" ? clamp(targetHeightFracRaw, 0.12, 0.9) : null;

          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = metas.length;
              if (!n) return;

              // Measure stage each frame (cheap) so the scatter fills the stage.
              const w = stage.clientWidth || 1;
              const h = stage.clientHeight || 1;

               if (!laidOut && w > 20 && h > 20) {
                 const framePadX = 24; // matches .finalItem left+right padding
                 const framePadY = 34; // top padding + thicker bottom polaroid strip

                 if (targetHeightFrac != null) {
                   // Size each frame so its total height is ~ (targetHeightFrac * stageHeight),
                   // then derive width from the image ratio.
                   const targetFigH = h * targetHeightFrac;
                   for (const m of metas) {
                     const iw = m.img.naturalWidth || 4;
                     const ih = m.img.naturalHeight || 3;
                     const ratio = Math.max(0.2, Math.min(5, iw / ih));

                     // Want: (figW - padX) / ratio + padY ~= targetFigH
                     // Solve: figW ~= (targetFigH - padY) * ratio + padX
                     const figWFromH = (targetFigH - framePadY) * ratio + framePadX;
                     const figW = Math.max(120, Math.min(figWFromH, w * 0.72));
                     const figH = Math.max(120, Math.min(((figW - framePadX) / ratio) + framePadY, h * 0.88));

                     m.width = figW;
                     m.height = figH;
                     m.el.style.width = `${figW.toFixed(1)}px`;
                   }
                 } else {
                   // Target: each photo roughly covers stageArea/targetCount.
                   const stageArea = w * h;
                   const targetFrameArea = stageArea / targetCount;

                   for (const m of metas) {
                     const iw = m.img.naturalWidth || 4;
                     const ih = m.img.naturalHeight || 3;
                     const ratio = iw / ih;

                     // Solve for k such that (mediaW+padX)*(mediaH+padY) ~= targetFrameArea,
                     // with mediaW = k*sqrt(ratio), mediaH = k/sqrt(ratio).
                     const a = Math.sqrt(Math.max(0.05, ratio));
                     const b = 1 / a;
                     const B = a * framePadY + framePadX * b;
                     const C = framePadX * framePadY - targetFrameArea;
                     const disc = Math.max(0, B * B - 4 * C);
                     const k = Math.max(0, (-B + Math.sqrt(disc)) / 2);

                     const mediaW = k * a;
                     const mediaH = k * b;
                     const figWRaw = mediaW + framePadX;
                     const figHRaw = mediaH + framePadY;

                     const figW = Math.max(120, Math.min(figWRaw, w * 0.46));
                     const figH = Math.max(120, Math.min(figHRaw, h * 0.58));

                     m.width = figW;
                     m.height = figH;
                     m.el.style.width = `${figW.toFixed(1)}px`;
                   }
                 }

                 // Place largest first to reduce center clumping.
                 const metasBySize = [...metas].sort((a, b) => (b.width * b.height) - (a.width * a.height));
                 for (const m of metasBySize) {
                   const extentX = Math.max(70, m.width / 2);
                   const extentY = Math.max(70, m.height / 2);
                   const radius = Math.max(extentX, extentY);
                   const pt = bestCandidatePointPx(w, h, extentX, extentY, radius);
                   m.x = pt.x;
                   m.y = pt.y;
                 }

                 laidOut = true;
               }

              const span = Math.max(0.0001, 1 - depositDur);

              for (let i = 0; i < n; i++) {
                const m = metas[i];

                const start = n === 1 ? 0 : (i / (n - 1)) * span;
                const end = start + depositDur;

                const preFade = 0.04;
                const appearT = clamp01((p01 - (start - preFade)) / preFade);
                const t = clamp01((p01 - start) / depositDur);
                const eased = 1 - Math.pow(1 - t, 3);

                const landed = p01 >= end;
                const active = p01 >= start && p01 < end;

                const x = lerp(0, m.x, eased);
                const y = lerp(28, m.y, eased);
                const rot = lerp(0, m.r, eased);
                const scale = lerp(appearScale, 1.0, eased);

                const opacity = landed ? 1 : active ? 1 : appearT;
                m.el.style.opacity = `${opacity.toFixed(3)}`;
                m.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(
                  1
                )}px) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
                m.el.style.zIndex = active ? "999" : String(10 + i);
              }
            },
          });
        } else if (mode === "spotlight") {
          const stage = document.createElement("div");
          stage.className = "galleryStage spotlightStage";
          const img = makeImg(images[0] || "");
          img.className = "spotlightImg";
          stage.appendChild(img);

          const counter = document.createElement("div");
          counter.className = "galleryCounter";
          stage.appendChild(counter);

          wrap.appendChild(stage);
          galleryHost.appendChild(wrap);

          let current = -1;
          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = images.length;
              if (!n) return;
              const idx = Math.max(0, Math.min(n - 1, Math.floor(p01 * n)));
              if (idx !== current) {
                current = idx;
                img.classList.remove("isShown");
                // force reflow for transition
                void img.offsetHeight;
                img.src = images[idx];
                img.classList.add("isShown");
              }
              counter.textContent = `${idx + 1} / ${n}`;
            },
          });
        } else if (mode === "orbit") {
          const stage = document.createElement("div");
          stage.className = "galleryStage orbitStage";
          const img = makeImg(images[0] || "");
          img.className = "orbitImg";
          stage.appendChild(img);
          wrap.appendChild(stage);
          galleryHost.appendChild(wrap);

          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = images.length;
              if (!n) return;
              const t = p01 * n;
              const idx = Math.max(0, Math.min(n - 1, Math.floor(t)));
              const local = t - idx; // 0..1

              const phase = local * Math.PI * 2;
              const depth = (Math.cos(phase) + 1) / 2; // 1 back-ish, 0 front-ish
              const front = 1 - depth;

              const x = -170 + local * 340;
              const y = -18 * Math.sin(phase);
              const scale = 0.78 + front * 0.42;
              const rotY = (-28 + local * 56);
              const blur = 2.2 * depth;
              const opacity = 0.55 + front * 0.45;

              if (img.src !== images[idx]) img.src = images[idx];
              img.style.opacity = `${opacity.toFixed(3)}`;
              img.style.filter = `blur(${blur.toFixed(2)}px)`;
              img.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotateY(${rotY.toFixed(
                1
              )}deg) scale(${scale.toFixed(3)})`;
              img.style.zIndex = String(10 + Math.round(front * 10));
            },
          });
        } else if (mode === "timeline") {
          const list = document.createElement("div");
          list.className = "timelineList";

          const captions = Array.isArray(gcfg.captions) ? gcfg.captions : [];
          const items = [];
          for (let i = 0; i < images.length; i++) {
            const row = document.createElement("div");
            row.className = "timelineItem";

            const media = document.createElement("div");
            media.className = "timelineMedia";
            media.appendChild(makeImg(images[i]));
            row.appendChild(media);

            const text = document.createElement("div");
            text.className = "timelineText";
            const cap = captions[i];
            if (cap) {
              const p = document.createElement("p");
              p.textContent = cap;
              text.appendChild(p);
            }
            row.appendChild(text);

            list.appendChild(row);
            items.push(row);
          }

          wrap.appendChild(list);
          galleryHost.appendChild(wrap);

          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = items.length;
              const revealCount = Math.min(n, Math.floor(p01 * (n + 1)));
              for (let i = 0; i < n; i++) items[i].classList.toggle("isRevealed", i < revealCount);
            },
          });
        } else if (mode === "polaroid" || mode === "stack") {
          const stage = document.createElement("div");
          stage.className = `galleryStage ${mode}Stage`;
          const items = [];

          for (let i = 0; i < images.length; i++) {
            const fig = document.createElement("figure");
            fig.className = `polaroidItem ${mode === "stack" ? "stackItem" : "scatterItem"}`;

            const img = makeImg(images[i]);
            fig.appendChild(img);

            // seeded layout
            const maxX = mode === "stack" ? 18 : 120;
            const maxY = mode === "stack" ? 16 : 72;
            const x = (rng() * 2 - 1) * maxX;
            const y = (rng() * 2 - 1) * maxY;
            const r = (rng() * 2 - 1) * (mode === "stack" ? 6 : 14);
            fig.style.setProperty("--x", `${x.toFixed(1)}px`);
            fig.style.setProperty("--y", `${y.toFixed(1)}px`);
            fig.style.setProperty("--r", `${r.toFixed(1)}deg`);
            fig.style.zIndex = String(10 + i);

            stage.appendChild(fig);
            items.push(fig);
          }

          wrap.appendChild(stage);
          galleryHost.appendChild(wrap);

          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = items.length;
              const revealCount = Math.min(n, Math.floor(p01 * (n + 1)));
              for (let i = 0; i < n; i++) items[i].classList.toggle("isRevealed", i < revealCount);
            },
          });
        } else if (mode === "conveyor") {
          const stage = document.createElement("div");
          stage.className = "galleryStage conveyorStage";
          const metas = [];

          for (let i = 0; i < images.length; i++) {
            const fig = document.createElement("figure");
            fig.className = "conveyorItem";
            fig.appendChild(makeImg(images[i]));
            stage.appendChild(fig);

            metas.push({
              el: fig,
              t: images.length === 1 ? 0 : i / (images.length - 1),
              x: (rng() * 2 - 1) * 120,
              r: (rng() * 2 - 1) * 7,
              s: 0.94 + rng() * 0.14,
            });
          }

          wrap.appendChild(stage);
          galleryHost.appendChild(wrap);

          const windowT = typeof gcfg.windowT === "number" ? Math.max(0.12, Math.min(0.6, gcfg.windowT)) : 0.28;
          galleries.push({
            trackEl: track,
            update: (p01) => {
              for (const m of metas) {
                const rel = (m.t - p01) / windowT; // 0 center, + below, - above
                const y = rel * 520;
                const a = clamp01(1 - Math.abs(rel) / 1.15);
                const scale = (m.s * (0.92 + (1 - Math.abs(rel)) * 0.18));
                m.el.style.opacity = `${a.toFixed(3)}`;
                m.el.style.transform = `translate(-50%, -50%) translate(${m.x.toFixed(1)}px, ${y.toFixed(
                  1
                )}px) rotate(${m.r.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
                m.el.style.pointerEvents = a > 0.2 ? "auto" : "none";
              }
            },
          });
        } else {
          // default: grid
          const gridEl = document.createElement("div");
          gridEl.className = "galleryGrid";
          gridEl.style.setProperty("--cols", String(cols));

          const items = [];
          for (const src of images) {
            const fig = document.createElement("figure");
            fig.className = "galleryItem";
            fig.appendChild(makeImg(src));
            gridEl.appendChild(fig);
            items.push(fig);
          }

          wrap.appendChild(gridEl);
          galleryHost.appendChild(wrap);

          galleries.push({
            trackEl: track,
            update: (p01) => {
              const n = items.length;
              const revealCount = Math.min(n, Math.floor(p01 * (n + 1)));
              for (let i = 0; i < n; i++) items[i].classList.toggle("isRevealed", i < revealCount);
            },
          });
        }
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
        } else {
          // No image for this chapter: avoid an empty right column.
          grid.style.gridTemplateColumns = "1fr";
        }
      }

      grid.appendChild(left);
      grid.appendChild(right);
      chapter.appendChild(grid);

      sticky.appendChild(chapter);
      track.appendChild(sticky);
      scrollyRootEl.appendChild(track);
      chapterMeta.set(ch.id, { track });
      trackEls.push(track);
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
      const h = document.createElement("h2");
      h.className = "title";
      h.textContent = story.cta.title || "One more thing…";
      const sub = document.createElement("p");
      sub.className = "subtitle";
      sub.textContent = story.cta.subtitle || "";
      header.appendChild(h);
      header.appendChild(sub);
      chapter.appendChild(header);

      const body = document.createElement("div");
      body.className = "body";
      const ctaLines = Array.isArray(story?.cta?.body) ? story.cta.body : null;
      const lines = ctaLines && ctaLines.length ? ctaLines : ["When you’re ready, click below."];
      for (const line of lines) {
        const p = document.createElement("p");
        p.textContent = line;
        body.appendChild(p);
      }
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
      trackEls.push(ctaTrack);
    }

    // Discrete section bar (one segment per track)
    const segFills = [];
    pillBar.innerHTML = "";
    for (let i = 0; i < trackEls.length; i++) {
      const seg = document.createElement("div");
      seg.className = "pillSeg";
      const fill = document.createElement("div");
      fill.className = "pillFill";
      fill.style.transform = "scaleX(0)";
      seg.appendChild(fill);
      pillBar.appendChild(seg);
      segFills.push(fill);
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

    function trackProgress(trackEl) {
      if (!trackEl) return 0;
      const rect = trackEl.getBoundingClientRect();
      const viewH = window.innerHeight;
      const total = Math.max(1, rect.height - viewH);
      return clamp01((-rect.top) / total);
    }

    function overallStoryProgress() {
      const startEl = trackEls[0];
      const endEl = trackEls[trackEls.length - 1];
      if (!startEl || !endEl) return 0;

      // Convert element positions (viewport-relative) to document coordinates.
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const startY = scrollY + startEl.getBoundingClientRect().top;
      const endY =
        scrollY +
        endEl.getBoundingClientRect().top +
        endEl.offsetHeight -
        window.innerHeight;

      const denom = Math.max(1, endY - startY);
      return clamp01((scrollY - startY) / denom);
    }

    function update() {
      // pill: overall progress through the whole story page
      pillLabel.textContent = `STORY · ${Math.round(overallStoryProgress() * 100)}%`;

      for (let i = 0; i < trackEls.length; i++) {
        const p = trackProgress(trackEls[i]);
        const node = segFills[i];
        if (node) node.style.transform = `scaleX(${p})`;
      }

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

      // Gallery effects (mode-specific)
      for (const g of galleries) {
        const p = prefersReducedMotion() ? 1 : trackProgress(g.trackEl);
        if (typeof g.update === "function") g.update(p);
      }

      if (!prefersReducedMotion()) requestAnimationFrame(update);
    }

    // Run once even in reduced-motion mode (no animation loop).
    update();
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
    const noScaleStart = typeof noConfirm.noScaleStart === "number" ? noConfirm.noScaleStart : 1.0;
    const noScaleStep = typeof noConfirm.noScaleStep === "number" ? noConfirm.noScaleStep : 0.08;
    let confirmIndex = 0;
    let confirmUsed = false;

    let yesBaseScale = yesScaleStart;
    let noBaseScale = noScaleStart;

    function setYesBaseScale(scale) {
      yesBaseScale = scale;
      yesBtn.style.setProperty("--scale", String(yesBaseScale));
    }

    function setNoBaseScale(scale) {
      noBaseScale = scale;
      noBtn.style.setProperty("--scale", String(noBaseScale));
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
      // Keep the first confirmation at normal size, then shrink a bit each click.
      const noScale = Math.max(0.65, noScaleStart - idx * noScaleStep);
      setNoBaseScale(noScale);
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
    setNoBaseScale(noScaleStart);

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

      // Compose the grid
      grid.appendChild(left);
      grid.appendChild(right);
      chapter.appendChild(grid);
      sticky.appendChild(chapter);
      track.appendChild(sticky);
      scrollyRootEl.appendChild(track);
