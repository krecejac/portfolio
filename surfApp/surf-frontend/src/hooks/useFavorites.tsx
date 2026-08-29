import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// Manages the set of favorited spot ids for the logged-in user.
// `token` comes from useAuth; when it's null (logged out) we hold no favorites.
export function useFavorites(token: string | null) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Load the user's favorites whenever the token changes (login / logout).
  useEffect(() => {
    if (!token) {
      setFavorites(new Set()); // logged out -> clear
      return;
    }
    async function load() {
      const res = await fetch(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const ids: number[] = await res.json();
      setFavorites(new Set(ids));
    }
    load();
  }, [token]);

  // Add or remove one spot, then update local state to match.
  async function toggle(spotId: number) {
    if (!token) return; // not logged in -> ignore
    const isFav = favorites.has(spotId);
    const method = isFav ? "DELETE" : "POST";

    const res = await fetch(`${API_URL}/api/favorites/${spotId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    // Update the local Set (copy it — never mutate state directly).
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(spotId);
      else next.add(spotId);
      return next;
    });
  }

  return { favorites, toggle };
}
