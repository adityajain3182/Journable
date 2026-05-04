import React from 'react';
import { Goal, FoodItem, WaterEntry, WeightEntry } from '../hooks/useNutrition';
import { UserProfile } from '../lib/gemini';
import { StreakView } from '../components/StreakView';
import { WaterTracker } from '../components/WaterTracker';
import { WeightTracker } from '../components/WeightTracker';

// ─── Standard prop contract for every full-page view ─────────────────────────
//
// AppShell builds one PageProps object and hands it to whichever page is
// active. Each page uses only the fields it needs — extra ones are ignored.
// When a new page needs data that isn't here yet, add it once to PageProps
// and AppShell, no other file changes required.
//
export interface PageProps {
  onBack: () => void;
  userId: string;

  // Nutrition
  goals: Goal;
  setGoals: (g: Goal) => void;
  foods: FoodItem[];
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;

  // Water
  waterEntries: WaterEntry[];
  addWaterEntry: (input: { amount: number; dateString: string }) => void;
  removeWaterEntry: (id: string) => void;

  // Weight
  weightEntries: WeightEntry[];
  addWeightEntry: (input: { weight: number; unit: 'kg' | 'lbs'; dateString: string }) => void;
  removeWeightEntry: (id: string) => void;
}

// ─── Modal identifiers ────────────────────────────────────────────────────────

export type ModalId = 'goals';

// ─── Route entries ────────────────────────────────────────────────────────────

type PageEntry = {
  kind: 'page';
  id: string;
  component: React.ComponentType<PageProps>;
};

type ModalEntry = {
  kind: 'modal';
  id: string;
  modal: ModalId;
};

export type RouteEntry = PageEntry | ModalEntry;

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// To add a new page:
//   1. Create the component in src/components/ implementing PageProps
//   2. Import it here and add one entry below
//   3. AppShell and Drawer need no changes
//
export const ROUTES: RouteEntry[] = [
  // ── Pages ────────────────────────────────────────────────────────────────
  { kind: 'page', id: 'streak', component: StreakView },
  { kind: 'page', id: 'water',  component: WaterTracker },
  { kind: 'page', id: 'weight', component: WeightTracker },
  // { kind: 'page', id: 'reminders', component: RemindersView },
  // { kind: 'page', id: 'groups',    component: GroupsView },

  // ── Modals ───────────────────────────────────────────────────────────────
  { kind: 'modal', id: 'goals', modal: 'goals' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPageComponent(id: string): React.ComponentType<PageProps> | null {
  const entry = ROUTES.find((r) => r.id === id);
  if (!entry || entry.kind !== 'page') return null;
  return entry.component;
}

export function getModalForRoute(id: string): ModalId | null {
  const entry = ROUTES.find((r) => r.id === id);
  if (!entry || entry.kind !== 'modal') return null;
  return entry.modal;
}
