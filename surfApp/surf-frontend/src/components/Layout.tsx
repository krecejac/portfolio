import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthForm from "./AuthForm";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { useProfile } from "../hooks/useProfile";
import type { AppOutletContext } from "../types";

// The app shell every route shares: sticky navbar, the current page (<Outlet/>),
// footer, and the auth modal. Shared state (auth + favorites) lives here so it
// survives navigation between pages; pages read it via useOutletContext().
export default function Layout() {
  const { token, isLoggedIn, logout, login, register } = useAuth();
  const { favorites, toggle } = useFavorites(token);
  const { email, homeRegion, setHomeRegion } = useProfile(token);
  const [showAuth, setShowAuth] = useState(false);

  // The Maps page is a full-screen app view: it fills the viewport under the
  // navbar and drops the footer, so there's no awkward scroll past the map.
  const isFullScreen = useLocation().pathname === "/maps";

  const context: AppOutletContext = {
    isLoggedIn,
    favorites,
    toggle,
    email,
    homeRegion,
    setHomeRegion,
  };

  return (
    <div
      className={`flex flex-col bg-[#fecb85] ${
        isFullScreen ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={logout}
        onSignIn={() => setShowAuth(true)}
        email={email}
        homeRegion={homeRegion}
        setHomeRegion={setHomeRegion}
      />

      {/* the matched child route renders here; flex-1 fills the remaining height
          (min-h-0 lets a full-screen child like the map size to it) */}
      <div className="min-h-0 flex-1">
        <Outlet context={context} />
      </div>

      {!isFullScreen && <Footer />}

      {showAuth && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40"
          onClick={() => setShowAuth(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AuthForm
              login={login}
              register={register}
              onClose={() => setShowAuth(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
