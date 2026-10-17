// Settings for THIS site: Crumb & Co, a (concept) pâtisserie in Hyderabad. "Build a cake by scrolling."
// Direction + Motion map: site/DESIGN.md. Video plan + measured video times: site/DESIGN.md → "Video plan".
export const meta = {
  name: "Crumb & Co",
  title: "Crumb & Co — Build a cake by scrolling",
  description: "Crumb & Co, a concept pâtisserie in Hyderabad: layer cakes by the kilo, a ganache crown, a build-your-own cake and same-day delivery. A concept design.",
  loaderText: "Crumb & Co",
  loader: false, // site/components/LayersLoader.tsx replaces the engine loader
  cursor: true,
  record: { duration: 30 }, // only used without the section timeline (the page uses data-record-time stops)
};
export const theme = {
  bg: "#F5EDE2", // measured: the cream backdrop of every film (left side), so the videos melt into the page
  surface: "#FFFFFF",
  text: "#3B2418", // chocolate ink
  muted: "#6E5243",
  accent: "#B8304C", // strawberry (the one accent: buttons, order pill, one word per section)
  accentText: "#FFF8EE",
  line: "#D9C8B8",
  fontDisplay: "'Bricolage Grotesque Variable', 'Arial Narrow', system-ui, sans-serif",
  fontBody: "'Onest Variable', system-ui, sans-serif",
  radius: 0,
  uppercaseHeadings: false,
  heroText: "#3B2418",
};
