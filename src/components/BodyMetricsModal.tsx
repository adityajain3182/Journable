import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { UserProfile } from '../lib/gemini';

interface BodyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

const GENDERS = ['male', 'female', 'other'] as const;

/**
 * Slim editor for the four body fields the user wanted exposed: gender, age,
 * weight, height (with units). Intentionally does NOT call calculateMacros —
 * goal/targetWeight/speed (and the macro plan) live in GoalModal.
 *
 * If a profile already exists, those extra fields are preserved on save.
 * If no profile exists yet, we default goal to 'maintain' so the
 * UserProfile shape stays well-formed.
 */
export function BodyMetricsModal({ isOpen, onClose, profile, onSave }: BodyMetricsModalProps) {
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [height, setHeight] = useState<string>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-hydrate the form whenever the modal opens so it reflects the latest
  // profile (and so editing twice doesn't show stale draft values).
  useEffect(() => {
    if (!isOpen) return;
    setGender(profile?.gender ?? '');
    setAge(profile?.age != null ? String(profile.age) : '');
    setWeight(profile?.weight != null ? String(profile.weight) : '');
    setWeightUnit(profile?.weightUnit ?? 'kg');
    setHeight(profile?.height != null ? String(profile.height) : '');
    setHeightUnit(profile?.heightUnit ?? 'cm');
    setError(null);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = () => {
    setError(null);
    const ageN = Number(age);
    const weightN = Number(weight);
    const heightN = Number(height);
    if (!gender) return setError('Please choose a gender.');
    if (!Number.isFinite(ageN) || ageN <= 0 || ageN > 120) return setError('Enter a valid age (1–120).');
    if (!Number.isFinite(weightN) || weightN <= 0)   return setError('Enter a valid weight.');
    if (!Number.isFinite(heightN) || heightN <= 0)   return setError('Enter a valid height.');

    setSaving(true);
    // Preserve goal-related fields if the user already had a profile so we
    // don't wipe their target / pace / goal type when only editing metrics.
    const next: UserProfile = {
      gender,
      age: ageN,
      weight: weightN,
      weightUnit,
      height: heightN,
      heightUnit,
      goal: profile?.goal ?? 'maintain',
      ...(profile?.targetWeight !== undefined && { targetWeight: profile.targetWeight }),
      ...(profile?.speed !== undefined          && { speed: profile.speed }),
    };
    onSave(next);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Body Metrics</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold mb-6">
          Update the basics — your plan won't be regenerated.
        </p>

        <div className="space-y-5">
          <Field label="Gender">
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={clsx(
                    'py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-colors',
                    gender === g
                      ? 'bg-[#CCFF00] text-black border-[#CCFF00]'
                      : 'bg-[#1A1A1A] text-zinc-400 border-zinc-800 hover:border-zinc-600'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Age">
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
            />
          </Field>

          <Field label="Weight">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                step="0.1"
                className="flex-1 bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
              />
              <UnitToggle<'kg' | 'lbs'> units={['kg', 'lbs']} value={weightUnit} onChange={setWeightUnit} />
            </div>
          </Field>

          <Field label="Height">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={heightUnit === 'cm' ? '180' : '5.10'}
                step="0.1"
                className="flex-1 bg-[#1A1A1A] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#CCFF00]/50"
              />
              <UnitToggle<'cm' | 'ft'> units={['cm', 'ft']} value={heightUnit} onChange={setHeightUnit} />
            </div>
          </Field>

          {error && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl hover:bg-[#b3ff00] transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save metrics
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">{label}</label>
      {children}
    </div>
  );
}

// Two-option toggle. We accept any string union as long as `units` lists the
// two valid values explicitly — TS can then infer T from `value` / `onChange`.
function UnitToggle<T extends string>(props: {
  units: readonly [T, T];
  value: T;
  onChange: (v: T) => void;
}) {
  const { units, value, onChange } = props;
  return (
    <div className="flex border border-zinc-800 rounded-2xl overflow-hidden">
      {units.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={clsx(
            'px-4 text-xs font-bold uppercase tracking-widest transition-colors',
            value === u
              ? 'bg-[#CCFF00] text-black'
              : 'bg-[#1A1A1A] text-zinc-400 hover:text-white'
          )}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
