// Edit this file to customize text, images, and the flow.
// Keep it wholesome + honest: this page should feel like a cute card.

window.VAL_CONFIG = {
  // Rendering mode:
  // - "single": one card that switches scenes (original behavior)
  // - "scroll": all scenes stacked; scrolling reveals them
  mode: "scroll",

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
  runawayNo: {
    enabled: true,
    maxDodges: 6,
    scrollPerDodgePx: 140,
    stopAfterMaxDodges: true,
  },

  // Put your images in assets/images/ and reference them here.
  // You can use URLs too, but local files are easiest.
  images: {
    intro: "assets/images/intro.svg",
    question: "assets/images/question.svg",
    yes: "assets/images/yes.svg",
    no: "assets/images/no.svg",
  },

  // Scenes define what shows on each step.
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
