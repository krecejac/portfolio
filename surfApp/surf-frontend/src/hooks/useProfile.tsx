import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// Loads and updates the logged-in user's profile (email + home region).
// `token` comes from useAuth; null (logged out) means no profile.
export function useProfile(token: string | null) {
  const [email, setEmail] = useState<string | null>(null);
  const [homeRegion, setRegion] = useState<string | null>(null);

  // (Re)load the profile whenever the token changes (login / logout).
  useEffect(() => {
    if (!token) {
      setEmail(null);
      setRegion(null);
      return;
    }
    async function load() {
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEmail(data.email ?? null);
      setRegion(data.home_region ?? null);
    }
    load();
  }, [token]);

  // Save a new home region and reflect the saved value locally.
  async function setHomeRegion(region: string) {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ homeRegion: region }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRegion(data.home_region ?? region);
  }

  return { email, homeRegion, setHomeRegion };
}
