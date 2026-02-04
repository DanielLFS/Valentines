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

  // Optional footer hint text
  hintText: "Made with love (and a tiny bit of JavaScript).",

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
    yesDodges: 5,
    noDodges: 7,
    // how close the pointer needs to get before it dodges
    triggerRadiusPx: 110,
    // max move distance per dodge
    dodgeDistancePx: 170,
    // playful voice lines
    taunts: [
      "Hehe, not that fast…",
      "You gotta *mean* it 😌",
      "Scrolling is required for this quest.",
      "Skill issue (jk).",
      "Okay okay, I’ll chill… soon.",
    ],
    tauntsFile: "assets/text/chase-taunts.txt",
    // Testing-only: show extra direct links (recommended during development)
    showSeriousLinks: false,
  },

  // Put your images in assets/images/ and reference them here.
  // You can use URLs too, but local files are easiest.
  images: {
    intro: "assets/images/intro.svg",
    question: "assets/images/question.svg",
    yes: "assets/images/yes.svg",
    no: "assets/images/no.svg",
  },

  // Floating visuals (scrolly mode). These can be photos, stickers, etc.
  // Put PNGs/SVGs in assets/images and point imageKey to one of VAL_CONFIG.images keys,
  // or use src directly.
  floating: [
    {
      id: "float-heart",
      src: "assets/images/yes.svg",
      widthPx: 160,
      // position is relative to viewport center
      from: { x: -360, y: -180, rot: -18, scale: 0.95, opacity: 0.0 },
      to: { x: -320, y: -220, rot: 12, scale: 1.05, opacity: 0.9 },
      chapterRange: ["intro", "question"],
    },
    {
      id: "float-sparkle",
      src: "assets/images/question.svg",
      widthPx: 120,
      from: { x: 380, y: -120, rot: 10, scale: 0.9, opacity: 0.0 },
      to: { x: 420, y: -160, rot: 32, scale: 1.0, opacity: 0.75 },
      chapterRange: ["intro", "question"],
    },
  ],

  // Scrollytelling chapters
  pages: {
    story: {
      // The scroll-story runs until the confession, then a click takes you to question.html
      chapters: [
        {
          id: "intro",
          title: "Hey you :)",
          subtitle: "Scroll a little… I made this for you.",
          body: [
            "This is a scroll-story page (Apple product page vibes, but romantic).",
            "As you scroll, things reveal and float around.",
          ],
          imageKey: "intro",
          trackVh: 170,
          layout: "split",
        },
        {
          id: "build",
          title: "A quick confession",
          subtitle: "You make life feel lighter.",
          body: [
            "I like you… a lot.",
            "And I’d love to make a Valentine plan with you.",
          ],
          imageKey: "question",
          trackVh: 170,
          layout: "split",
        },
      ],
      cta: {
        title: "One more thing…",
        subtitle: "Click when you’re ready.",
        label: "I have a question →",
        href: "question.html",
      },
    },

    question: {
      title: "Will you be my Valentine?",
      subtitle: "Catch a button (gently).",
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
        noLabelDuring: "I’m sure",
        yesLabelDuring: "Okay fine… YES 💖",
        finalNoTaunt: "Okay. I’ll stop asking 💛",
      },
    },

    yes: {
      title: "YAY!!!",
      subtitle: "Best answer ever.",
      imageKey: "yes",
      body: [
        "It’s official.",
        "Text me: what do you want to do + when?",
      ],
      actions: [
        { label: "Back to story", href: "index.html" },
        { label: "Ask again", href: "question.html", variant: "secondary" },
      ],
      confetti: true,
    },

    no: {
      title: "All good 💛",
      subtitle: "Thanks for being honest.",
      imageKey: "no",
      body: [
        "No hard feelings — you’re still my favorite human.",
        "If you want, we can still do something low-key.",
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
      imageKey: "intro",
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
      imageKey: "question",
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
      imageKey: "yes",
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
      imageKey: "no",
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
