import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

// Top navigation bar. Auth + profile state comes from the parent via props so
// there's still one shared source of truth in the Layout.
interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  onSignIn: () => void;
  email: string | null;
  homeRegion: string | null;
  setHomeRegion: (region: string) => void;
}

export default function Navbar({
  isLoggedIn,
  onLogout,
  onSignIn,
  email,
  homeRegion,
  setHomeRegion,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-[1100] bg-white h-16">
      <div className="w-full h-full flex items-center justify-between px-8">
        <div className="flex items-center gap-12 h-full">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Swell.png" alt="Swell" className="h-10 w-auto" />
          </Link>

          <div className="flex items-center gap-8 h-full">
            <Link
              to="/cams"
              className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
            >
              Cams & Forecast
            </Link>

            <Link
              to="/maps"
              className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
            >
              Maps
            </Link>

            <Link
              to="/learn"
              className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
            >
              Learn
            </Link>

            <Link
              to="/about"
              className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
            >
              About
            </Link>
          </div>
        </div>

        <div className="h-full flex items-center">
          {isLoggedIn ? (
            <ProfileMenu
              email={email}
              homeRegion={homeRegion}
              setHomeRegion={setHomeRegion}
              onLogout={onLogout}
            />
          ) : (
            <button
              onClick={onSignIn}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
