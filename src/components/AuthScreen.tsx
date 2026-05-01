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

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [view, setView] = useState<View>("login");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const resetToLogin = () => {
    setView("login");
    setForm(EMPTY);
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
    wrap(async () => {
      await login(form.email, form.password);
    });
  };

  // ── Signup step 1: validate + send OTP ────────────────────────────────────
  const handleSignupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      if (!form.displayName.trim()) throw new Error("Display name is required.");
      if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
      await requestOTP(form.email, "signup");
      setView("signup-otp");
    });
  };

  // ── Signup step 2: verify OTP → create account ────────────────────────────
  const handleSignupVerify = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      if (form.otp.length < 6) throw new Error("Please enter the full 6-digit code.");
      const ok = verifyOTP(form.email, form.otp, "signup");
      if (!ok) throw new Error("Incorrect or expired code. Please try again.");
      await signup(form.email, form.password, form.displayName);
    });
  };

  // ── Forgot step 1: send OTP ────────────────────────────────────────────────
  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      await requestOTP(form.email, "reset");
      setView("forgot-otp");
    });
  };

  // ── Forgot step 2: verify OTP ─────────────────────────────────────────────
  const handleForgotVerify = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(async () => {
      if (form.otp.length < 6) throw new Error("Please enter the full 6-digit code.");
      const ok = verifyOTP(form.email, form.otp, "reset");
      if (!ok) throw new Error("Incorrect or expired code. Please try again.");
      setView("reset-password");
      setError(null);
    });
  };

  // ── Forgot step 3: new password ───────────────────────────────────────────
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
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
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <AuthInput type="email" placeholder="Email" value={form.email}
                onChange={(v) => set("email", v)} autoComplete="email" disabled={busy} />
              <AuthInput type="password" placeholder="Password" value={form.password}
                onChange={(v) => set("password", v)} autoComplete="current-password" disabled={busy} />
              <button type="button"
                onClick={() => { setView("forgot-email"); setError(null); }}
                className="text-[#CCFF00]/70 hover:text-[#CCFF00] text-xs font-bold uppercase tracking-widest text-right -mt-1 self-end"
              >
                Forgot password?
              </button>
              <ErrorMsg msg={error} />
              <SubmitBtn busy={busy} label="Sign in" />
            </form>
            <SwitchMode label="Need an account?" action="Sign up"
              onClick={() => { setView("signup"); setForm(EMPTY); setError(null); }} />
          </>
        )}

        {/* ── SIGNUP FORM ───────────────────────────────────────────────────── */}
        {view === "signup" && (
          <>
            <BackBtn onClick={resetToLogin} />
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8">
              Create your account
            </p>
            <form onSubmit={handleSignupRequest} className="flex flex-col gap-3">
              <AuthInput type="text" placeholder="Display name" value={form.displayName}
                onChange={(v) => set("displayName", v)} autoComplete="name" disabled={busy} />
              <AuthInput type="email" placeholder="Email" value={form.email}
                onChange={(v) => set("email", v)} autoComplete="email" disabled={busy} />
              <AuthInput type="password" placeholder="Password (min 6 chars)" value={form.password}
                onChange={(v) => set("password", v)} autoComplete="new-password" disabled={busy} />
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
            <form onSubmit={handleSignupVerify} className="flex flex-col gap-5">
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
              Enter the email address tied to your account and we'll send a verification code.
            </p>
            <form onSubmit={handleForgotRequest} className="flex flex-col gap-3">
              <AuthInput type="email" placeholder="Email" value={form.email}
                onChange={(v) => set("email", v)} autoComplete="email" disabled={busy} />
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
            <form onSubmit={handleForgotVerify} className="flex flex-col gap-5">
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
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <AuthInput type="password" placeholder="New password (min 6 chars)" value={form.newPassword}
                onChange={(v) => set("newPassword", v)} autoComplete="new-password" disabled={busy} />
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 mx-auto mt-4 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest disabled:opacity-40"
    >
      <RefreshCw className="w-3 h-3" /> Resend code
    </button>
  );
}

function AuthInput({ type, placeholder, value, onChange, autoComplete, disabled }: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete} disabled={disabled}
      className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50 disabled:opacity-50"
    />
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
