import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Mode = "login" | "signup";

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center px-6 font-sans">
      <div className="max-w-sm w-full mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#CCFF00] rounded-xl flex items-center justify-center text-black font-black italic tracking-tighter text-xl">
            J
          </div>
          <h1 className="text-3xl font-bold italic tracking-tighter uppercase">
            Journable
          </h1>
        </div>
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-10">
          {mode === "login" ? "Sign in to continue" : "Create your account"}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              disabled={busy}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={busy}
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            disabled={busy}
          />
          {error && (
            <div className="text-red-400 text-xs font-bold uppercase tracking-widest mt-1">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="bg-[#CCFF00] text-black font-black uppercase tracking-widest text-xs py-3 rounded-2xl hover:bg-[#b3ff00] transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-6 w-full text-center"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-10 text-center">
          Data is stored locally on this device.
        </p>
      </div>
    </div>
  );
}
