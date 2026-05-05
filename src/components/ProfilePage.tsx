import React, { useRef, useState } from 'react';
import {
  ArrowLeft, LogOut, Edit2, User, Target, Mail, IdCard, Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { PageProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { GoalModal } from './GoalModal';
import { BodyMetricsModal } from './BodyMetricsModal';
import { buildGoalSummary, GoalSummary } from '../lib/goalSummary';

const PHOTO_MAX_PX = 256;     // resize uploads down to keep localStorage lean
const PHOTO_QUALITY = 0.85;

const GOAL_LABELS: Record<string, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain weight',
  gain: 'Gain weight',
};

const SPEED_LABELS: Record<string, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function capitalize(s: string | undefined): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function shortId(id: string): string {
  return id.slice(0, 8).toLowerCase();
}

/** Resize the uploaded image to a square and return a JPEG data URL. */
async function fileToDataURL(file: File, maxPx: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error('Read failed'));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload  = () => resolve(i);
    i.onerror = () => reject(new Error('Image decode failed'));
    i.src = dataUrl;
  });
  const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export function ProfilePage({
  onBack,
  goals, setGoals,
  profile, setProfile,
  weightEntries,
  photo, setPhoto,
}: PageProps) {
  const { user, logout } = useAuth();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const summary = buildGoalSummary(profile, weightEntries);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please pick an image file.');
      return;
    }
    setPhotoError(null);
    try {
      const dataUrl = await fileToDataURL(file, PHOTO_MAX_PX, PHOTO_QUALITY);
      setPhoto(dataUrl);
    } catch {
      setPhotoError("Couldn't read that image. Try another one.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12 font-sans">
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goals={goals}
        onSave={setGoals}
        profile={profile}
        onSaveProfile={setProfile}
      />
      <BodyMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        profile={profile}
        onSave={setProfile}
      />

      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-10 pb-4">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-7 h-7" strokeWidth={2} />
        </button>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">
          Profile
        </h1>
      </header>

      {/* Avatar + identity */}
      <section className="flex flex-col items-center px-6 mb-8 mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <div className="relative w-24 h-24 mb-5">
          {/* Avatar — image when set, lime initials chip otherwise */}
          <div
            className={clsx(
              'w-full h-full rounded-full overflow-hidden shadow-lg shadow-[#CCFF00]/10',
              !photo && 'bg-[#CCFF00] flex items-center justify-center'
            )}
          >
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-black font-black italic text-3xl select-none">
                {initialsOf(user.displayName)}
              </span>
            )}
          </div>

          {/* Edit / delete overlay — fixed at the bottom-left of the circle */}
          <div className="absolute bottom-0 left-0 flex gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={photo ? 'Change profile photo' : 'Upload profile photo'}
              className="w-7 h-7 rounded-full bg-[#CCFF00] hover:bg-[#b3ff00] text-black flex items-center justify-center shadow-md ring-2 ring-[#050505] focus:outline-none focus:ring-[#CCFF00] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                aria-label="Remove profile photo"
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 flex items-center justify-center shadow-md ring-2 ring-[#050505] focus:outline-none focus:ring-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {photoError && (
          <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest mb-3">{photoError}</p>
        )}

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          {user.displayName}
        </h2>
        <p className="text-zinc-500 text-xs tracking-wide">
          {user.email}
        </p>
      </section>

      {/* Account */}
      <Card title="Account" icon={<Mail className="w-3.5 h-3.5 text-[#CCFF00]" />}>
        <Row label="Display name" value={user.displayName} />
        <Row label="Email" value={user.email} />
        <Row
          label="User ID"
          value={shortId(user.id)}
          mono
          icon={<IdCard className="w-3 h-3 text-zinc-600" />}
        />
      </Card>

      {/* Body Metrics */}
      <Card
        title="Body Metrics"
        icon={<User className="w-3.5 h-3.5 text-[#CCFF00]" />}
        onEdit={() => setIsMetricsModalOpen(true)}
      >
        {profile ? (
          <>
            <Row label="Gender" value={capitalize(profile.gender) || '—'} />
            <Row label="Age" value={profile.age ? `${profile.age} years` : '—'} />
            <Row
              label="Weight"
              value={profile.weight ? `${profile.weight} ${profile.weightUnit}` : '—'}
            />
            <Row
              label="Height"
              value={profile.height ? `${profile.height} ${profile.heightUnit}` : '—'}
            />
            {/* Goal-related fields here are read-only — change them via Daily Goals */}
            <Row label="Goal" value={GOAL_LABELS[profile.goal] ?? '—'} muted />
            {profile.goal !== 'maintain' && profile.targetWeight !== undefined && (
              <Row
                label="Target weight"
                value={`${profile.targetWeight} ${profile.weightUnit}`}
                muted
              />
            )}
            {profile.goal !== 'maintain' && profile.speed && (
              <Row label="Pace" value={SPEED_LABELS[profile.speed] ?? '—'} muted />
            )}
          </>
        ) : (
          <EmptyState
            message="Add your body metrics to unlock a personalised plan."
            cta="Add metrics"
            onClick={() => setIsMetricsModalOpen(true)}
          />
        )}
      </Card>

      {/* Daily Goals */}
      <Card
        title="Daily Goals"
        icon={<Target className="w-3.5 h-3.5 text-[#CCFF00]" />}
        onEdit={() => setIsGoalModalOpen(true)}
      >
        <SummaryHeadline summary={summary} onAddTarget={() => setIsGoalModalOpen(true)} />
        <div className="border-t border-zinc-800/40 -mx-5 mt-1" />
        <Row label="Calories" value={`${goals.calories} kcal`} highlight />
        <Row label="Carbs"    value={`${goals.carbs} g`} />
        <Row label="Protein"  value={`${goals.protein} g`} />
        <Row label="Fat"      value={`${goals.fat} g`} />
      </Card>

      {/* Sign out */}
      <div className="px-6 mt-8">
        <button
          onClick={logout}
          className="w-full bg-[#1A1A1A] border border-zinc-800 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryHeadline({
  summary, onAddTarget,
}: {
  summary: GoalSummary;
  onAddTarget: () => void;
}) {
  const text = (() => {
    switch (summary.kind) {
      case 'no-profile':
        return null; // headline is the "Add target" CTA below
      case 'no-target':
        return null;
      case 'maintain':
        return `Maintaining at ${summary.weight} ${summary.unit}.`;
      case 'reached':
        return `You've reached your target. Time to set a new one.`;
      case 'progress':
        return `On track to ${summary.verb} ${summary.amount} ${summary.unit} in the next ${summary.weeks} week${summary.weeks !== 1 ? 's' : ''}.`;
    }
  })();

  if (text) {
    return (
      <p className="text-white text-[13px] leading-snug font-medium py-3">
        {text}
      </p>
    );
  }

  // No target yet — surface the CTA inside the card.
  return (
    <div className="py-3 flex flex-col gap-1">
      <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold">
        No target set yet
      </p>
      <button
        onClick={onAddTarget}
        className="text-[#CCFF00] hover:text-[#b3ff00] text-sm font-bold tracking-tight self-start"
      >
        Add target now →
      </button>
    </div>
  );
}

function Card({
  title, icon, onEdit, children,
}: {
  title: string;
  icon?: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 mb-3">
      <div className="bg-[#1A1A1A] rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {title}
            </h3>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-[#CCFF00] hover:text-[#b3ff00] text-[10px] font-bold uppercase tracking-widest"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
        <div className="px-5 py-2">{children}</div>
      </div>
    </section>
  );
}

function Row({
  label, value, highlight, muted, mono, icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/30 last:border-b-0 gap-3">
      <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold shrink-0">
        {label}
      </span>
      <span
        className={clsx(
          'text-sm font-bold flex items-center gap-1.5 truncate',
          highlight ? 'text-[#CCFF00]' : muted ? 'text-zinc-400' : 'text-white',
          mono && 'font-mono text-xs'
        )}
        title={value}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  message, cta, onClick,
}: {
  message: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="py-3 flex flex-col items-start gap-3">
      <p className="text-zinc-500 text-xs leading-relaxed">{message}</p>
      <button
        onClick={onClick}
        className="text-[#CCFF00] hover:text-[#b3ff00] text-[11px] font-bold uppercase tracking-widest"
      >
        {cta} →
      </button>
    </div>
  );
}
