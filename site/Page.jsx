import LayersLoader from "./components/LayersLoader";
import SiteFlags from "./components/SiteFlags";
import HoldPush from "./components/HoldPush";
import IslandNav from "./components/IslandNav";
import BuildHero from "./components/BuildHero";
import TheCrown from "./components/TheCrown";
import CakeCounter from "./components/CakeCounter";
import InsideSlice from "./components/InsideSlice";
import BuildYourOwn from "./components/BuildYourOwn";
import BoxedFilm from "./components/BoxedFilm";
import JustOrdered from "./components/JustOrdered";
import VisitFooter from "./components/VisitFooter";
import SiteMotion from "./components/SiteMotion";
import CrumbDetails from "./components/CrumbDetails";
const ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#f5ede2"/><rect x="10" y="38" width="44" height="12" fill="#cfe0b4"/><rect x="10" y="26" width="44" height="12" fill="#f7cdd3"/><rect x="10" y="14" width="44" height="12" fill="#3b2418"/></svg>`)}`;
/** Crumb & Co: build a cake by scrolling. Plan + Motion map: site/DESIGN.md. */
export default function Page() {
  return (<>
    {/* never restore the old scroll position on reload · cover the page as it unloads so a reload never flashes
            the old page · ?record=1: hide the mouse arrow from the first frame */}
    <script dangerouslySetInnerHTML={{
      __html: `history.scrollRestoration="manual";addEventListener("pagehide",function(){var c=document.createElement("div");c.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#f5ede2";document.body.appendChild(c)});addEventListener("pageshow",function(e){if(e.persisted)location.reload()});if(/[?&]record/.test(location.search)){var s=document.createElement("style");s.textContent="*,*::before,*::after{cursor:none!important}html{scrollbar-width:none}html::-webkit-scrollbar{display:none}";document.head.appendChild(s)}`,
    }} />
    <link rel="icon" type="image/svg+xml" href={ICON} />
    <meta property="og:image" content="/images/crumb/og.jpg" />
    <SiteFlags />
    <LayersLoader />
    <HoldPush />
    <SiteMotion />
    <CrumbDetails />
    <IslandNav />
    <main className="relative overflow-x-clip">
      <BuildHero />
      <TheCrown />
      <CakeCounter />
      <InsideSlice />
      <BuildYourOwn />
      <BoxedFilm />
      <JustOrdered />
    </main>
    <VisitFooter />
  </>);
}
