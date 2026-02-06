// Edit this file to customize text, images, and the flow.
// Keep it wholesome + honest: this page should feel like a cute card.

window.VAL_CONFIG = {
  // Rendering mode:
  // - "single": one card that switches scenes (original behavior)
  // - "scroll": all scenes stacked; scrolling reveals them
  // Rendering mode is now decided by the HTML page you open:
  // - index.html (story)
  // - question.html
  // - yes.html / no.html
  // (single/scroll/scrolly modes are still supported as fallback)
  mode: "scrolly",

  // Only applies in scroll mode.
  revealOnScroll: true,

  // Page/browser tab title
  pageTitle: "Valentine?",

  // Small pill at the top
  badgeText: "A tiny page from me to you",

  // Background love-letter vibe (top corners)
  letter: {
    enabled: true,
    to: "To: Lovely Lauren",
    from: "From: Boyfriend Dan",
  },

  // Background theming
  // Tip: download a royalty-free photo (paper/envelope/love letter) and put it in assets/images/,
  // then set e.g. stockImages: ["assets/images/letter-bg.jpg"].
  background: {
    style: "stock", // "stock" | "paper"
    stockImages: ["assets/images/Untitled.jpg"],
    photoOpacity: 0.55,
    photoBlurPx: 0,
    photoSaturate: 1.55,
    showLines: false,
    showDoodles: true,
    doodlesOpacity: 0.1,
    // Hearts tile size. "33vh" makes ~3 repeats per viewport height.
    doodlesSize: "39vh",
  },

  // Optional footer hint text
  hintText: "Made with love (and a tiny bit of JavaScript).",

  // Debug/testing helpers
  // - Set galleryModeOverride to force ALL gallery chapters to use a mode
  // - Or use a URL param on index.html: ?gallery=stack (or orbit/grid/spotlight/etc)
  debug: {
    galleryModeOverride: "",
    // Shows a small bottom-right dropdown on the story page
    // to quickly test gallery modes (updates ?gallery=... and reloads).
    showGalleryModePicker: true,
  },

  // If true, the user can always choose "No" and it will be respected.
  // If false, the flow can be playful, but keep it kind.
  allowNo: true,

  // Optional playful behavior for the "No" button on the question scene.
  // Guardrails:
  // - A clear alternative "No" link is always shown so it never becomes coercive.
  // - After maxDodges, the button stops moving (if stopAfterMaxDodges=true).
  // Chase buttons (scrolly mode question chapter)
  chase: {
    enabled: true,
    // both buttons can dodge until they "give up"
    yesDodges: 11,
    noDodges: 10,
    // how close the pointer needs to get before it dodges
    triggerRadiusPx: 60,
    // max move distance per dodge
    dodgeDistancePx: 120,
    // Taunts show ON the buttons as they dodge.
    // Edit the .txt files to add/remove/reorder lines — one taunt per line.
    yesTauntsFile: "assets/text/yes-taunts.txt",
    noTauntsFile: "assets/text/no-taunts.txt",
    // Inline fallbacks (used only if the file can't load).
    yesTaunts: ["Not yet! 😏", "Almost…", "Try harder 💪", "So close!", "Nope 🙃"],
    noTaunts: ["Hehe 😌", "Nuh uh", "Skill issue (jk)", "Keep trying…", "You sure?"],
    // Shared fallback taunts file (used if per-button files aren't set).
    tauntsFile: "assets/text/chase-taunts.txt",
    // Shown at bottom once the first button stops dodging.
    readyJoke: "Ok, according to my calculations, this was how many times each respective button could have dodged for while keeping your tiktok brain enganged. XxX",
    // Testing-only: show extra direct links (recommended during development)
    showSeriousLinks: false,
  },

  // Put your images in assets/images/ and reference them here.
  // You can use URLs too, but local files are easiest.
  // Theme images: add your own files under assets/images/ and reference them here.
  // (Placeholders removed.)
  images: {
    noImg: "assets/images/IMG_1576.jpg",
  },

  // Floating visuals (scrolly mode). These can be photos, stickers, etc.
  // Put PNGs/SVGs in assets/images and point imageKey to one of VAL_CONFIG.images keys,
  // or use src directly.
  floating: [],

  // Scrollytelling chapters
  pages: {
    story: {
      // The scroll-story runs until the confession, then a click takes you to question.html
      chapters: [
        {
          id: "intro",
          title: "Hey baby :)",
          subtitle: "This is a scroll-story page",
          showBadge: true,
          body: [
            "Scroll a little… I made this for you.",
            "As you scroll, things will reveal themselves and float around.",
          ],
          trackVh: 170,
          layout: "split",
        },
        {
          id: "build",
          title: "A quick confession",
          subtitle: "You've made the past few weeks really special for me ",
          showBadge: false,
          body: [
            "I love you!! and I made this refresher.",
            "So here's to reliving some precious reminders of the past three-ish months together: :)",
          ],
          trackVh: 170,
          layout: "split",
        },
        {
          id: "roster",
          title: "Us (so far)",
          subtitle: "A little photo roll to scroll through.",
          showBadge: false,
          body: [
            "As you scroll, photos will pop in one by one.",
          ],
          trackVh: 260,
          layout: "gallery",
          gallery: {
            // Gallery modes you can test:
            // - "final"       : conveyor reveal → big polaroid → shrink + scatter collage
            // - "grid"        : images pop in sequentially in a grid
            // - "grid-shuffle": same, but stable-shuffled order
            // - "orbit"       : one-at-a-time "jewelry display" orbit (behind → front → behind)
            // - "stack"       : printed-photo stack (your #2 idea)
            // - "polaroid"    : scattered polaroids that land in
            // - "conveyor"    : photos drift upward; new ones enter bottom, exit top
            // - "spotlight"   : one big photo at a time (scroll advances)
            // - "timeline"    : vertical timeline list (optionally add captions)
            mode: "final",
            // When true, this chapter renders as images-only (no title/subtitle/body).
            bare: true,
            // Final-collage tuning
            spread: 0.95,
            targetCount: 40,
            appearScale: 2.5,
            // Deterministic sizing knobs:
            // - `appearScale`: how big they pop in before shrinking
            // - `scatterSize`: ONE knob for scattered size
            //    - <=1 means fraction of stage height (e.g. 0.30)
            //    - >1 means pixels (e.g. 280)
            scatterSize: 0.3,
            // Landscape photos: fraction of portrait target height to use.
            // 1.0 = same height as portrait (very wide), 0.7 = 70% height.
            landscapeRatioFactor: 0.75,
            // Minimum gap (px) between scattered frames (prevents overlap).
            scatterGapPx: 6,
            columns: 3,
            // Randomize order (default is true if omitted).
            // - randomizeMode: "random" reshuffles each load, "stable" keeps a consistent order.
            randomize: true,
            randomizeMode: "random",
            images: [
              "assets/images/rosterimgs/IMG_0138.jpeg",
              "assets/images/rosterimgs/IMG_0146.jpeg",
              "assets/images/rosterimgs/IMG_0147.jpeg",
              "assets/images/rosterimgs/IMG_0253.jpeg",
              "assets/images/rosterimgs/IMG_0254.jpeg",
              "assets/images/rosterimgs/IMG_0813.jpeg",
              "assets/images/rosterimgs/IMG_0828.jpeg",
              "assets/images/rosterimgs/IMG_8160.JPG",
              "assets/images/rosterimgs/IMG_8184.jpg",
              "assets/images/rosterimgs/IMG_8212.jpeg",
              "assets/images/rosterimgs/IMG_8234.jpeg",
              "assets/images/rosterimgs/IMG_8325.jpeg",
              "assets/images/rosterimgs/IMG_8844.jpeg",
              "assets/images/rosterimgs/IMG_8889.jpeg",
              "assets/images/rosterimgs/IMG_8891.jpeg",
              "assets/images/rosterimgs/IMG_9262.jpeg",
              "assets/images/rosterimgs/IMG_9264.jpeg",
              "assets/images/rosterimgs/IMG_9560.jpeg",
              "assets/images/rosterimgs/IMG_9586.jpeg",
            ],
          },
        },
      ],
      cta: {
        title: "One more thing…",
        subtitle: "Click when you’re ready.",
        body: [
          "When your ready, find the button below.",
        ],
        label: "I have a question →",
        href: "question.html",
        // Optional mini-game: hide the CTA button under a fog that only clears near the cursor.
        hunt: {
          enabled: true,
          // Radius of the visible "flashlight" area.
          revealRadiusPx: 90,
          // How close you need to get to reveal + enable the button.
          foundRadiusPx: 70,
          // How tall the fog sits at the bottom of the card.
          fogHeightPx: 240,
          // 0..1
          fogOpacity: 0.92,
          // Small easter egg shown once when found.
          eggText: "Found it 😌",
        },
      },
    },

    question: {
      title: "Will you be my Valentine?",
      subtitle: "Catch a button.",
      body: [
        "Okay… here’s the question.",
        "Both buttons are feeling shy today.",
      ],
      yesLabel: "Yes 💖",
      noLabel: "Not this time",
      yesHref: "yes.html",
      noHref: "no.html",

      // When No is clicked (after the chase), ask "really?" a few times.
      // Each step makes the Yes button bigger.
      noConfirm: {
        prompts: [
          "Really sure?",
          "Like… 100% sure?",
          "Okay but what if I say please 😭",
          "Last chance…?",
        ],
        promptsFile: "assets/text/no-confirm-prompts.txt",
        yesScaleStart: 1.0,
        yesScaleStep: 0.18,
        // Make the "No" button shrink a bit each time they click it during the confirm loop.
        // (The first confirmation stays normal size.)
        noScaleStart: 1.0,
        noScaleStep: 0.08,
        noLabelDuring: "I’m sure",
        yesLabelDuring: "YES 💖",
        finalNoTaunt: "Okay. I’ll stop asking 💛",
      },
    },

    yes: {
      title: "YAY!!!",
      subtitle: "Best answer ever.",
      body: [
        "It’s official.",
        "You and me, Friday to saturday, @my_house London, I have the rest of the plans :)",
      ],
      actions: [
        { label: "Back to story", href: "index.html" },
        { label: "Ask again", href: "question.html", variant: "secondary" },
      ],
      confetti: true,
    },

    no: {
      title: "All good 💛",
      subtitle: "Thanks for being honest, but now I reallly gotta try make you jealous.",
      imageKey: "noImg",
      body: [
        "No hard feelings — you’re still my favorite ehhh near-London u know... butttt I'll now be spending it with this guy!",
        "If you want, we can still do something very low-key, but I gotta make Francesco feel welcomed in my home (and bed) :)",
      ],
      actions: [
        { label: "Back to story", href: "index.html" },
        { label: "See the question", href: "question.html", variant: "secondary" },
      ],
    },
  },

  // Back-compat for the old scrolly renderer (kept empty intentionally)
  chapters: [],

  // Scenes define what shows on each step (single/scroll modes).
  scenes: [
    {
      id: "intro",
      title: "Hey you :)",
      subtitle: "I made you a tiny page.",
      body: [
        "Before you keep going… I just want you to know you make my days better.",
        "Click next — I have a question.",
      ],
      actions: [
        { label: "Next", variant: "primary", to: "question" },
      ],
    },
    {
      id: "question",
      title: "Will you be my Valentine?",
      subtitle: "No pressure. Just vibes.",
      body: [
        "We can do something chill, something fancy, or something silly.",
        "You get to pick.",
      ],
      actions: [
        { label: "Yes 💖", variant: "primary", to: "yes" },
        // In scroll mode, this button can optionally "run away" for a playful effect.
        // A separate always-clickable "No" link is still shown.
        { label: "Not this time", variant: "secondary", to: "no", runaway: true },
      ],
    },
    {
      id: "yes",
      title: "YAY!!!",
      subtitle: "Best answer ever.",
      body: [
        "Okay now it’s official.",
        "Text me your dream plan: food, activity, time — I’m in.",
      ],
      actions: [
        { label: "Restart", variant: "secondary", to: "intro" },
      ],
      confetti: true,
    },
    {
      id: "no",
      title: "All good 💛",
      subtitle: "Thanks for being honest.",
      body: [
        "No hard feelings — you’re still my favorite human.",
        "If you want, we can still do something low-key as friends.",
      ],
      actions: [
        { label: "Restart", variant: "secondary", to: "intro" },
      ],
    },
  ],
};
