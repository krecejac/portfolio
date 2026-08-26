import { useState } from "react";
import SurfSpot from "./SurfSpot";
import { useSpots } from "./useSpots";
import { ArrowUpDown, Mail } from "lucide-react";

function App() {
  const { spots, sortByWaveHeight } = useSpots();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSpots = spots.filter((spot) =>
    spot.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[url('/bg.svg')] bg-cover bg-center bg-fixed bg-no-repeat bg-[#F9D59E]">
      <nav className="sticky top-0 z-50 bg-white h-16">
        <div className="w-full h-full flex items-center justify-between px-8">
          <div className="flex items-center gap-12 h-full">
            <a href="/" className="flex items-center gap-3">
              <img src="/Swell.png" alt="Swell" className="h-10 w-auto" />
            </a>

            <div className="flex items-center gap-8 h-full">
              <a
                href="#cams-forecast"
                className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
              >
                Cams & Forecast
              </a>

              <a
                href="#learn"
                className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
              >
                Learn
              </a>

              <a
                href="#smt"
                className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
              >
                Something
              </a>

              <a
                href="#about"
                className="h-full flex items-center text-slate-600 font-medium transition-all border-b-[3px] border-transparent hover:border-slate-800 hover:text-slate-900"
              >
                About
              </a>
            </div>
          </div>

          <div className="h-full flex items-center">
            <a
              href="#sign-in"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex justify-end font-bold text-6xl py-20">
          <h2 className="max-w-80 text-blue-800 ">Your surfing forecast</h2>
        </div>
        <input
          type="text"
          placeholder="Search for a spot..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full max-w-xs mx-auto mb-6 px-4 py-2 border bg-white border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={sortByWaveHeight}
          className="flex items-center gap-2 mx-auto mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowUpDown size={16} />
          Sort by wave height
        </button>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSpots.map((spot) => (
            <SurfSpot key={spot.name} spot={spot} />
          ))}
        </div>
      </div>
      <footer id="about" className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src="/Swell.png" alt="Swell" className="h-8 mb-3" />
            <p className="text-sm">Surf forecast for you.</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <a
              href="#cams-forecast"
              className="hover:text-white transition-colors"
            >
              Cams &amp; Forecast
            </a>
            <a href="#learn" className="hover:text-white transition-colors">
              Learn
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <a
              href="mailto:jachymkrecek77@gmail.com"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail size={18} />
              jachymkrecek77@gmail.com
            </a>
            <a
              href="https://github.com/krecejac"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/jáchym-křeček"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5v-9h3v9Zm-1.5-10.3a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5ZM19 19h-3v-4.7c0-1.1 0-2.5-1.5-2.5S12.7 13 12.7 14.2V19h-3v-9h2.9v1.2h.1a3.2 3.2 0 0 1 2.9-1.6c3.1 0 3.7 2 3.7 4.7V19Z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 px-6 py-4 text-xs text-center">
          Weather data by{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            Open-Meteo.com
          </a>
          {" · "}© 2026 Jáchym Křeček
        </div>
      </footer>
    </div>
  );
}

export default App;
