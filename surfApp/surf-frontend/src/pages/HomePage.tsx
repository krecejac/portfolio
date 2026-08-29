import { useOutletContext } from "react-router-dom";
import Hero from "../components/Hero";
import TodaysPicks from "../components/TodaysPicks";
import SpotsBoard from "../components/SpotsBoard";
import type { AppOutletContext } from "../types";

// The landing page: hero + recommended picks + the full ranked board.
export default function HomePage() {
  const { isLoggedIn, favorites, toggle, homeRegion } =
    useOutletContext<AppOutletContext>();

  return (
    <>
      <Hero />

      {/* content sits on the wave motif, anchored to the top */}
      <div className="bg-[url('/bg.svg')] bg-[length:100%_auto] bg-top bg-no-repeat">
        <TodaysPicks
          favorites={favorites}
          canFavorite={isLoggedIn}
          onToggleFavorite={toggle}
          homeRegion={homeRegion}
        />
        <SpotsBoard
          favorites={favorites}
          canFavorite={isLoggedIn}
          onToggleFavorite={toggle}
        />
      </div>
    </>
  );
}
