import React, { useState } from "react";
import { ArrowLeft, Loader2, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { requestOTP, verifyOTP, resetPassword } from "../lib/auth";
import { OTPInput } from "./OTPInput";

type View =
  | "login"
  | "signup"
  | "signup-otp"
  | "forgot-email"
  | "forgot-otp"
  | "reset-password";

interface FormState {
  displayName: string;
  email: string;
  password: string;
  newPassword: string;
  otp: string;
}

const EMPTY: FormState = {
  displayName: "",
  email: "",
  password: "",
  newPassword: "",
  otp: "",
};

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
  // Per-field inline errors (shown after first blur or after a submit attempt)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear the per-field error as the user types.
    if (fieldErrors[field]) {
      setFieldErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const blurValidate = (field: keyof FormState, validatorFn: (v: string) => string | null) => {
    const msg = validatorFn(form[field]);
    setFieldErrors((e) => ({ ...e, [field]: msg ?? undefined }));
  };

  const resetToLogin = () => {
    setView("login");
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

  // ── Login ──────────────────────────────────────────────────────────────────
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

  // ── Signup step 1 ─────────────────────────────────────────────────────────
  const handleSignupRequest = (e: React.FormEvent) => {
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
      await requestOTP(form.email, "signup");
      setView("signup-otp");
    });
  };

  // ── Signup step 2 ─────────────────────────────────────────────────────────
  const handleSignupVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    wrap(async () => {
      verifyOTP(form.email, form.otp, "signup"); // throws on failure
      await signup(form.email, form.password, form.displayName);
    });
  };

  // ── Forgot step 1 ─────────────────────────────────────────────────────────
  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(form.email);
    if (eErr) { setFieldErrors({ email: eErr }); return; }
    wrap(async () => {
      await requestOTP(form.email, "reset");
      setView("forgot-otp");
    });
  };

  // ── Forgot step 2 ─────────────────────────────────────────────────────────
  const handleForgotVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    wrap(async () => {
      verifyOTP(form.email, form.otp, "reset"); // throws on failure
      setView("reset-password");
      setError(null);
    });
  };

  // ── Forgot step 3 ─────────────────────────────────────────────────────────
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const pErr = validatePassword(form.newPassword);
    if (pErr) { setFieldErrors({ newPassword: pErr }); return; }
    wrap(async () => {
      await resetPassword(form.email, form.newPassword);
      resetToLogin();
    });
  };

  const resendOTP = (purpose: "signup" | "reset") =>
    wrap(async () => {
      await requestOTP(form.email, purpose);
      set("otp", "");
    });

  // ──────────────────────────────────────────────────────────────────────────

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
                  autoComplete="off"
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.password} />
              </div>
              <button
                type="button"
                onClick={() => { setView("forgot-email"); setForm(EMPTY); setFieldErrors({}); setError(null); }}
                className="text-[#CCFF00]/70 hover:text-[#CCFF00] text-xs font-bold uppercase tracking-widest text-right self-end"
              >
                Forgot password?
              </button>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Sign in" />
            </form>
            <SwitchMode label="Need an account?" action="Sign up"
              onClick={() => { setView("signup"); setForm(EMPTY); setFieldErrors({}); setError(null); }} />
          </>
        )}

        {/* ── SIGNUP FORM ───────────────────────────────────────────────────── */}
        {view === "signup" && (
          <>
            <BackBtn onClick={resetToLogin} />
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8">
              Create your account
            </p>
            <form onSubmit={handleSignupRequest} autoComplete="off" className="flex flex-col gap-3">
              <div>
                <TextInput
                  placeholder="Display name"
                  value={form.displayName}
                  onChange={(v) => set("displayName", v)}
                  onBlur={() => {
                    if (!form.displayName.trim())
                      setFieldErrors((e) => ({ ...e, displayName: "Display name is required." }));
                  }}
                  autoComplete="off"
                  disabled={busy}
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
                  autoComplete="off"
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.password} />
              </div>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Send verification code" />
            </form>
            <SwitchMode label="Already have an account?" action="Sign in" onClick={resetToLogin} />
          </>
        )}

        {/* ── SIGNUP OTP ────────────────────────────────────────────────────── */}
        {view === "signup-otp" && (
          <>
            <BackBtn onClick={() => { setView("signup"); setError(null); }} />
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">
              Check your inbox
            </p>
            <InboxNote email={form.email} />
            <form onSubmit={handleSignupVerify} autoComplete="off" className="flex flex-col gap-5">
              <OTPInput onChange={(v) => set("otp", v)} disabled={busy} />
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Verify & create account" />
            </form>
            <ResendBtn onClick={() => resendOTP("signup")} disabled={busy} />
          </>
        )}

        {/* ── FORGOT — EMAIL ────────────────────────────────────────────────── */}
        {view === "forgot-email" && (
          <>
            <BackBtn onClick={resetToLogin} />
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">
              Reset password
            </p>
            <p className="text-zinc-600 text-xs mb-8 leading-relaxed">
              Enter the email tied to your account and we'll send a verification code.
            </p>
            <form onSubmit={handleForgotRequest} autoComplete="off" className="flex flex-col gap-3">
              <div>
                <EmailInput
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => blurValidate("email", validateEmail)}
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.email} />
              </div>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Send reset code" />
            </form>
          </>
        )}

        {/* ── FORGOT — OTP ──────────────────────────────────────────────────── */}
        {view === "forgot-otp" && (
          <>
            <BackBtn onClick={() => { setView("forgot-email"); setError(null); }} />
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">
              Check your inbox
            </p>
            <InboxNote email={form.email} />
            <form onSubmit={handleForgotVerify} autoComplete="off" className="flex flex-col gap-5">
              <OTPInput onChange={(v) => set("otp", v)} disabled={busy} />
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Verify code" />
            </form>
            <ResendBtn onClick={() => resendOTP("reset")} disabled={busy} />
          </>
        )}

        {/* ── FORGOT — NEW PASSWORD ─────────────────────────────────────────── */}
        {view === "reset-password" && (
          <>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8">
              Set new password
            </p>
            <form onSubmit={handleResetPassword} autoComplete="off" className="flex flex-col gap-3">
              <div>
                <PasswordInput
                  placeholder="New password (min 6 chars)"
                  value={form.newPassword}
                  onChange={(v) => set("newPassword", v)}
                  onBlur={() => blurValidate("newPassword", validatePassword)}
                  autoComplete="off"
                  disabled={busy}
                />
                <FieldError msg={fieldErrors.newPassword} />
              </div>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Update password" />
            </form>
            <p className="text-zinc-600 text-xs text-center mt-4">
              You'll be taken back to sign in after updating.
            </p>
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
      // "username" tells the browser this is for username/email but we pair
      // it with a readOnly password so it won't autofill the pair.
      autoComplete="username"
      inputMode="email"
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

function TextInput({
  placeholder, value, onChange, onBlur, autoComplete, disabled,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void; autoComplete?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoComplete={autoComplete ?? "off"}
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

/**
 * Prevents browser autofill by starting as readOnly and becoming editable on
 * first focus. The browser only autofills writable fields on mount, so this
 * blocks the credential-manager from pre-populating saved passwords.
 */
function PasswordInput({
  placeholder, value, onChange, onBlur, autoComplete, disabled,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void; autoComplete?: string; disabled?: boolean;
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
      autoComplete={autoComplete ?? "off"}
      disabled={disabled}
      className={INPUT_CLASS}
    />
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-400 text-[11px] font-bold mt-1.5 ml-1">{msg}</p>;
}

function InboxNote({ email }: { email: string }) {
  return (
    <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <Mail className="w-5 h-5 text-[#CCFF00] shrink-0 mt-0.5" />
      <p className="text-xs text-zinc-400 leading-relaxed">
        A 6-digit code has been sent to{" "}
        <span className="text-white font-bold">{email}</span>.{" "}
        Check your spam folder if it doesn't arrive within a minute.
        The code expires in <span className="text-[#CCFF00]">10 minutes</span>.
      </p>
    </div>
  );
}

function ResendBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 mx-auto mt-4 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest disabled:opacity-40"
    >
      <RefreshCw className="w-3 h-3" /> Resend code
    </button>
  );
}

function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy}
      className="bg-[#CCFF00] text-black font-black uppercase tracking-widest text-xs py-3 rounded-2xl hover:bg-[#b3ff00] transition disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="text-red-400 text-xs font-bold uppercase tracking-widest">{msg}</div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 -ml-0.5"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </button>
  );
}

function SwitchMode({ label, action, onClick }: { label: string; action: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-6 w-full text-center"
    >
      {label} <span className="text-[#CCFF00]">{action}</span>
    </button>
  );
}
