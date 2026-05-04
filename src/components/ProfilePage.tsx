import React, { useState } from 'react';
import { ArrowLeft, LogOut, Edit2, User, Target, Mail, IdCard } from 'lucide-react';
import clsx from 'clsx';
import { PageProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { GoalModal } from './GoalModal';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

function shortId(id: string): string {
  // Take the first 8 chars, lowercased, for a friendly display.
  return id.slice(0, 8).toLowerCase();
}

export function ProfilePage({ onBack, goals, setGoals, profile, setProfile }: PageProps) {
  const { user, logout } = useAuth();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // ProfilePage only renders inside the authenticated AppShell, so user is
  // never null in practice — guard for type-safety only.
  if (!user) return null;

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
        <div className="w-24 h-24 rounded-full bg-[#CCFF00] flex items-center justify-center text-black font-black italic text-3xl shadow-lg shadow-[#CCFF00]/10 mb-4 select-none">
          {initialsOf(user.displayName)}
        </div>
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
        onEdit={() => setIsGoalModalOpen(true)}
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
            <Row label="Goal" value={GOAL_LABELS[profile.goal] ?? '—'} />
            {profile.goal !== 'maintain' && profile.targetWeight !== undefined && (
              <Row
                label="Target weight"
                value={`${profile.targetWeight} ${profile.weightUnit}`}
              />
            )}
            {profile.goal !== 'maintain' && profile.speed && (
              <Row label="Pace" value={SPEED_LABELS[profile.speed] ?? '—'} />
            )}
          </>
        ) : (
          <EmptyState
            message="Add your body metrics to unlock personalised macro recommendations."
            cta="Add metrics"
            onClick={() => setIsGoalModalOpen(true)}
          />
        )}
      </Card>

      {/* Daily Goals */}
      <Card
        title="Daily Goals"
        icon={<Target className="w-3.5 h-3.5 text-[#CCFF00]" />}
        onEdit={() => setIsGoalModalOpen(true)}
      >
        <Row label="Calories" value={`${goals.calories} kcal`} highlight />
        <Row label="Carbs" value={`${goals.carbs} g`} />
        <Row label="Protein" value={`${goals.protein} g`} />
        <Row label="Fat" value={`${goals.fat} g`} />
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

// ── Sub-components ───────────────────────────────────────────────────────────

function capitalize(s: string | undefined): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Card({
  title,
  icon,
  onEdit,
  children,
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
  label,
  value,
  highlight,
  mono,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
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
          highlight ? 'text-[#CCFF00]' : 'text-white',
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
  message,
  cta,
  onClick,
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
