import { useState } from "react";
import { UserCircle } from "lucide-react";
import { REGIONS } from "../regions";

interface ProfileMenuProps {
  email: string | null;
  homeRegion: string | null;
  setHomeRegion: (region: string) => void;
  onLogout: () => void;
}

// A small profile popover in the navbar: shows the signed-in email and lets
// the user pick a home region (which biases "Recommended"). Replaces a page.
export default function ProfileMenu({
  email,
  homeRegion,
  setHomeRegion,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile"
        className="flex items-center text-slate-600 transition-colors hover:text-blue-600"
      >
        <UserCircle size={28} />
      </button>

      {open && (
        <>
          {/* click-away layer */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-ink/10 bg-white p-5 shadow-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm text-ink">{email ?? "—"}</p>

            <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Home region
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Recommended shows spots from here first.
            </p>
            <select
              value={homeRegion ?? ""}
              onChange={(e) => setHomeRegion(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
            >
              <option value="" disabled>
                Choose a region…
              </option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="mt-4 w-full rounded-lg bg-ink/5 py-2 text-sm font-medium text-slate-600 transition hover:bg-ink/10"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
