import { useState } from "react";
import { Eye, EyeOff, Mail, X } from "lucide-react";

// Auth actions come from the parent so there is ONE shared auth state.
interface AuthFormProps {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  onClose: () => void;
}

type Mode = "login" | "register";

export default function AuthForm({ login, register, onClose }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // After a successful sign-up we show a "check your email" screen instead of
  // just closing, so the verification step is visible.
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
      } else {
        await register(email, password);
        setRegistered(true); // account created + logged in; show the notice
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  // Success screen after sign-up.
  if (registered) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Mail size={26} />
        </div>
        <h2 className="mt-4 font-display text-2xl uppercase tracking-tight text-ink">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          We sent a verification link to{" "}
          <span className="font-medium text-ink">{email}</span>. Confirm it to
          finish setting up your account — you're already signed in in the
          meantime.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-brand py-2.5 font-mono text-sm uppercase tracking-[0.14em] text-white transition hover:opacity-90"
        >
          Start surfing
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl uppercase tracking-tight text-ink">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Log in to save your spots and region."
              : "Free forever. Favourite breaks and set your home region."}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
        >
          <X size={20} />
        </button>
      </div>

      {/* mode switch */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
              mode === m
                ? "bg-white text-ink shadow-sm"
                : "text-slate-500 hover:text-ink"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Password
          </span>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 6 : undefined}
              className="w-full rounded-lg border border-ink/15 px-3 py-2.5 pr-10 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg bg-rating-poor/10 px-3 py-2 text-sm text-rating-poor">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-brand py-2.5 font-mono text-sm uppercase tracking-[0.14em] text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading
            ? "…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              onClick={() => switchMode("register")}
              className="font-medium text-brand hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => switchMode("login")}
              className="font-medium text-brand hover:underline"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
