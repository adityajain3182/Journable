import React, { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type View = "login" | "signup";

interface FormState {
  displayName: string;
  email: string;
  password: string;
}

const EMPTY: FormState = { displayName: "", email: "", password: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string): string | null {
  if (!v.trim()) return "Email is required.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address.";
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return "Password is required.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return null;
}

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [view, setView] = useState<View>("login");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const blurValidate = (field: keyof FormState, validatorFn: (v: string) => string | null) => {
    const msg = validatorFn(form[field]);
    setFieldErrors((e) => ({ ...e, [field]: msg ?? undefined }));
  };

  const switchView = (next: View) => {
    setView(next);
    setForm(EMPTY);
    setFieldErrors({});
    setError(null);
  };

  const wrap = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(form.email);
    const pErr = validatePassword(form.password);
    if (eErr || pErr) {
      setFieldErrors({ email: eErr ?? undefined, password: pErr ?? undefined });
      return;
    }
    wrap(async () => {
      await login(form.email, form.password);
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = form.displayName.trim() ? null : "Display name is required.";
    const eErr = validateEmail(form.email);
    const pErr = validatePassword(form.password);
    if (nameErr || eErr || pErr) {
      setFieldErrors({
        displayName: nameErr ?? undefined,
        email: eErr ?? undefined,
        password: pErr ?? undefined,
      });
      return;
    }
    wrap(async () => {
      await signup(form.email, form.password, form.displayName);
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center px-6 font-sans">
      <div className="max-w-sm w-full mx-auto">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#CCFF00] rounded-xl flex items-center justify-center text-black font-black italic text-xl">
            J
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Journable</h1>
        </div>

        {/* ── LOGIN ─────────────────────────────────────────────────────────── */}
        {view === "login" && (
          <>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8">
              Sign in to continue
            </p>
            <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-3">
              <div>
                <EmailInput
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => blurValidate("email", validateEmail)}
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.email} />
              </div>
              <div>
                <PasswordInput
                  placeholder="Password"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  onBlur={() => blurValidate("password", validatePassword)}
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.password} />
              </div>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Sign in" />
            </form>
            <SwitchMode
              label="Need an account?"
              action="Sign up"
              onClick={() => switchView("signup")}
            />
          </>
        )}

        {/* ── SIGNUP ────────────────────────────────────────────────────────── */}
        {view === "signup" && (
          <>
            <button
              type="button"
              onClick={() => switchView("login")}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 -ml-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8">
              Create your account
            </p>
            <form onSubmit={handleSignup} autoComplete="off" className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Display name"
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                  onBlur={() => {
                    if (!form.displayName.trim())
                      setFieldErrors((e) => ({ ...e, displayName: "Display name is required." }));
                  }}
                  autoComplete="off"
                  disabled={busy}
                  className={INPUT_CLASS}
                />
                <FieldError msg={fieldErrors.displayName} />
              </div>
              <div>
                <EmailInput
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => blurValidate("email", validateEmail)}
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.email} />
              </div>
              <div>
                <PasswordInput
                  placeholder="Password (min 6 chars)"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  onBlur={() => blurValidate("password", validatePassword)}
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.password} />
              </div>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Create account" />
            </form>
            <SwitchMode
              label="Already have an account?"
              action="Sign in"
              onClick={() => switchView("login")}
            />
          </>
        )}

        <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-10 text-center">
          Data is stored locally on this device.
        </p>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50 disabled:opacity-50";

function EmailInput({
  value, onChange, onBlur, disabled,
}: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; disabled?: boolean;
}) {
  return (
    <input
      type="email"
      placeholder="Email address"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoComplete="username"
      inputMode="email"
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

function PasswordInput({
  placeholder, value, onChange, onBlur, disabled,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void; disabled?: boolean;
}) {
  const [active, setActive] = useState(false);
  return (
    <input
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={() => setActive(true)}
      readOnly={!active}
      autoComplete="off"
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1">{msg}</p>;
}

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="text-red-400 text-xs font-bold uppercase tracking-widest">{msg}</div>;
}

function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="bg-[#CCFF00] text-black font-black uppercase tracking-widest text-xs py-3 rounded-2xl hover:bg-[#b3ff00] transition disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function SwitchMode({ label, action, onClick }: { label: string; action: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-6 w-full text-center"
    >
      {label} <span className="text-[#CCFF00]">{action}</span>
    </button>
  );
}
