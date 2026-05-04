import { UserProfile } from './gemini';
import { WeightEntry } from '../hooks/useNutrition';

/**
 * Summarises where the user is on their weight goal — drives the motivational
 * one-liner shown above the daily-goals card on the profile page.
 */
export type GoalSummary =
  | { kind: 'no-profile' }                              // Body metrics not set yet
  | { kind: 'no-target' }                               // Goal type set but targetWeight missing
  | { kind: 'maintain'; weight: number; unit: 'kg' | 'lbs' }
  | { kind: 'reached';  verb: 'lose' | 'gain' }
  | { kind: 'progress'; verb: 'lose' | 'gain';
      amount: number; unit: 'kg' | 'lbs'; weeks: number };

// Generally-accepted safe rates of weight change, in kg/week.
const RATE_KG_PER_WEEK = {
  mild:       0.25,
  moderate:   0.50,
  aggressive: 0.75,
};

const KG_PER_LB = 2.20462;

export function buildGoalSummary(
  profile: UserProfile | null,
  weightEntries: WeightEntry[],
): GoalSummary {
  if (!profile) return { kind: 'no-profile' };

  if (profile.goal === 'maintain') {
    return { kind: 'maintain', weight: profile.weight, unit: profile.weightUnit };
  }

  if (profile.targetWeight === undefined || profile.targetWeight === null) {
    return { kind: 'no-target' };
  }

  // Most recent weight entry trumps profile.weight, since the profile value
  // is only updated when the user re-enters body metrics.
  const sortedDesc = [...weightEntries].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
  let currentWeight = profile.weight;
  let sourceUnit: 'kg' | 'lbs' = profile.weightUnit;
  if (sortedDesc.length > 0) {
    currentWeight = sortedDesc[0].weight;
    sourceUnit    = sortedDesc[0].unit;
  }

  // Normalise to the profile's preferred unit so the user reads consistent
  // numbers regardless of which unit they logged today's weight in.
  if (sourceUnit !== profile.weightUnit) {
    currentWeight =
      profile.weightUnit === 'kg'
        ? currentWeight / KG_PER_LB
        : currentWeight * KG_PER_LB;
    currentWeight = Math.round(currentWeight * 10) / 10;
  }

  const diff =
    profile.goal === 'lose'
      ? currentWeight - profile.targetWeight
      : profile.targetWeight - currentWeight;

  if (diff <= 0) {
    return { kind: 'reached', verb: profile.goal };
  }

  const baseRateKg = RATE_KG_PER_WEEK[profile.speed ?? 'moderate'];
  const ratePerWeek =
    profile.weightUnit === 'lbs' ? baseRateKg * KG_PER_LB : baseRateKg;
  const weeks = Math.max(1, Math.round(diff / ratePerWeek));

  return {
    kind: 'progress',
    verb: profile.goal,
    amount: Math.round(diff * 10) / 10,
    unit: profile.weightUnit,
    weeks,
  };
}
