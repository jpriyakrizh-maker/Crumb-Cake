const IMG = "/images/crumb";
export const img = (name) => `${IMG}/${name}`;
/* Films: video seconds measured on contact sheets (DESIGN.md → Video plan). Segments: play the video up to `to`
   seconds over `secs` record seconds. */
export const films = {
  // hero-build 0–6.3 s: base 1.25 · jam 2.5 · third sponge 3.4 · frosting 4.4–6.0 (6–8 s still hold: cut)
  build: {
    frames: "/frames/crumb-build",
    start: 1.3, // the scroll starts where the intro ends (the intro plays 0 → 1.3 by itself)
    poster: 6.3,
    segments: [
      { to: 2.6, secs: 1.1, label: "build-jam" },
      { to: 4.4, secs: 1.0, label: "build-layers" },
      { to: 6.0, secs: 1.2, label: "build-frosting" },
      // the finished cake holds a moment: "cake" melts in and stays sharp while the hero is still pinned
      { to: 6.3, secs: 0.9, label: "build-cake" },
    ],
  },
  // ganache-pour 0–6.8 s: pour 0.5 · drips formed 3.0 · toppings fall 3.6–4.9 · sprinkles 5.75 (jump-cut 7.63: cut)
  crown: {
    frames: "/frames/crumb-crown",
    start: 0.35, // 0–0.35 s is a still plain cake: the film starts as the jug begins to pour
    poster: 6.8,
    segments: [
      { to: 3.2, secs: 1.6, label: "crown-pour" },
      { to: 5.0, secs: 1.9, label: "crown-toppings" },
      { to: 6.8, secs: 1.0, label: "crown-sprinkles" },
    ],
  },
  // slice-cut 0–4.6 s: server in 0.25–1.75 · wedge out 2.0–4.4 (slides back after ~4.75: cut)
  slice: {
    frames: "/frames/crumb-slice",
    start: 0,
    poster: 4.6,
    segments: [
      { to: 1.9, secs: 1.1, label: "slice-server" },
      { to: 4.6, secs: 1.9, label: "slice-wedge" },
    ],
  },
  // box-close 0–4.6 s: flaps 0.8–2.0 · lid lands + tab 2.0–3.0 (the "sudden" payoff) · sticker 3.25–4.25
  box: {
    frames: "/frames/crumb-box",
    start: 0,
    poster: 4.6,
    segments: [
      { to: 2.0, secs: 1.4, label: "box-flaps" },
      { to: 3.1, secs: 0.7, label: "box-lid" },
      { to: 4.6, secs: 0.8, label: "box-sticker" },
    ],
  },
};
/** Measured hero beats: the headline's missing word switches when the video crosses these seconds. */
export const hero = {
  lead: "Build a",
  tail: "by scrolling.",
  words: [
    { at: 0, word: "base" },
    { at: 2.5, word: "jam" },
    { at: 4.4, word: "crème" },
    { at: 6.0, word: "cake" },
  ],
  // layer meter (1 → 7) by video second
  layers: [1.25, 1.35, 1.9, 2.4, 2.55, 3.4, 6.0],
  copy: "Seven layers, one scroll. Vanilla sponge, strawberry jam and whipped cream, stacked by hand every morning in Banjara Hills.",
  ctas: ["Order a cake", "Build your own"],
};
export const crown = {
  title: ["The", "Crown"],
  sub: "Dark ganache, poured warm. Berries, macarons and a pinch of gold, dropped while it's still glossy.",
  tags: [
    { id: "pour", name: "Pour", note: "64% dark ganache, poured at 32°", until: 3.2, tone: "pistachio" },
    { id: "drip", name: "Drip", note: "Twenty-two drips, none of them planned", until: 3.6, tone: "pink" },
    { id: "crown", name: "Crown", note: "Strawberries, raspberries, two macarons, gold", until: 99, tone: "cream" },
  ],
  /** video second the berries + macarons fall into frame: the cut-outs are thrown out of the film from here */
  throwAt: 3.6,
};
export const cakes = [
  { no: "01", name: "Chocolate Crown", note: "Vanilla sponge, jam, cream, dark ganache drip, berries + macarons", price: 1450, img: img("cake-crown.webp"), tone: "pink", kg: "per kg" },
  { no: "02", name: "Vanilla Cloud", note: "Three vanilla sponges, strawberry jam, whipped vanilla cream", price: 1050, img: img("cake-vanilla.webp"), tone: "cream", kg: "per kg" },
  { no: "03", name: "Pistachio Rose", note: "Pistachio buttercream, crushed pistachio, rose petals", price: 1650, img: img("cake-pistachio.webp"), tone: "pistachio", kg: "per kg" },
  { no: "04", name: "Strawberry Shortcake", note: "Strawberry cream, fresh halves, white chocolate curls", price: 1250, img: img("cake-strawberry.webp"), tone: "blush", kg: "per kg" },
];
export const counterSmall = [
  { name: "Slice of the day", price: "₹240" },
  { name: "Macaron box of 6", price: "₹540" },
  { name: "Cupcakes, 4", price: "₹420" },
  { name: "Candles + topper", price: "₹90" },
];
export const counter = {
  title: "Out of the oven at nine.",
  sub: "Four cakes on the counter today, all sold by the kilo. Half a kilo serves six.",
};
export const inside = {
  metric: "7",
  metricLabel: "layers",
  title: "Inside the Crown.",
  copy: "Cut it and count. Three sponges, two jams, two creams, one ganache coat. No fondant, no shortcuts, no freezer.",
  figures: [
    { v: "3", label: "vanilla sponges" },
    { v: "2", label: "strawberry jams" },
    { v: "2", label: "whipped creams" },
    { v: "7", label: "hours, start to box" },
  ],
};
export const builder = {
  title: "Build your own.",
  sub: "Four choices, one cake. We bake it the same morning.",
  steps: [
    { id: "shape", name: "Shape", options: ["Round", "Heart", "Square"], add: [0, 150, 100] },
    { id: "sponge", name: "Sponge", options: ["Vanilla", "Chocolate", "Pistachio"], add: [0, 100, 250] },
    { id: "finish", name: "Finish", options: ["Cream", "Ganache drip", "Berry crown"], add: [0, 200, 300] },
    { id: "size", name: "Size", options: ["½ kg", "1 kg", "2 kg"], mult: [0.5, 1, 2] },
  ],
  base: 1050, // per kg
  /** auto-demo (record mode): the choices it makes, in order */
  demo: [
    ["shape", 1],
    ["sponge", 1],
    ["finish", 1],
    ["size", 1],
  ],
};
export const boxed = {
  title: "Boxed by four.",
  sub: "Order by noon, it's at your door by 4 pm. Anywhere in Hyderabad.",
  features: [
    { name: "Same-day in Hyderabad", note: "Hand-carried, never stacked" },
    { name: "Eggless on request", note: "Every cake, same price" },
    { name: "A handwritten note", note: "Tell us the name, we pipe it too" },
    { name: "Candles + knife inside", note: "Nothing to remember" },
  ],
  cta: "Order for today",
};
export const orders = {
  title: "Just ordered.",
  today: 186,
  rows: [
    { name: "Riya", what: "Pistachio Rose, 1 kg", quote: "the crown!!", when: "now" },
    { name: "Arjun", what: "Chocolate Crown, 2 kg", quote: "for amma's 60th", when: "1 min" },
    { name: "Sana", what: "Build your own, heart", quote: "pistachio + ganache, yes", when: "3 min" },
    { name: "Kabir", what: "Macaron box of 6", quote: "again. sorry.", when: "4 min" },
    { name: "Meera", what: "Strawberry Shortcake, ½ kg", quote: "eggless please", when: "6 min" },
  ],
};
export const visit = {
  studio: ["The Crumb & Co studio", "Banjara Hills, Hyderabad"],
  hours: ["Tue–Sun · 9 am – 9 pm", "Mondays we bake for orders only"],
  counter: ["Slices at the counter", "Pickup from 10 am"],
  note: "Concept website by Triozen Tech. Crumb & Co is a fictional pâtisserie; prices are samples.",
};
export const nav = {
  links: [
    { label: "Menu", href: "#counter" },
    { label: "Build", href: "#build" },
    { label: "Inside", href: "#inside" },
    { label: "Visit", href: "#visit" },
  ],
  modes: ["Pickup", "Delivery"],
};
export const toppings = Array.from({ length: 8 }, (_, i) => img(`top-${i + 1}.webp`));
export const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
