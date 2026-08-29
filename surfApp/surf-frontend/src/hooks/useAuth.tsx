import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function useAuth() {
  // Read any saved token on first render, so a refresh keeps you logged in.
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  // Register a new account, then log in with the same credentials.
  async function register(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Registration failed.");
    }
    // Account created -> log in to get a token.
    await login(email, password);
  }

  // Log in: get a token, keep it in state AND localStorage.
  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Login failed.");
    }
    const { token } = await res.json();
    localStorage.setItem("token", token);
    setToken(token);
  }

  // Log out: forget the token everywhere.
  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return { token, isLoggedIn: token !== null, register, login, logout };
}
